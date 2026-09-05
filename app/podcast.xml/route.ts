/**
 * Feed-ul de podcast — rută STATICĂ (ADR-032): `force-static` = un fișier la
 * export (`out/podcast.xml`), în clasa sitemap-ului; fără server (N2). Un
 * articol nou cu episod devine item la build, fără pas în plus (ADR-004).
 */

import config from "@/lib/config";
import { articles } from "../articole/articles";
import { buildPodcastFeed, type Episode } from "../articole/podcast";

export const dynamic = "force-static";

/** Articolele cu episod, în ordinea registrului — indexul ține ordinea și în pubDate. */
function episodesFrom(base: string): Episode[] {
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

export function GET(): Response {
  const base = config.ROOT_PATH.replace(/\/$/, "");
  return new Response(buildPodcastFeed(base, episodesFrom(base)), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
