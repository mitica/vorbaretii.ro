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
import { articleAudioSpec } from "./audio-naming";
import { taxonomy } from "./taxonomy";
import { rejectSlug, validateArticle, type Article } from "./content/schema";

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
  /** Integrala audio a articolului, sau null — opt-in per articol (ADR-014). */
  audio: { src: string } | null;
};

function readingMinutes(article: Article): number {
  const words = article.sections
    .flatMap((s) => s.beats)
    .reduce((sum, b) => sum + b.text.split(/\s+/).filter(Boolean).length, 0);
  return Math.max(1, Math.round(words / 130));
}

/** Ramura SVG are întâietate; raster = varianta servită canonică (1536). */
function resolveImage(slug: string, anchor: string): string {
  const svg = `/assets/images/articole/${slug}-${anchor}.svg`;
  if (existsSync(join(PUBLIC_DIR, svg))) return svg;
  const raster = `/assets/images/articol-${slug}-${anchor}-1536.jpg`;
  if (existsSync(join(PUBLIC_DIR, raster))) return raster;
  throw new Error(`articolul "${slug}": nu există fișier pentru ancora "${anchor}" (ADR-007)`);
}

/** Audio opțional: directorul slug-ului poartă integrala curentă, sau nu există (ADR-014). */
function resolveAudio(slug: string, data: Article): { src: string } | null {
  const dir = join(PUBLIC_DIR, "assets/audio/articole", slug);
  if (!existsSync(dir)) return null;
  const spec = articleAudioSpec(data);
  if (!existsSync(join(dir, spec.file)))
    throw new Error(
      `articolul "${slug}": integrala audio (${spec.file}) lipsește — textul sau setările s-au schimbat; regenerează cu yarn generate-article-audio ${slug} (ADR-014)`
    );
  return { src: `/assets/audio/articole/${slug}/${spec.file}` };
}

function loadArticle(slug: string): ArticleEntry {
  const raw: unknown = JSON.parse(readFileSync(join(CONTENT_DIR, `${slug}.json`), "utf8"));
  const errors = [...validateArticle(raw, taxonomy), ...rejectSlug(slug, taxonomy)];
  if (errors.length > 0) throw new Error(`articolul "${slug}" respins:\n- ${errors.join("\n- ")}`);
  const data = raw as Article;
  const images: Record<string, ArticleImage> = {};
  for (const il of data.illustrations)
    images[il.anchor] = { src: resolveImage(slug, il.anchor), alt: il.alt };
  return {
    slug,
    data,
    readingMinutes: readingMinutes(data),
    images,
    audio: resolveAudio(slug, data),
  };
}

/**
 * Ordinea indexului, deterministă: published desc, apoi slug asc — manivela
 * face `published` egal cazul normal (mai multe articole în aceeași zi), iar
 * fără tie-break ordinea cădea pe readdir (dependentă de sistemul de fișiere).
 */
export function compareArticles(
  a: { published: string; slug: string },
  b: { published: string; slug: string }
): number {
  return b.published.localeCompare(a.published) || a.slug.localeCompare(b.slug);
}

/** Toate articolele publicate, cele mai noi întâi. */
export const articles: ArticleEntry[] = readdirSync(CONTENT_DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => loadArticle(f.replace(/\.json$/, "")))
  .sort((a, b) =>
    compareArticles(
      { published: a.data.published, slug: a.slug },
      { published: b.data.published, slug: b.slug }
    )
  );

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
        list.push({
          id: hashId(entry.slug + "|" + q.question),
          question: q.question,
          answer: q.answer,
        });
        byCategory.set(entry.data.category, list);
      }
  return [...byCategory.entries()].map(([category, items]) => ({
    id: category,
    label: taxonomy.categories[category] ?? category,
    items,
  }));
}
