/**
 * Feed-ul Vorbărici — rută STATICĂ (ADR-048): `force-static` = un fișier la export
 * (`out/podcast.xml`), în clasa sitemap-ului; fără server (N2).
 *
 * Registrul comis intră aici, ziua build-ului taie fereastra (ADR-047): tot ce e
 * generat dinainte așteaptă pe disc până îi vine ziua. Ziua se citește O SINGURĂ
 * dată și se pasează mai departe — restul lanțului e pur, deci același registru
 * plus aceeași zi dau același XML.
 */

import config from "@/lib/config";
import { ritualEpisodes } from "../azi/episodes";
import { todayStamp } from "../azi/naming";
import { buildPodcastFeed, feedEpisodes } from "../azi/podcast";

export const dynamic = "force-static";

export function GET(): Response {
  const base = config.ROOT_PATH.replace(/\/$/, "");
  const episodes = feedEpisodes(base, ritualEpisodes, todayStamp(new Date()));
  return new Response(buildPodcastFeed(base, episodes), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
