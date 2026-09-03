/**
 * Legea servirii (decizia operatorului, 2026-09-03): paginile nu servesc
 * niciodată imaginea brută. Respinge: master brut de articol în public/
 * (doar variantele -768/-1536 au voie), variante peste bugetul de greutate,
 * suprafețe de articol fără srcset/lazy. Corpusul gol trece vid — legea are
 * obiect doar când există imagini de articol.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const PUBLIC_IMAGES = join(process.cwd(), "public/assets/images");
const MAX_SERVED_BYTES = 300 * 1024;

function articleImages(): string[] {
  return readdirSync(PUBLIC_IMAGES).filter((f) => f.startsWith("articol-") && f.endsWith(".jpg"));
}

test("niciun master brut în public — doar variantele servite -768/-1536", () => {
  const raw = articleImages().filter((f) => !/-(768|1536)\.jpg$/.test(f));
  assert.deepEqual(raw, [], `mastere brute servibile: ${raw.join(", ")}`);
});

test("fiecare variantă servită ține bugetul de 300KB", () => {
  const over = articleImages().filter(
    (f) => statSync(join(PUBLIC_IMAGES, f)).size > MAX_SERVED_BYTES
  );
  assert.deepEqual(over, [], `peste buget: ${over.join(", ")}`);
});

test("suprafețele de articol servesc responsive: srcSet + loading lazy", () => {
  const surfaces = ["app/articole/components/article-shell.tsx", "app/articole/page.tsx"];
  for (const file of surfaces) {
    const source = readFileSync(join(process.cwd(), file), "utf8");
    assert.ok(source.includes("srcSet"), `${file}: imaginile n-au srcSet`);
    assert.ok(/loading=.*lazy/.test(source), `${file}: imaginile n-au loading lazy`);
  }
});
