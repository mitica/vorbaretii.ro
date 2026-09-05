/**
 * Cadrele filmului (ADR-030): fiecare imagine a unui beat își primește fereastra
 * ei din aliniere (`shotWindows`), în ordinea imaginilor; titlul stă pe erou,
 * numele secțiunii pe prima imagine a primului ei beat, un beat fără imagine
 * rămâne pe ancora dinainte. Cadrele acoperă exact timeline-ul.
 */

import { shotWindows, type TimelineSegment } from "../../app/articole/beat-timing";
import { bandOf, type Band } from "../../app/articole/content/budgets";
import type { Article } from "../../app/articole/content/schema";
import { SHOT_BY_BAND } from "./config";

export type Shot = { start: number; end: number; anchor: string };

/** Banda filmului = a articolului; fără `age` valid (fixturi) → 9–11. */
export function bandFor(article: Article): Band {
  return bandOf(article.age) ?? "9-11";
}

/** Imaginile pe care le poartă un segment: beat-ul → ale lui; numele secțiunii → prima a primului beat. */
function segmentImages(article: Article, segment: TimelineSegment): string[] {
  const section = article.sections.find((s) => s.id === segment.sectionId);
  if (segment.kind === "beat") return section?.beats[segment.beatIndex!]?.images ?? [];
  const first = section?.beats[0]?.images[0];
  return first === undefined ? [] : [first];
}

type Cursor = { current: string; minShotSeconds: number };

function segmentShots(article: Article, segment: TimelineSegment, cursor: Cursor): Shot[] {
  if (segment.kind === "titlu") return [{ start: segment.start, end: segment.end, anchor: "erou" }];
  const images = segmentImages(article, segment);
  if (images.length === 0)
    return [{ start: segment.start, end: segment.end, anchor: cursor.current }];
  const windows = shotWindows(segment, images.length, cursor.minShotSeconds);
  return windows.map((window, k) => ({ ...window, anchor: images[k]! }));
}

export function shotAnchors(article: Article, timeline: TimelineSegment[], band: Band): Shot[] {
  const cursor: Cursor = { current: "erou", minShotSeconds: SHOT_BY_BAND[band].minShotSeconds };
  return timeline.flatMap((segment) => {
    const shots = segmentShots(article, segment, cursor);
    cursor.current = shots[shots.length - 1]!.anchor;
    return shots;
  });
}
