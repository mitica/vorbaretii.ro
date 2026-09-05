/**
 * Pista audio a filmului (ADR-030), pur în argumente: stingul (tăiat sau
 * pad-uit EXACT la STING.seconds), integrala, tăcerea întrebării, stingul din
 * nou, coada outro-ului — lipite în ffmpeg și tăiate pe intervalul randat.
 * Fără `-ss` pe intrări: probele taie din pista întreagă, sincronul rămâne
 * al ceasului filmului. Intrarea 0 e video-ul de pe stdin.
 */

import { OUTRO, QUESTION, STING } from "./config";
import type { TimeRange } from "./film";

export type AudioInputs = { audioPath: string; stingPath: string };

const FORMAT = "aformat=sample_rates=44100:channel_layouts=stereo";
const SILENCE = "anullsrc=r=44100:cl=stereo";
const sec = (n: number): string => n.toFixed(3);

/** Graful de filtre: [1] stingul, [2] integrala. */
function audioFilter(range: TimeRange): string {
  const sting = `atrim=0:${sec(STING.seconds)},apad=whole_dur=${sec(STING.seconds)},${FORMAT}`;
  const tail = sec(OUTRO.seconds - STING.seconds);
  const cut = `atrim=${sec(range.start)}:${sec(range.end)},asetpts=PTS-STARTPTS`;
  return [
    "[1:a]asplit=2[sa][sb]",
    `[sa]${sting}[s1]`,
    `[sb]${sting}[s2]`,
    `[2:a]${FORMAT}[a]`,
    `${SILENCE},atrim=0:${sec(QUESTION.seconds)}[q]`,
    `${SILENCE},atrim=0:${tail}[t]`,
    `[s1][a][q][s2][t]concat=n=5:v=0:a=1,${cut}[out]`,
  ].join(";");
}

/** Argumentele ffmpeg ale pistei: intrările (după video), graful, maparea. */
export function audioArgs(inputs: AudioInputs, range: TimeRange): string[] {
  return [
    ...["-i", inputs.stingPath, "-i", inputs.audioPath],
    ...["-filter_complex", audioFilter(range)],
    ...["-map", "0:v", "-map", "[out]"],
  ];
}
