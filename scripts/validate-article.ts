/**
 * Validarea unui articol pe contractul real (schema + taxonomia comisă) —
 * aceeași respingere pe care o aplică registrul la build, dar per articol și
 * devreme: manivela îl rulează imediat după scrierea JSON-ului, ÎNAINTE de
 * generarea imaginilor, ca un text picat pe bugete să nu coste nicio imagine.
 *
 *   yarn validate-article <slug>
 *
 * Valid: raportul pe bandă — cuvinte și taguri per secțiune, corpul,
 * întrebările — exit 0. Respins (slug-cheie, buget, slug inexistent): erorile
 * validatorului, exit 1. Nicio regulă la nivel de propoziție.
 */

import { readFileSync } from "fs";
import { join } from "path";
import { taxonomy } from "../app/articole/taxonomy";
import { rejectSlug, validateArticle, type Article } from "../app/articole/content/schema";
import { bandOf, countedWords } from "../app/articole/content/budgets";
import { IMAGES_BASELINE } from "../app/articole/content/images-baseline";
import { tagCount } from "../app/articole/audio-naming";

function report(article: Article): void {
  console.log(`banda: ${bandOf(article.age)} (de la ${article.age} ani)`);
  let total = 0;
  let questions = 0;
  for (const section of article.sections) {
    const texts = section.beats.map((beat) => beat.text);
    const words = texts.reduce((sum, text) => sum + countedWords(text), 0);
    const tags = section.beats.reduce((sum, beat) => sum + tagCount(beat.voce ?? ""), 0);
    total = total + words;
    questions = questions + section.questions.length;
    console.log(`secțiunea "${section.id}": ${words} cuvinte; ${tags} taguri`);
  }
  console.log(
    `corp: ${total} cuvinte; secțiuni: ${article.sections.length}; întrebări: ${questions}`
  );
}

function main(): void {
  const slug = process.argv[2];
  if (!slug) throw new Error("folosire: yarn validate-article <slug>");
  const file = join(__dirname, "..", "app", "articole", "content", `${slug}.json`);
  const raw: unknown = JSON.parse(readFileSync(file, "utf8"));
  const options = { legacyImages: IMAGES_BASELINE.includes(slug) };
  const errors = [...validateArticle(raw, taxonomy, options), ...rejectSlug(slug, taxonomy)];
  if (errors.length > 0) throw new Error(`articolul "${slug}" RESPINS:\n- ${errors.join("\n- ")}`);
  report(raw as Article);
  if (options.legacyImages)
    console.log(
      "scutit de legea celor două imagini pe beat (images-baseline.ts) — completează a doua imagine și șterge intrarea (GATE-0060)"
    );
  console.log(`articolul "${slug}" e VALID`);
}

try {
  main();
} catch (error) {
  console.error(String(error));
  process.exit(1);
}
