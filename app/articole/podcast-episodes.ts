/**
 * Puntea registru→feed (ADR-032): articolele cu episod, în ordinea registrului —
 * indexul ține ordinea și în pubDate. Server-only, ca registrul; consumată de ruta
 * `podcast.xml` și de lege (`scripts/test-podcast.ts`).
 */

import { articles } from "./articles";
import type { Episode } from "./podcast";

/** Un item per articol cu episod; enclosure-ul = fișierul episodului cu bytes-urii exacți. */
export function episodesFrom(base: string): Episode[] {
  return articles
    .filter((entry) => entry.audio !== null)
    .map((entry, index) => ({
      slug: entry.slug,
      title: entry.data.title,
      summary: entry.data.summary,
      age: entry.data.age,
      published: entry.data.published,
      index,
      enclosure: {
        url: `${base}${entry.audio!.episode.src}`,
        bytes: entry.audio!.episode.bytes,
        seconds: entry.audio!.episode.seconds,
      },
    }));
}
