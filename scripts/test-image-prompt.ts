/**
 * Testele șablonului de prompt al imaginilor de articol. Stilul comun trăiește
 * într-o singură casă — scripts/generate-article-image.ts; aici i se probează
 * invariantele: stilul o dată, paleta mereu, gaița doar la erou, aspectul per
 * rol, scena intră verbatim (skill-urile trimit doar scena).
 */

import assert from "node:assert/strict";
import test from "node:test";
import { aspectFor, buildPrompt } from "./generate-article-image";

const SCENE = "Ștefan cel Mare la 25 de ani, așezându-se pe tronul Moldovei, în 1457.";

test("stilul comun apare o singură dată, la început", () => {
  const prompt = buildPrompt("tronul", SCENE);
  assert.ok(prompt.startsWith("Flat playful children's-book illustration"));
  assert.equal(prompt.match(/Flat playful/g)?.length, 1);
});

test("scena intră verbatim în prompt", () => {
  assert.ok(buildPrompt("tronul", SCENE).includes(SCENE));
});

test("paleta site-ului e în fiecare prompt", () => {
  const prompt = buildPrompt("tronul", SCENE);
  assert.ok(prompt.includes("#db2777"));
  assert.ok(prompt.includes("#4f46e5"));
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
