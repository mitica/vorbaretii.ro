/**
 * Nivelarea unui fișier audio la un loudness-țintă (ADR-030, reopen a5): ffmpeg
 * măsoară (`ebur128`), câștigul se aplică (`volume`) și fișierul se rescrie —
 * stingurile de marcă ies din ElevenLabs la niveluri întâmplătoare (−10 … −40
 * LUFS pe aceeași cerere), iar filmul le vrea la nivelul vocii. ffmpeg lipsă →
 * oprire pe nume, ca la compoziție.
 */

import { spawnSync } from "child_process";
import { renameSync } from "fs";
import { gainDb, parseLoudness } from "../video/sting";

/** ffmpeg cu argumentele date; întoarce stderr-ul (rapoartele filtrelor). */
export function runFfmpeg(args: string[]): string {
  const run = spawnSync("ffmpeg", ["-hide_banner", "-y", ...args], { encoding: "utf8" });
  if (run.error) throw new Error("ffmpeg lipsește — instalează-l (brew install ffmpeg)");
  if (run.status !== 0) throw new Error(`ffmpeg a eșuat: ${run.stderr.slice(-300)}`);
  return run.stderr;
}

/** Loudness-ul integrat al fișierului, în LUFS. */
export function measureLoudness(file: string): number {
  return parseLoudness(runFfmpeg(["-i", file, "-af", "ebur128", "-f", "null", "-"]));
}

/** Rescrie fișierul la `targetLufs`; întoarce câștigul aplicat (dB). */
export function levelTo(file: string, targetLufs: number): number {
  const gain = gainDb(measureLoudness(file), targetLufs);
  const leveled = `${file}.leveled.mp3`;
  runFfmpeg([
    "-i",
    file,
    "-af",
    `volume=${gain.toFixed(2)}dB`,
    "-c:a",
    "libmp3lame",
    "-b:a",
    "128k",
    leveled,
  ]);
  renameSync(leveled, file);
  return gain;
}

/** Vârful real (true peak) al fișierului, în dBTP — ultimul „Peak" din rezumatul ebur128 cu peak=true. */
export function measureTruePeak(file: string): number {
  const summary = runFfmpeg(["-i", file, "-af", "ebur128=peak=true", "-f", "null", "-"]);
  const peaks = [...summary.matchAll(/Peak:\s*(-?[\d.]+) dBFS/g)].map((m) => Number(m[1]));
  if (peaks.length === 0) throw new Error(`ebur128 fără vârf pentru ${file}`);
  return peaks[peaks.length - 1]!;
}

export type MasterTarget = { lufs: number; truePeak: number };
/** Marja sub plafonul de vârf lăsată codării mp3 (overshoot-ul codecului), în dB. */
const ENCODER_HEADROOM_DB = 0.5;

/** loudnorm în două treceri (măsurare, apoi aplicare liniară) — rescrie fișierul ca mp3 mono 44,1 kHz 128k. */
export function masterTo(file: string, target: MasterTarget): void {
  const base = `I=${target.lufs}:TP=${(target.truePeak - ENCODER_HEADROOM_DB).toFixed(1)}:LRA=11`;
  const report = runFfmpeg([
    "-i",
    file,
    "-af",
    `loudnorm=${base}:print_format=json`,
    "-f",
    "null",
    "-",
  ]);
  const json = report.slice(report.lastIndexOf("{"), report.lastIndexOf("}") + 1);
  const m = JSON.parse(json) as Record<string, string>;
  const measured = `measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}`;
  const mastered = `${file}.mastered.mp3`;
  runFfmpeg([
    ...["-i", file, "-af", `loudnorm=${base}:${measured}:linear=true`],
    ...["-ar", "44100", "-ac", "1", "-c:a", "libmp3lame", "-b:a", "128k", mastered],
  ]);
  renameSync(mastered, file);
}
