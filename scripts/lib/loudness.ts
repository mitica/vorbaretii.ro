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

function ffmpeg(args: string[]): string {
  const run = spawnSync("ffmpeg", ["-hide_banner", "-y", ...args], { encoding: "utf8" });
  if (run.error) throw new Error("ffmpeg lipsește — instalează-l (brew install ffmpeg)");
  if (run.status !== 0) throw new Error(`ffmpeg a eșuat: ${run.stderr.slice(-300)}`);
  return run.stderr;
}

/** Loudness-ul integrat al fișierului, în LUFS. */
export function measureLoudness(file: string): number {
  return parseLoudness(ffmpeg(["-i", file, "-af", "ebur128", "-f", "null", "-"]));
}

/** Rescrie fișierul la `targetLufs`; întoarce câștigul aplicat (dB). */
export function levelTo(file: string, targetLufs: number): number {
  const gain = gainDb(measureLoudness(file), targetLufs);
  const leveled = `${file}.leveled.mp3`;
  ffmpeg([
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
