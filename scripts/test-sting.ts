/**
 * Legea stingurilor de marcă (ADR-030, reopen a5): două familii — întâmpinarea
 * (intro) și încheierea (outro) — cu câte două prompturi distincte, DESCRIPTIVE
 * (scopul, nu detalii tehnice: fără cifre, secunde, Hz); corpul cererii de efecte
 * sonore în limitele API-ului și ale filmului. Mecanismul, nu gustul — alegerea
 * variantei e a operatorului.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { OUTRO, STINGS, STING_LOUDNESS } from "./video/config";
import { measureLoudness } from "./lib/loudness";
import { gainDb, parseLoudness, STING_PROMPTS, stingRequestBody } from "./video/sting";

const TECHNICAL = /\d|second|hz\b|bpm|decibel|\bdb\b|khz|ms\b/i;

test("ADR-030: două familii de prompturi, câte două, distincte, descriptive — fără detalii tehnice", () => {
  const all = [...STING_PROMPTS.intro, ...STING_PROMPTS.outro];
  assert.equal(STING_PROMPTS.intro.length, 2);
  assert.equal(STING_PROMPTS.outro.length, 2);
  assert.equal(new Set(all).size, 4, "prompturile trebuie să difere");
  for (const prompt of all) {
    assert.ok(prompt.trim().length > 40, `promptul spune ce vrem: „${prompt}”`);
    assert.ok(!TECHNICAL.test(prompt), `fără detalii tehnice: „${prompt}”`);
  }
});

test("ADR-030: corpul cererii — textul = promptul, durata cerută, influența în [0, 1], mp3", () => {
  const body = stingRequestBody(STING_PROMPTS.outro[0], STINGS.outro.seconds);
  assert.equal(body.text, STING_PROMPTS.outro[0]);
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
