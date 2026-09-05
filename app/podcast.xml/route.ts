/**
 * Feed-ul de podcast — rută STATICĂ (ADR-032): `force-static` = un fișier la
 * export (`out/podcast.xml`), în clasa sitemap-ului; fără server (N2). Un
 * articol nou cu episod devine item la build, fără pas în plus (ADR-004).
 */

import config from "@/lib/config";
import { buildPodcastFeed } from "../articole/podcast";
import { episodesFrom } from "../articole/podcast-episodes";

export const dynamic = "force-static";

export function GET(): Response {
  const base = config.ROOT_PATH.replace(/\/$/, "");
  return new Response(buildPodcastFeed(base, episodesFrom(base)), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
