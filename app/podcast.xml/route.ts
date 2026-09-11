/**
 * Feed-ul Vorbărici — rută STATICĂ (ADR-048): `force-static` = un fișier la export
 * (`out/podcast.xml`), în clasa sitemap-ului; fără server (N2).
 *
 * Lista de episoade e GOALĂ până aterizează registrul: canalul rămâne valid și
 * complet fără niciun item — stare probată, nu presupusă.
 */

import config from "@/lib/config";
import { buildPodcastFeed } from "../azi/podcast";

export const dynamic = "force-static";

export function GET(): Response {
  const base = config.ROOT_PATH.replace(/\/$/, "");
  return new Response(buildPodcastFeed(base, []), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
