/**
 * Pista audio a filmului (ADR-030), pur în argumente: stingul de întâmpinare
 * (tăiat sau pad-uit EXACT la `STINGS.intro.seconds`), integrala, tăcerea
 * întrebării, stingul de încheiere (la `STINGS.outro.seconds`), coada outro-ului —
 * lipite în ffmpeg și tăiate pe intervalul randat. Fără `-ss` pe intrări: probele
 * taie din pista întreagă, sincronul rămâne al ceasului filmului. Intrarea 0 e
 * video-ul de pe stdin.
 */

import { OUTRO, QUESTION, STINGS } from "./config";
import type { TimeRange } from "./film";
import type { StingRole } from "./sting";

export type AudioInputs = { audioPath: string; stingPaths: Record<StingRole, string> };

const FORMAT = "aformat=sample_rates=44100:channel_layouts=stereo";
const SILENCE = "anullsrc=r=44100:cl=stereo";
export const sec = (n: number): string => n.toFixed(3);
/** O intrare tăiată sau pad-uită EXACT la durata dată, în formatul cerut (stingurile fixe). */
export const fixedTrim = (seconds: number, format: string): string =>
  `atrim=0:${sec(seconds)},apad=whole_dur=${sec(seconds)},${format}`;
const fixed = (seconds: number): string => fixedTrim(seconds, FORMAT);

/** Graful de filtre: [1] întâmpinarea, [2] integrala, [3] încheierea. */
function audioFilter(range: TimeRange): string {
  const tail = sec(OUTRO.seconds - STINGS.outro.seconds);
  const cut = `atrim=${sec(range.start)}:${sec(range.end)},asetpts=PTS-STARTPTS`;
  return [
    `[1:a]${fixed(STINGS.intro.seconds)}[s1]`,
    `[2:a]${FORMAT}[a]`,
    `${SILENCE},atrim=0:${sec(QUESTION.seconds)}[q]`,
    `[3:a]${fixed(STINGS.outro.seconds)}[s2]`,
    `${SILENCE},atrim=0:${tail}[t]`,
    `[s1][a][q][s2][t]concat=n=5:v=0:a=1,${cut}[out]`,
  ].join(";");
}

/** Argumentele ffmpeg ale pistei: intrările (după video), graful, maparea. */
export function audioArgs(inputs: AudioInputs, range: TimeRange): string[] {
  return [
    ...["-i", inputs.stingPaths.intro, "-i", inputs.audioPath, "-i", inputs.stingPaths.outro],
    ...["-filter_complex", audioFilter(range)],
    ...["-map", "0:v", "-map", "[out]"],
  ];
}
