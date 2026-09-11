/**
 * Identitatea episodului zilei (ADR-047): numele fișierului = hash peste TOT ce-i
 * poate schimba sunetul — textele rostite în ordine, secundele fiecărei liniști,
 * stingurile, formatul, ținta de masterizare — PLUS bytes-urile feliilor de pe
 * disc. Fără ultima parte, o voce re-acordată sau un sting nou ar lăsa același
 * nume peste alt sunet, iar aplicațiile de podcast ar ține mai departe episodul
 * vechi: numele e singurul lucru pe care îl compară.
 *
 * Doar identitatea stă aici. Lipirea e a lui `renderSegments` (`episode.ts`),
 * scriptul e al lui `app/azi/episode.ts` — aici nu se decide nimic despre sunet.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { Segment } from "../../app/azi/episode";
import { hashId } from "../../app/jocuri/content/ids";
import { sec } from "../video/audio-track";
import { STINGS } from "../video/config";
import { EPISODE_MASTER } from "./episode";

/** Formatul episodului servit: mono 44,1 kHz, 128 kbps — plaja aplicațiilor de podcast. */
export const EPISODE_FORMAT = { bitRate: 128_000, sampleRate: 44_100, channels: 1 };
/** Aceeași cifră în forma pe care o cere ffmpeg — derivată, nu scrisă a doua oară. */
export const EPISODE_BITRATE = `${EPISODE_FORMAT.bitRate / 1000}k`;

/** Amprenta unui segment: ce rostește, cât tace, ce sting și cât durează el în compoziție. */
function segmentMaterial(segment: Segment): string {
  if (segment.kind === "sting") return `sting:${segment.role}:${sec(STINGS[segment.role].seconds)}`;
  if (segment.kind === "silence") return `silence:${sec(segment.seconds)}`;
  return `voice:${segment.text}`;
}

/** Bytes-urile TUTUROR feliilor, în ordine: o voce re-acordată = episod nou, chiar cu același text. */
function inputsDigest(paths: readonly string[]): string {
  const hash = createHash("sha256");
  for (const path of paths) hash.update(readFileSync(path));
  return hash.digest("hex").slice(0, 16);
}

/**
 * Numele episodului: `<hash>.episode.mp3`. Șirul din care iese hash-ul e compus
 * EXPLICIT, câmp cu câmp, în ordinea scrisă aici — nu `JSON.stringify` peste un
 * obiect: reordonarea a două câmpuri ar schimba numele fără ca sunetul să se
 * schimbe, iar aplicațiile ar re-descărca degeaba.
 */
export function episodeFileName(script: readonly Segment[], inputPaths: readonly string[]): string {
  const format = `${EPISODE_FORMAT.bitRate}_${EPISODE_FORMAT.sampleRate}_${EPISODE_FORMAT.channels}`;
  const material =
    `${script.map(segmentMaterial).join("|")}|fmt${format}` +
    `|I${EPISODE_MASTER.lufs}|TP${EPISODE_MASTER.truePeak}|in${inputsDigest(inputPaths)}`;
  return `${hashId(material)}.episode.mp3`;
}
