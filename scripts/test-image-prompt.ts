/**
 * Testele șablonului de prompt al imaginilor de articol. Stilul-marcă trăiește
 * într-o singură casă — scripts/generate-article-image.ts; aici i se probează
 * invariantele, agnostic la textul stilului: stilul o dată la început, gaița
 * doar la erou, aspectul per rol, scena verbatim, niciun element cultural
 * impus de șablon (modelul le pune din context, când subiectul le cere).
 */

import assert from "node:assert/strict";
import test from "node:test";
import { STYLE, aspectFor, buildPrompt } from "./generate-article-image";

const SCENE = "Ștefan cel Mare la 25 de ani, așezându-se pe tronul Moldovei, în 1457.";

test("stilul comun apare o singură dată, la început", () => {
  const prompt = buildPrompt("tronul", SCENE);
  assert.ok(prompt.startsWith(STYLE));
  assert.equal(prompt.split(STYLE).length - 1, 1);
});

test("scena intră verbatim în prompt", () => {
  assert.ok(buildPrompt("tronul", SCENE).includes(SCENE));
});

test("șablonul nu impune elemente culturale — vin doar din scenă", () => {
  const prompt = buildPrompt("tronul", "A child receives a small gift, early spring.");
  assert.ok(!/folk|Romanian|embroidery|traditional motif/i.test(prompt));
});

test("gaița: doar imaginea-erou o poartă", () => {
  assert.ok(buildPrompt("erou", SCENE).includes("Eurasian jay"));
  assert.ok(!buildPrompt("tronul", SCENE).includes("Eurasian jay"));
});

test("aspectul: erou 3:2, beat 16:9", () => {
  assert.equal(aspectFor("erou"), "3:2");
  assert.equal(aspectFor("tronul"), "16:9");
  assert.ok(buildPrompt("erou", SCENE).includes("3:2"));
  assert.ok(buildPrompt("tronul", SCENE).includes("16:9"));
});

test("subiecții reali: șablonul cere înfățișarea cunoscută, consecventă", () => {
  assert.ok(buildPrompt("tronul", SCENE).includes("real people"));
  assert.ok(buildPrompt("tronul", SCENE).includes("consistent"));
});

test("fără text, fără cruzimi — în fiecare prompt", () => {
  assert.ok(buildPrompt("tronul", SCENE).includes("No text, no gore"));
  assert.ok(buildPrompt("erou", SCENE).includes("No text, no gore"));
});
