/**
 * Episodul de podcast (ADR-032): integrala îmbrăcată — întâmpinarea de marcă,
 * integrala, o pauză, coada rostită (ultima întrebare, invitația, replica), o
 * pauză, încheierea — mono 44,1 kHz 128 kbps, masterizat la nivelul
 * podcasturilor. Identitatea fișierului = hash pe tot ce îl poate schimba
 * (integrala, coada, stingurile, formatul, masterizarea, pauzele): nume nou =
 * aplicațiile re-descarcă. O casă pentru generator, registru și lege.
 */

import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Article } from "../../app/articole/content/schema";
import { ARTICLE_AUDIO_FORMAT, episodeTailText } from "../../app/articole/audio-naming";
import { fixedTrim, sec } from "../video/audio-track";
import { STINGS } from "../video/config";
import type { StingRole } from "../video/sting";
import { masterTo, runFfmpeg, type MasterTarget } from "./loudness";

export const EPISODE_MASTER: MasterTarget = { lufs: -16, truePeak: -1 };
const GAPS = { beforeTail: 0.6, beforeOutro: 0.4 } as const;
const ROOT = join(__dirname, "../..");
const MONO = "aformat=sample_rates=44100:channel_layouts=mono";

/** Calea stingului comis (ADR-030); lipsa e numită pe rol și cale, nu ENOENT brut. */
export function stingPath(role: StingRole, root = ROOT): string {
  const path = join(root, STINGS[role].file);
  if (!existsSync(path)) throw new Error(`stingul ${role} lipsește: ${path} (ADR-030)`);
  return path;
}

/** Bytes-urile stingurilor comise — un sting schimbat = episod nou. */
function stingDigest(): string {
  const hash = createHash("sha256");
  for (const role of ["intro", "outro"] as const) hash.update(readFileSync(stingPath(role)));
  return hash.digest("hex").slice(0, 16);
}

type EpisodeSpec = { tailText: string; file: string };

/** Identitatea episodului: `<hash>.episode.mp3`, hash pe integrala, coada, stinguri, format, masterizare, pauze. */
export function episodeSpec(article: Article, integralFile: string): EpisodeSpec {
  const tailText = episodeTailText(article);
  const material = JSON.stringify({
    integral: integralFile,
    tailText,
    stings: stingDigest(),
    format: ARTICLE_AUDIO_FORMAT,
    master: EPISODE_MASTER,
    gaps: GAPS,
  });
  const hash = createHash("sha256").update(material).digest("hex").slice(0, 16);
  return { tailText, file: `${hash}.episode.mp3` };
}

const silence = (seconds: number): string => `anullsrc=r=44100:cl=mono,atrim=0:${sec(seconds)}`;

/** Graful ffmpeg al episodului: [0] întâmpinarea, [1] integrala, [2] coada, [3] încheierea. */
function episodeFilter(): string {
  return [
    `[0:a]${fixedTrim(STINGS.intro.seconds, MONO)}[s1]`,
    `[1:a]${MONO}[a]`,
    `${silence(GAPS.beforeTail)}[g1]`,
    `[2:a]${MONO}[t]`,
    `${silence(GAPS.beforeOutro)}[g2]`,
    `[3:a]${fixedTrim(STINGS.outro.seconds, MONO)}[s2]`,
    "[s1][a][g1][t][g2][s2]concat=n=6:v=0:a=1[out]",
  ].join(";");
}

type EpisodeInputs = { integralPath: string; tail: Buffer; out: string };

/**
 * Lipește episodul (mono 44,1 kHz 128k), îl masterizează la EPISODE_MASTER și îl
 * scrie la `out`. Coada și toate temporarele (raw-ul, intermediarul masterizării)
 * stau într-un director temporar șters la final — în directorul slug-ului ajunge
 * DOAR episodul (altfel `git add -A` le-ar comite după un ffmpeg picat).
 */
export function renderEpisode({ integralPath, tail, out }: EpisodeInputs): void {
  const work = mkdtempSync(join(tmpdir(), "vorbaretii-episode-"));
  try {
    const tailPath = join(work, "tail.mp3");
    writeFileSync(tailPath, tail);
    const raw = join(work, "raw.mp3");
    runFfmpeg([
      ...["-i", stingPath("intro"), "-i", integralPath, "-i", tailPath, "-i", stingPath("outro")],
      ...["-filter_complex", episodeFilter(), "-map", "[out]"],
      ...["-ar", "44100", "-ac", "1", "-c:a", "libmp3lame", "-b:a", "128k", raw],
    ]);
    masterTo(raw, EPISODE_MASTER);
    copyFileSync(raw, out);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}
