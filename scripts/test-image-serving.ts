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
  assert.deepEqual(
    raw,
    [],
    `ADR-012 (paginile nu servesc imaginea brută) — mastere servibile: ${raw.join(", ")}`
  );
});

test("fiecare variantă servită ține bugetul de 300KB", () => {
  const over = articleImages().filter(
    (f) => statSync(join(PUBLIC_IMAGES, f)).size > MAX_SERVED_BYTES
  );
  assert.deepEqual(over, [], `ADR-012 — variante peste bugetul de 300KB: ${over.join(", ")}`);
});

test("suprafețele de articol servesc responsive: srcSet, sizes, lazy, dimensiuni", () => {
  const surfaces = ["app/articole/components/article-shell.tsx", "app/articole/page.tsx"];
  for (const file of surfaces) {
    const source = readFileSync(join(process.cwd(), file), "utf8");
    assert.ok(source.includes("srcSet"), `ADR-012 — ${file}: imaginile n-au srcSet`);
    assert.ok(source.includes("sizes="), `ADR-012 — ${file}: imaginile n-au sizes`);
    assert.ok(/loading=.*lazy/.test(source), `ADR-012 — ${file}: imaginile n-au loading lazy`);
    assert.ok(source.includes("width="), `ADR-012 — ${file}: imaginile n-au width intrinsec`);
    assert.ok(source.includes("height="), `ADR-012 — ${file}: imaginile n-au height intrinsec`);
  }
});
