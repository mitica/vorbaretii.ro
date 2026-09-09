/**
 * Casa unică a căilor pentru scripturi: rădăcina repo-ului derivată O SINGURĂ
 * dată (din `__dirname` — aceeași din orice director de rulare), iar corpusul și
 * rădăcina audio construite din ea. Tot aici stau cele două citiri repetate ale
 * manivelelor și legilor: articolul comis, pe slug, și mersul recursiv prin
 * fișiere. Fără nicio citire a registrului (ADR-019).
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Article } from "../../app/articole/content/schema";

export const REPO_ROOT = join(__dirname, "../..");
/** Corpusul comis: un JSON per articol, numit cu slugul lui. */
export const CONTENT_DIR = join(REPO_ROOT, "app/articole/content");
/** Rădăcina audio servită: un director per slug (integrala, alinierea, episodul). */
export const AUDIO_ROOT = join(REPO_ROOT, "public/assets/audio/articole");

/** Articolul comis, pe slug — o casă pentru manivele și legi. */
export function loadArticleJson(slug: string): Article {
  return JSON.parse(readFileSync(join(CONTENT_DIR, `${slug}.json`), "utf8")) as Article;
}

/** Fișierele de sub `dir`, recursiv, ca fiind căi întregi; `filter` alege după numele fișierului. */
export function* walk(
  dir: string,
  filter: (name: string) => boolean = () => true
): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full, filter);
    else if (filter(entry)) yield full;
  }
}
