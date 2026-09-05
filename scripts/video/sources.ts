/**
 * Izvoarele filmului (ADR-015): articolul, alinierea integralei → timeline-ul,
 * calea integralei și garda masterelor 2k — o casă pentru manivela video și
 * pentru previzualizările stingurilor. Orice lipsă oprește pe nume.
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";
import type { Article } from "../../app/articole/content/schema";
import { articleAudioSpec } from "../../app/articole/audio-naming";
import {
  articleTimeline,
  type Alignment,
  type TimelineSegment,
} from "../../app/articole/beat-timing";
import { masterImagePath } from "./background";
import { bandFor, shotAnchors } from "./shots";

const CONTENT_DIR = join(__dirname, "../../app/articole/content");
const AUDIO_ROOT = join(__dirname, "../../public/assets/audio/articole");
const SVG_DIR = join(__dirname, "../../public/assets/images/articole");

export type FilmSources = { article: Article; timeline: TimelineSegment[]; audioPath: string };

/** Garda izvoarelor: fiecare ancoră trebuie să aibă masterul 2k pe disc. */
function assertMastersExist(slug: string, article: Article, timeline: TimelineSegment[]): void {
  const shots = shotAnchors(article, timeline, bandFor(article));
  const anchors = new Set([...shots.map((s) => s.anchor), "erou"]);
  const missing = [...anchors].filter((anchor) => !existsSync(masterImagePath(slug, anchor)));
  if (missing.length === 0) return;
  const svgCarried = missing.filter((anchor) => existsSync(join(SVG_DIR, `${slug}-${anchor}.svg`)));
  if (svgCarried.length > 0)
    throw new Error(
      `ancorele ${svgCarried.join(", ")} sunt purtate de SVG — video-ul cere masterul raster (regenerează-le pe ramura API a manivelei de imagini)`
    );
  throw new Error(
    `lipsesc masterele 2k: ${missing.map((a) => masterImagePath(slug, a)).join(", ")} — generează-le întâi (manivela de imagini)`
  );
}

/** Articolul, timeline-ul din aliniere și integrala — cu masterele verificate. */
export function loadFilmSources(slug: string): FilmSources {
  const articlePath = join(CONTENT_DIR, `${slug}.json`);
  if (!existsSync(articlePath)) throw new Error(`articolul "${slug}" nu există (${articlePath})`);
  const article = JSON.parse(readFileSync(articlePath, "utf8")) as Article;
  const audioSpec = articleAudioSpec(article);
  const audioDir = join(AUDIO_ROOT, slug);
  if (!existsSync(join(audioDir, audioSpec.file)))
    throw new Error(`articolul "${slug}" n-are integrala audio — fă-i întâi audio (ADR-014)`);
  const alignment = JSON.parse(
    readFileSync(join(audioDir, audioSpec.alignmentFile), "utf8")
  ) as Alignment;
  const timeline = articleTimeline(article, alignment);
  assertMastersExist(slug, article, timeline);
  return { article, timeline, audioPath: join(audioDir, audioSpec.file) };
}
