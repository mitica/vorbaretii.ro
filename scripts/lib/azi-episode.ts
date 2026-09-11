/**
 * Identitatea episodului zilei (ADR-047): numele fișierului = hash peste TOT ce-i
 * poate schimba sunetul — textele rostite în ordine, secundele fiecărei liniști,
 * stingurile, formatul, ținta de masterizare — PLUS bytes-urile feliilor de pe
 * disc. Fără ultima parte, o voce re-acordată sau un sting nou ar lăsa același
 * nume peste alt sunet, iar aplicațiile de podcast ar ține mai departe episodul
 * vechi: numele e singurul lucru pe care îl compară.
 *
 * Tot aici stă și PLANUL zilei: cartea ei devine script, iar fiecare segment își
 * capătă felia de pe disc. E aceeași socoteală pentru manivelă (care lipește) și
 * pentru lege (care verifică numele) — două case ar însemna două adevăruri despre
 * unde stă vocea.
 *
 * Lipirea e a lui `renderSegments` (`episode.ts`), scriptul e al lui
 * `app/azi/episode.ts` — aici nu se decide nimic despre sunet.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { todayCard } from "../../app/azi/card";
import { episodeScript, type Segment } from "../../app/azi/episode";
import { dateFromStamp } from "../../app/azi/naming";
import { hashId } from "../../app/jocuri/content/ids";
import {
  BRAND_VOICE_DIR,
  VOICE_DIR,
  baseVoiceKey,
  voiceKey,
} from "../../app/jocuri/voice/settings";
import { sec } from "../video/audio-track";
import { STINGS } from "../video/config";
import { EPISODE_MASTER, stingPath } from "./episode";

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

/* ------------------------------ planul zilei: de la carte la felii (ADR-047) */

/** Un segment cu FIȘIER: sting de marcă sau rostire. Liniștea n-are felie — se fabrică la lipire. */
type SourceSegment = Exclude<Segment, { kind: "silence" }>;

/**
 * Felia unui segment, pe disc: stingul comis, rostirea zilei sub jocul din care
 * vine, sau puntea fixă a ritualului sub marcă — puntea n-are joc, deci n-are
 * tag, deci stă în cheia de BAZĂ a vocii.
 *
 * Rădăcina vine ca argument, nu din `process.cwd()`: legea o cere pe o rădăcină
 * fabricată, manivela pe cea reală. Nu se exportă — afară pleacă PLANUL întreg,
 * ca nimeni să nu-și compună singur o a doua listă de felii.
 */
function segmentInput(segment: SourceSegment, root: string): string {
  if (segment.kind === "sting") return stingPath(segment.role, root);
  const file = `${hashId(segment.text)}.mp3`;
  const game = segment.game;
  if (game) return join(root, VOICE_DIR, game, voiceKey(game), file);
  return join(root, BRAND_VOICE_DIR, baseVoiceKey(), file);
}

export type EpisodePlan = {
  /** Scriptul zilei, segment cu segment. */
  script: Segment[];
  /** O cale per segment cu fișier, în ORDINEA segmentelor — exact ce cere `renderSegments`. */
  inputs: string[];
};

/**
 * Planul zilei: cartea ei, scriptul ei și feliile lui. Nu citește discul decât ca
 * să refuze o rădăcină fără stinguri (`stingPath`); rostirile lipsă nu opresc
 * nimic aici — ele sunt verdictul lui `missingInputs`.
 */
export function episodePlan(date: string, root: string): EpisodePlan {
  const script = episodeScript(todayCard(dateFromStamp(date)));
  const inputs = script
    .filter((segment): segment is SourceSegment => segment.kind !== "silence")
    .map((segment) => segmentInput(segment, root));
  return { script, inputs };
}

/** O rostire a zilei fără fișier pe disc: fără ea, ziua n-are cum să se compună. */
export type MissingInput = {
  /** Textul rostit — se citează în raport, ca omul să vadă CE lipsește. */
  text: string;
  /** Jocul din care vine rostirea, sau `null` pentru puntea fixă a ritualului. */
  game: string | null;
  path: string;
};

/**
 * Rostirile planului fără fișier — nucleul PUR al săriturii, ca `checkVoice`:
 * `exists` vine ca argument, deci verdictul se vede fără niciun mp3 pe disc.
 * Stingurile nu intră aici: lipsa lor a oprit deja `segmentInput`.
 */
export function missingInputs(
  plan: EpisodePlan,
  exists: (path: string) => boolean
): MissingInput[] {
  const sources = plan.script.filter(
    (segment): segment is SourceSegment => segment.kind !== "silence"
  );
  const missing: MissingInput[] = [];
  sources.forEach((segment, index) => {
    const path = plan.inputs[index] as string;
    if (segment.kind === "voice" && !exists(path))
      missing.push({ text: segment.text, game: segment.game ?? null, path });
  });
  return missing;
}

/**
 * Comanda care aduce rostirea lipsă. Cele de joc se cer pe JOC (manivela vocii
 * jocurilor le face pe toate ale lui deodată), punțile fixe se cer toate odată.
 * Mesajul e pentru OM, de-aia poartă comanda, nu doar calea.
 */
export function repairCommand(missing: MissingInput): string {
  return missing.game ? `/voce-jocuri ${missing.game}` : "yarn generate-azi-voice";
}
