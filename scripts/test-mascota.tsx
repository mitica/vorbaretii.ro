/**
 * Legea mascotei (harnessul privat: ADR-017 — o sursă vectorială, doar
 * atribute de prezentare). Fiecare ipostază randează un SVG pe care canvas-ul
 * video îl desenează întocmai: fără CSS intern (canvas-ul îl ignoră), aripile
 * ca un desen refolosit, pixelii cheie în culorile geometriei. Verificat pe
 * @napi-rs/canvas — același drum ca stratul video de mai târziu.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { renderToStaticMarkup } from "react-dom/server";
import { STARI, gaitaSvg, type Stare } from "../app/components/mascota/gaita";
import Mascota from "../app/components/mascota/mascota";

const SIZE = 512;
const K = SIZE / 240;
const PARTI = [
  "tot",
  "aripa-st-jos",
  "aripa-st-sus",
  "aripa-dr-jos",
  "aripa-dr-sus",
  "sprancene",
  "ochi-deschisi",
  "pupila",
  "lucire",
  "pleoape",
  "ochi-fericiti",
  "cioc-jos",
  "mot",
];

type Pixel = { x: number; y: number };

async function randeaza(stare: Stare, faza: number) {
  const svg = gaitaSvg(stare, faza).replace(
    'viewBox="0 0 240 240"',
    `viewBox="0 0 240 240" width="${SIZE}" height="${SIZE}"`
  );
  const image = await loadImage(Buffer.from(svg));
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#FFFBF0";
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.drawImage(image, 0, 0, SIZE, SIZE);
  return (p: Pixel) => {
    const d = ctx.getImageData(Math.round(p.x * K), Math.round(p.y * K), 1, 1).data;
    return "#" + [d[0], d[1], d[2]].map((v) => v!.toString(16).padStart(2, "0")).join("");
  };
}

const FOND = "#fffbf0";

for (const stare of STARI) {
  for (const faza of [0, 0.3]) {
    test(`${stare} @${faza}: SVG valid, doar atribute, toate părțile (ADR-017)`, async () => {
      const svg = gaitaSvg(stare, faza);
      assert.ok(svg.startsWith("<svg xmlns"), "ADR-017 — ieșirea începe cu <svg xmlns");
      assert.ok(svg.includes('xmlns:xlink="http://www.w3.org/1999/xlink"'), "ADR-017 — xlink");
      assert.ok(!svg.includes("<style"), "ADR-017 — fără <style>: canvas-ul îl ignoră");
      assert.ok(!svg.includes("style="), "ADR-017 — fără style=: doar atribute de prezentare");
      for (const parte of PARTI)
        assert.ok(svg.includes(`class="${parte}`), `ADR-017 — partea „${parte}” lipsește`);
      await randeaza(stare, faza);
    });
  }
}

test("liniște @0: pixelii geometriei (corp, burtă, petec, creastă, ochi, cioc, picior)", async () => {
  const px = await randeaza("liniste", 0);
  assert.equal(px({ x: 120, y: 78 }), "#3e4394", "ADR-017 — corpul");
  assert.equal(px({ x: 120, y: 160 }), "#81c5f4", "ADR-017 — burta");
  assert.equal(px({ x: 46, y: 160 }), "#15181d", "ADR-017 — dunga petecului stâng");
  assert.equal(px({ x: 194, y: 160 }), "#15181d", "ADR-017 — dunga petecului drept");
  assert.equal(px({ x: 120, y: 30 }), "#ff66a6", "ADR-017 — creasta");
  assert.equal(px({ x: 97, y: 96 }), "#121315", "ADR-017 — pupila (ochii deschiși)");
  assert.equal(px({ x: 95, y: 70.5 }), "#15181d", "ADR-017 — sprânceana");
  assert.equal(px({ x: 100, y: 114 }), "#15181d", "ADR-017 — mustața");
  assert.equal(px({ x: 120, y: 104 }), "#ffc526", "ADR-017 — ciocul");
  assert.equal(px({ x: 99, y: 200 }), "#febb24", "ADR-017 — piciorul");
  assert.equal(px({ x: 34, y: 90 }), FOND, "ADR-017 — aripa ridicată e invizibilă în liniște");
});

test("salut @0: aripa stângă ridicată vizibilă, cea de jos ascunsă", async () => {
  const px = await randeaza("salut", 0);
  assert.notEqual(px({ x: 34, y: 90 }), FOND, "ADR-017 — aripa ridicată trebuie să se vadă");
  assert.notEqual(px({ x: 46, y: 160 }), "#15181d", "ADR-017 — aripa de jos trebuie ascunsă");
});

test("bucurie @0: ochii fericiți în locul pupilei", async () => {
  const px = await randeaza("bucurie", 0);
  assert.notEqual(px({ x: 97, y: 96 }), "#121315", "ADR-017 — fără pupilă la bucurie");
  assert.equal(px({ x: 94.8, y: 88.5 }), "#121315", "ADR-017 — arcul ochiului fericit");
});

test("vorbește: gura se vede doar când ciocul e deschis (0 < faza < 0.5); faza 0 = repaus", async () => {
  const repaus = await randeaza("vorbeste", 0);
  const deschis = await randeaza("vorbeste", 0.3);
  const inchis = await randeaza("vorbeste", 0.7);
  assert.equal(
    repaus({ x: 120, y: 113 }),
    "#feab2b",
    "ADR-017 — la faza 0 ciocul e închis (ipostaza de repaus sub prefers-reduced-motion)"
  );
  assert.equal(deschis({ x: 120, y: 113 }), "#e0405a", "ADR-017 — gura la faza 0.3");
  assert.notEqual(inchis({ x: 120, y: 113 }), "#e0405a", "ADR-017 — ciocul închis la faza 0.7");
});

test("gândește @0: privirea sus, aripa dreaptă ieșită în lateral", async () => {
  const liniste = await randeaza("liniste", 0);
  const gandeste = await randeaza("gandeste", 0);
  assert.equal(liniste({ x: 97, y: 103 }), "#121315", "ADR-017 — pupila jos la liniște");
  assert.equal(gandeste({ x: 97, y: 103 }), "#ffffff", "ADR-017 — pupila a urcat la gândește");
  assert.equal(gandeste({ x: 97, y: 82 }), "#121315", "ADR-017 — pupila sus la gândește");
  assert.equal(liniste({ x: 200, y: 140 }), "#353a85", "ADR-017 — aripa la corp la liniște");
  assert.equal(
    gandeste({ x: 200, y: 140 }),
    "#3e93e9",
    "ADR-017 — petecul aripii ieșite la gândește"
  );
});

test("componenta Mascota: wrapper decorativ cu data-stare, mărime și SVG-ul inline", () => {
  const html = renderToStaticMarkup(<Mascota stare="salut" marime={64} />);
  assert.ok(html.startsWith("<span"), "ADR-017 — wrapper span");
  assert.ok(html.includes('aria-hidden="true"'), "ADR-017 — decorativă");
  assert.ok(html.includes('data-stare="salut"'), "ADR-017 — starea pe wrapper armează animațiile");
  assert.ok(/class="[^"]*\bgroup\b/.test(html), "ADR-017 — grupul Tailwind pentru group-data");
  assert.ok(html.includes("h-16 w-16"), "ADR-017 — mărimea 64");
  assert.ok(html.includes("<svg xmlns"), "ADR-017 — SVG-ul inline din sursa unică");
});
