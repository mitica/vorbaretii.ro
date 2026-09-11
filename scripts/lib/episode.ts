/**
 * Episodul de podcast (ADR-032): integrala îmbrăcată — întâmpinarea de marcă,
 * integrala, o pauză, coada rostită (ultima întrebare, invitația, replica), o
 * pauză, încheierea — mono 44,1 kHz 128 kbps, masterizat la nivelul
 * podcasturilor. Identitatea fișierului = hash pe tot ce îl poate schimba
 * (integrala, coada, stingurile, formatul, masterizarea, pauzele): nume nou =
 * aplicațiile re-descarcă. O casă pentru generator, registru și lege.
 *
 * Tot aici stă și LIPIREA generală, din segmente (`renderSegments`, ADR-047):
 * același graf ffmpeg, dar cu feliile venite din script, nu bătute în cod.
 * Identitatea episodului zilei e altundeva (`azi-episode.ts`) — episoadele sunt
 * două, graful e unul.
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
import { ARTICLE_AUDIO_FORMAT } from "../../app/articole/audio-settings";
import { episodeTailText } from "../../app/articole/audio-naming";
import type { Segment } from "../../app/azi/episode";
import { POLISH, UTTERANCE_MASTER } from "../../app/jocuri/voice/settings";
import { fixedTrim, sec } from "../video/audio-track";
import { STINGS, STING_LOUDNESS } from "../video/config";
import type { StingRole } from "../video/sting";
import { masterTo, runFfmpeg, type MasterTarget } from "./loudness";
import { REPO_ROOT } from "./paths";

export const EPISODE_MASTER: MasterTarget = { lufs: -16, truePeak: -1 };
const GAPS = { beforeTail: 0.6, beforeOutro: 0.4 } as const;
const MONO = "aformat=sample_rates=44100:channel_layouts=mono";

/** Calea stingului comis (ADR-030); lipsa e numită pe rol și cale, nu ENOENT brut. */
export function stingPath(role: StingRole, root = REPO_ROOT): string {
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

/* ------------------------------ lipirea din segmente (ADR-047) */

/**
 * Câștigul stingurilor în episodul lipit, DERIVAT din cele două niveluri comise:
 * rostirile se măsoară la `UTTERANCE_MASTER.lufs`, stingurile la
 * `STING_LOUDNESS.lufs` (nivelul vocii din film, ADR-030). Fără el, marca ar sta
 * sub voce. Fișierele de sting NU se re-nivelează pe disc: episodul de ARTICOL le
 * folosește la nivelul lor de azi și s-ar strica.
 */
const STING_GAIN_DB = UTTERANCE_MASTER.lufs - STING_LOUDNESS.lufs;

/**
 * Estomparea capetelor unei felii, în aceleași milisecunde ca lustruirea
 * rostirilor (`POLISH`): fără ea, fiecare cusătură pocnește — o felie tăiată pe
 * vârful undei e o TREAPTĂ, iar concat-ul o lipește exact așa. Capetele
 * episodului întreg sunt capetele primei și ultimei felii, deci primesc aceeași
 * estompare.
 *
 * Ieșirea se face prin `areverse`, nu prin `afade=t=out`: acela cere momentul de
 * start, adică durata fișierului — o citire în plus per intrare, pentru un capăt
 * pe care graful îl are oricum sub mână.
 */
const FADE =
  `afade=t=in:st=0:d=${sec(POLISH.fadeInSeconds)},areverse,` +
  `afade=t=in:st=0:d=${sec(POLISH.fadeOutSeconds)},areverse`;

type SourceSegment = Exclude<Segment, { kind: "silence" }>;

/** Lanțul unei felii de pe disc: adusă la mono (stingul și tăiat la secunda compoziției), cu capetele estompate. */
function sourceChain(segment: SourceSegment, input: number): string {
  if (segment.kind === "sting")
    return (
      `[${input}:a]${fixedTrim(STINGS[segment.role].seconds, MONO)},` +
      `volume=${STING_GAIN_DB.toFixed(2)}dB,${FADE}`
    );
  return `[${input}:a]${MONO},${FADE}`;
}

/** Graful episodului: un nod per segment, în ordine, concatenate într-o singură ieșire. */
function segmentsFilter(segments: readonly Segment[]): string {
  const chains: string[] = [];
  let input = 0;
  segments.forEach((segment, index) => {
    const chain =
      segment.kind === "silence" ? silence(segment.seconds) : sourceChain(segment, input++);
    chains.push(`${chain}[n${index}]`);
  });
  const labels = segments.map((_, index) => `[n${index}]`).join("");
  return [...chains, `${labels}concat=n=${segments.length}:v=0:a=1[out]`].join(";");
}

export type SegmentRender = {
  segments: readonly Segment[];
  /** O cale per segment cu fișier (sting sau rostire), în ORDINEA segmentelor; liniștea n-are intrare. */
  inputs: readonly string[];
  out: string;
  master: MasterTarget;
  bitRate: string;
};

/**
 * Lipește un episod din segmente: fiecare felie devine un nod în `filter_complex`
 * — stingurile tăiate la secunda compoziției și ridicate la nivelul rostirilor,
 * rostirile estompate la capete, liniștile fabricate din nimic —, concat,
 * masterizare la `master`, encodare la `bitRate`. Ca la `renderEpisode`,
 * temporarele stau într-un director șters la final: lângă episod nu ajunge nimic.
 */
export function renderSegments({ segments, inputs, out, master, bitRate }: SegmentRender): void {
  const needed = segments.filter((segment) => segment.kind !== "silence").length;
  if (inputs.length !== needed)
    throw new Error(
      `ADR-047 — ${needed} segmente cu fișier, dar ${inputs.length} căi de intrare: graful ar lipi alt sunet`
    );
  const work = mkdtempSync(join(tmpdir(), "vorbaretii-segments-"));
  try {
    // Lipirea se face FĂRĂ PIERDERI, într-un fișier fără extensie (ffmpeg îl
    // recunoaște după conținut): `masterTo` îl rescrie el ca mp3, deci episodul
    // are o singură encodare cu pierderi peste rostiri, nu două. Un `raw.mp3`
    // aici ar fi costat o generație în plus pe tot ce aude copilul.
    const stage = join(work, "stage");
    runFfmpeg([
      ...inputs.flatMap((path) => ["-i", path]),
      ...["-filter_complex", segmentsFilter(segments), "-map", "[out]"],
      ...["-ar", "44100", "-ac", "1", "-f", "wav", "-c:a", "pcm_s16le", stage],
    ]);
    masterTo(stage, master, bitRate);
    copyFileSync(stage, out);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}
