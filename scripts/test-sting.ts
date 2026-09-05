/**
 * Legea stingurilor de marcă (ADR-030, reopen a5): două familii — întâmpinarea
 * (intro) și încheierea (outro) — cu câte două prompturi distincte, DESCRIPTIVE
 * (scopul, nu detalii tehnice: fără cifre, secunde, Hz); corpul cererii de efecte
 * sonore în limitele API-ului și ale filmului. Mecanismul, nu gustul — alegerea
 * variantei e a operatorului.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { OUTRO, STINGS, STING_LOUDNESS, STING_PREVIEW } from "./video/config";
import { levelTo, measureLoudness } from "./lib/loudness";
import {
  gainDb,
  parseLoudness,
  previewName,
  previewWindow,
  STING_PROMPTS,
  stingRequestBody,
  variantFile,
} from "./video/sting";

const TECHNICAL = /\d|second|hz\b|bpm|decibel|\bdb\b|khz|ms\b/i;

test("ADR-030: două familii de prompturi, cel puțin două fiecare, distincte, descriptive, ale păsării — fără detalii tehnice", () => {
  const all = [...STING_PROMPTS.intro, ...STING_PROMPTS.outro];
  assert.ok(STING_PROMPTS.intro.length >= 2 && STING_PROMPTS.outro.length >= 2);
  assert.equal(new Set(all).size, all.length, "prompturile trebuie să difere");
  for (const prompt of all) {
    assert.ok(prompt.trim().length > 40, `promptul spune ce vrem: „${prompt}”`);
    assert.ok(!TECHNICAL.test(prompt), `fără detalii tehnice: „${prompt}”`);
    assert.ok(/\b(bird|jay|chirp)/i.test(prompt), `sunetul e al păsării: „${prompt}”`);
  }
});

test("ADR-030: corpul cererii — textul = promptul, durata cerută, influența în [0, 1], mp3", () => {
  const body = stingRequestBody(STING_PROMPTS.outro[0]!, STINGS.outro.seconds);
  assert.equal(body.text, STING_PROMPTS.outro[0]!);
  assert.equal(body.duration_seconds, STINGS.outro.seconds);
  assert.ok(body.prompt_influence >= 0 && body.prompt_influence <= 1);
  assert.ok(body.output_format.startsWith("mp3_"));
});

test("ADR-030: duratele stingurilor — intro-ul scurt, încheierea lasă coadă de tăcere în outro", () => {
  assert.ok(STINGS.intro.seconds >= 0.5 && STINGS.intro.seconds <= 2.5, "intro între 0,5 și 2,5 s");
  assert.ok(
    STINGS.outro.seconds >= 0.5 && STINGS.outro.seconds <= OUTRO.seconds - 1,
    "outro lasă ≥1 s coadă"
  );
  assert.notEqual(STINGS.intro.file, STINGS.outro.file, "două fișiere");
});

test("ADR-030: loudness-ul din rezumatul ebur128 și câștigul până la țintă", () => {
  const summary =
    "[Parsed_ebur128_0 @ 0x1] Summary:\n\n  Integrated loudness:\n    I:         -16.0 LUFS\n    Threshold: -26.3 LUFS\n";
  assert.equal(parseLoudness(summary), -16);
  assert.equal(gainDb(-16, -26), -10);
  assert.throws(() => parseLoudness("nimic"), /LUFS/);
});

test("ADR-030: stingurile comise sunt la nivelul vocii — măsurate, nu presupuse", () => {
  for (const { file } of [STINGS.intro, STINGS.outro]) {
    const path = join(process.cwd(), file);
    assert.ok(existsSync(path), `${file} e comis (ales de operator)`);
    const lufs = measureLoudness(path);
    assert.ok(
      Math.abs(lufs - STING_LOUDNESS.lufs) <= STING_LOUDNESS.tolerance,
      `${file} măsoară ${lufs} LUFS, ținta e ${STING_LOUDNESS.lufs} ± ${STING_LOUDNESS.tolerance}`
    );
  }
});

test("ADR-030: previzualizările — salutul e fereastra de la începutul filmului, rămas-bunul cea de la sfârșit; niciuna nu iese din film", () => {
  const seconds = STING_PREVIEW.seconds;
  const intro = previewWindow("intro", 193.3, seconds);
  const outro = previewWindow("outro", 193.3, seconds);
  assert.deepEqual(intro, { start: 0, end: seconds }, "salutul: de la 0");
  assert.equal(outro.end, 193.3, "rămas-bunul: până la capătul filmului");
  assert.ok(Math.abs(outro.end - outro.start - seconds) < 1e-9, "cât STING_PREVIEW.seconds");
  assert.ok(
    seconds > STINGS.intro.seconds && seconds > OUTRO.seconds,
    "fereastra cuprinde stingul și ce urmează/precede"
  );
  const short = previewWindow("outro", 4, seconds);
  assert.deepEqual(short, { start: 0, end: 4 }, "un film mai scurt decât fereastra → tot filmul");
  assert.deepEqual(previewWindow("intro", 4, seconds), { start: 0, end: 4 });
});

test("ADR-030: numele variantelor și ale previzualizărilor — per rol și index, în out-video", () => {
  assert.equal(variantFile("intro", 2), "sting-intro-2.mp3");
  assert.equal(previewName("martisorul", "outro", 3), "martisorul.sting-outro-3.mp4");
});

test("ADR-030: levelTo duce un ton sintetic la țintă (±1 LU) — măsurat, nu presupus", () => {
  const file = join(tmpdir(), `vorbaretii-level-${process.pid}.mp3`);
  const tone = ["-f", "lavfi", "-i", "sine=frequency=440:duration=2", "-af", "volume=-20dB"];
  const made = spawnSync("ffmpeg", [
    "-hide_banner",
    "-y",
    ...tone,
    "-c:a",
    "libmp3lame",
    "-b:a",
    "128k",
    file,
  ]);
  assert.equal(made.status, 0, "ffmpeg scrie tonul");
  try {
    levelTo(file, STING_LOUDNESS.lufs);
    const lufs = measureLoudness(file);
    assert.ok(
      Math.abs(lufs - STING_LOUDNESS.lufs) <= STING_LOUDNESS.tolerance,
      `tonul nivelat măsoară ${lufs} LUFS, ținta e ${STING_LOUDNESS.lufs}`
    );
  } finally {
    unlinkSync(file);
  }
});
