/**
 * Testele șablonului de prompt al imaginilor de articol. Stilul-marcă trăiește
 * într-o singură casă — scripts/generate-article-image.ts; aici i se probează
 * invariantele, agnostic la textul stilului: stilul o dată la început, fără
 * mascotă în prompturi (element animat separat, la video), aspect UNIC 16:9
 * pentru toate imaginile (cadrele video au aceeași mărime), scena verbatim,
 * niciun element cultural impus de șablon (modelul le pune din context).
 */

import assert from "node:assert/strict";
import test from "node:test";
import { ASPECT, STYLE, buildPrompt } from "./generate-article-image";

const SCENE = "Ștefan cel Mare la 25 de ani, așezându-se pe tronul Moldovei, în 1457.";

test("stilul comun apare o singură dată, la început", () => {
  const prompt = buildPrompt(SCENE);
  assert.ok(prompt.startsWith(STYLE));
  assert.equal(prompt.split(STYLE).length - 1, 1);
});

test("scena intră verbatim în prompt", () => {
  assert.ok(buildPrompt(SCENE).includes(SCENE));
});

test("șablonul nu impune elemente culturale — vin doar din scenă", () => {
  const prompt = buildPrompt("A child receives a small gift, early spring.");
  assert.ok(!/folk|Romanian|embroidery|traditional motif/i.test(prompt));
});

test("mascota nu apare în niciun prompt — element animat separat, la video", () => {
  assert.ok(!/jay|bird|mascot/i.test(buildPrompt(SCENE)));
});

test("aspect unic: toate imaginile sunt 16:9 — cadrele video au aceeași mărime", () => {
  assert.equal(ASPECT, "16:9");
  assert.ok(buildPrompt(SCENE).includes("Aspect ratio 16:9"));
  assert.ok(!buildPrompt(SCENE).includes("3:2"));
});

test("subiecții reali: șablonul cere înfățișarea cunoscută, consecventă", () => {
  assert.ok(buildPrompt(SCENE).includes("real people"));
  assert.ok(buildPrompt(SCENE).includes("consistent"));
});

test("fără text, fără cruzimi — în fiecare prompt", () => {
  assert.ok(buildPrompt(SCENE).includes("No text, no gore"));
});
