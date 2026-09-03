/**
 * Validarea unui articol pe contractul real (schema + taxonomia comisă) —
 * aceeași respingere pe care o aplică registrul la build, dar per articol și
 * devreme: manivela îl rulează imediat după scrierea JSON-ului, ÎNAINTE de
 * generarea imaginilor, ca un text picat pe bugete să nu coste nicio imagine.
 *
 *   yarn validate-article <slug>
 *
 * Valid: raportul de cuvinte per secțiune + total + întrebări, exit 0.
 * Respins (sau slug inexistent): erorile validatorului, exit 1.
 */

import { readFileSync } from "fs";
import { join } from "path";
import { taxonomy } from "../app/articole/taxonomy";
import { validateArticle, type Article } from "../app/articole/content/schema";

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function report(article: Article): void {
  let total = 0;
  let questions = 0;
  for (const section of article.sections) {
    const words = section.beats.reduce((sum, beat) => sum + wordCount(beat.text), 0);
    total += words;
    questions += section.questions.length;
    console.log(`secțiunea "${section.id}": ${words} cuvinte`);
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
  const errors = validateArticle(raw, taxonomy);
  if (errors.length > 0) throw new Error(`articolul "${slug}" RESPINS:\n- ${errors.join("\n- ")}`);
  report(raw as Article);
  console.log(`articolul "${slug}" e VALID`);
}

try {
  main();
} catch (error) {
  console.error(String(error));
  process.exit(1);
}
