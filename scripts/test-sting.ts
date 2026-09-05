/**
 * Legea stingului de marcă (ADR-030): trei prompturi distincte, corpul cererii
 * de efecte sonore în limitele API-ului și ale filmului (0,5–2,5 s), influența
 * promptului în [0, 1]. Mecanismul, nu gustul — alegerea variantei e a operatorului.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { STING_PROMPTS, stingRequestBody } from "./video/sting";

test("ADR-030: trei prompturi de sting, distincte și nevide", () => {
  assert.equal(STING_PROMPTS.length, 3);
  assert.equal(new Set(STING_PROMPTS).size, 3, "prompturile trebuie să difere");
  for (const prompt of STING_PROMPTS) assert.ok(prompt.trim().length > 20);
});

test("ADR-030: corpul cererii — durata în [0,5; 2,5] s, influența în [0, 1], textul = promptul", () => {
  const body = stingRequestBody(STING_PROMPTS[0]);
  assert.equal(body.text, STING_PROMPTS[0]);
  assert.ok(body.duration_seconds >= 0.5 && body.duration_seconds <= 2.5);
  assert.ok(body.prompt_influence >= 0 && body.prompt_influence <= 1);
  assert.ok(body.output_format.startsWith("mp3_"));
});
