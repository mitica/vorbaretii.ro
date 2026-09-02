/**
 * Registrul articolelor — DOAR pe server (fs la build; nicio pagină client nu
 * îl importă direct). Citește content/*.json, validează cu taxonomia reală și
 * ARUNCĂ la primul articol invalid: un articol stricat nu poate trece de
 * build. Jocul „Curiozități” își derivă pachetele de aici — o
 * singură casă pentru întrebări.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { hashId } from "../jocuri/content";
import { taxonomy } from "./taxonomy";
import { validateArticle, type Article } from "./content/schema";

const CONTENT_DIR = join(process.cwd(), "app/articole/content");
const PUBLIC_DIR = join(process.cwd(), "public");

type ArticleImage = { src: string; alt: string };
export type ArticleEntry = {
  slug: string;
  data: Article;
  /** Minute de citit, derivat din corp la build — prezentațional, nu câmp. */
  readingMinutes: number;
  /** Ancoră → fișierul real (ramura SVG sau raster), verificat la build. */
  images: Record<string, ArticleImage>;
};

function readingMinutes(article: Article): number {
  const words = article.sections
    .flatMap((s) => s.beats)
    .reduce((sum, b) => sum + b.text.split(/\s+/).filter(Boolean).length, 0);
  return Math.max(1, Math.round(words / 130));
}

/** Ramura SVG are întâietate; raster = numele plat prin compress-images. */
function resolveImage(slug: string, anchor: string): string {
  const svg = `/assets/images/articole/${slug}-${anchor}.svg`;
  if (existsSync(join(PUBLIC_DIR, svg))) return svg;
  const raster = `/assets/images/articol-${slug}-${anchor}.jpg`;
  if (existsSync(join(PUBLIC_DIR, raster))) return raster;
  throw new Error(`articolul "${slug}": nu există fișier pentru ancora "${anchor}" (ADR-007)`);
}

function loadArticle(slug: string): ArticleEntry {
  const raw: unknown = JSON.parse(readFileSync(join(CONTENT_DIR, `${slug}.json`), "utf8"));
  const errors = validateArticle(raw, taxonomy);
  if (errors.length > 0) throw new Error(`articolul "${slug}" respins:\n- ${errors.join("\n- ")}`);
  const data = raw as Article;
  const images: Record<string, ArticleImage> = {};
  for (const il of data.illustrations)
    images[il.anchor] = { src: resolveImage(slug, il.anchor), alt: il.alt };
  return { slug, data, readingMinutes: readingMinutes(data), images };
}

/** Toate articolele publicate, cele mai noi întâi. */
export const articles: ArticleEntry[] = readdirSync(CONTENT_DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => loadArticle(f.replace(/\.json$/, "")))
  .sort((a, b) => b.data.published.localeCompare(a.data.published));

type StoryQuestion = { id: string; question: string; answer: string };
export type StoryDeck = { id: string; label: string; items: StoryQuestion[] };

/** Pachetele jocului „Curiozități”: o categorie de articole = un set. */
export function getArticle(slug: string): ArticleEntry {
  const found = articles.find((a) => a.slug === slug);
  if (!found) throw new Error(`articol necunoscut: ${slug}`);
  return found;
}

export function questionDecks(): StoryDeck[] {
  const byCategory = new Map<string, StoryQuestion[]>();
  for (const entry of articles)
    for (const section of entry.data.sections)
      for (const q of section.questions) {
        const list = byCategory.get(entry.data.category) ?? [];
        list.push({ id: hashId(entry.slug + "|" + q.question), question: q.question, answer: q.answer });
        byCategory.set(entry.data.category, list);
      }
  return [...byCategory.entries()].map(([category, items]) => ({
    id: category,
    label: taxonomy.categories[category] ?? category,
    items,
  }));
}
