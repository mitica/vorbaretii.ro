/**
 * Testele șablonului de prompt al imaginilor de articol. Stilul-marcă trăiește
 * într-o singură casă — scripts/generate-article-image.ts; aici i se probează
 * invariantele, agnostic la textul stilului: stilul o dată la început, fără
 * mascotă în prompturi (element animat separat, la video), mărimea și aspectul
 * ca parametri API și nu proză (16:9 la 2k, identice pentru toate — cadrele
 * video), scena verbatim, niciun element cultural impus de șablon (modelul le
 * pune din context).
 */

import assert from "node:assert/strict";
import test from "node:test";
import { ASPECT, DEFAULT_STYLE, RESOLUTION, STYLES, buildPrompt } from "./generate-article-image";

const SCENE = "Ștefan cel Mare la 25 de ani, așezându-se pe tronul Moldovei, în 1457.";

test("stilul implicit apare o singură dată, la început", () => {
  const styleText = STYLES[DEFAULT_STYLE];
  assert.ok(styleText, "DEFAULT_STYLE trebuie să existe în registrul STYLES");
  const prompt = buildPrompt(SCENE);
  assert.ok(prompt.startsWith(styleText));
  assert.equal(prompt.split(styleText).length - 1, 1);
});

test("stilul se alege pe nume; un stil nou = o intrare în registru", () => {
  STYLES["stil-de-proba"] = "Test style prefix.";
  try {
    assert.ok(buildPrompt(SCENE, "stil-de-proba").startsWith("Test style prefix."));
  } finally {
    delete STYLES["stil-de-proba"];
  }
});

test("stil necunoscut → respins, cu lista stilurilor în mesaj", () => {
  assert.throws(() => buildPrompt(SCENE, "nu-exista"), /stil necunoscut.*hartie-decupata/);
});

test("scena intră verbatim în prompt", () => {
  assert.ok(buildPrompt(SCENE).includes(SCENE));
});

test("niciun stil nu impune elemente culturale — vin doar din scenă", () => {
  for (const style of Object.keys(STYLES)) {
    const prompt = buildPrompt("A child receives a small gift, early spring.", style);
    assert.ok(!/folk|Romanian|embroidery|traditional motif/i.test(prompt), `stilul "${style}"`);
  }
});

test("mascota nu apare în niciun stil — element animat separat, la video", () => {
  for (const style of Object.keys(STYLES))
    assert.ok(!/jay|bird|mascot/i.test(buildPrompt(SCENE, style)), `stilul "${style}"`);
});

test("mărimea și aspectul sunt parametri API, nu proză: 16:9 la 2k pentru toate", () => {
  assert.equal(ASPECT, "16:9");
  assert.equal(RESOLUTION, "2k");
  assert.ok(!/aspect ratio|16:9|3:2|1280|1920/i.test(buildPrompt(SCENE)));
});

test("subiecții reali: șablonul cere înfățișarea cunoscută, consecventă", () => {
  assert.ok(buildPrompt(SCENE).includes("real people"));
  assert.ok(buildPrompt(SCENE).includes("consistent"));
});

test("fără text, fără cruzimi — în fiecare prompt", () => {
  assert.ok(buildPrompt(SCENE).includes("No text, no gore"));
});

test("stilul casei: albastrul de Voroneț e culoarea PRIMARĂ, nu dominantă — lucrurile își păstrează culoarea", () => {
  const house = STYLES["vorbaretii"]!;
  assert.ok(
    !/dominant/i.test(house),
    "albastrul nu e „dominant” — verdictul operatorului pe primul articol"
  );
  assert.ok(/PRIMARY/.test(house), "albastrul e numit culoarea PRIMARĂ de brand");
  assert.ok(/natural colour/i.test(house), "restul lumii își păstrează culoarea naturală");
  assert.ok(
    /green/i.test(house) && /wood/i.test(house) && /skin/i.test(house),
    "verdele, lemnul, pielea sunt numite"
  );
});
