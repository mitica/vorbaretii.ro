import type { MetadataRoute } from "next";
import config from "@/lib/config";
import { articles, questionDecks } from "./articole/articles";
import { STORY_SLUG, games } from "./jocuri/games";

/** Se generează static la build (out/sitemap.xml). Rutele vin din registru. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = config.ROOT_PATH.replace(/\/$/, "");
  const now = new Date();
  const activeGames =
    questionDecks().length > 0 ? games : games.filter((g) => g.slug !== STORY_SLUG);
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: `${base}/jocuri`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/articole`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    ...articles.map((entry) => ({
      url: `${base}/articole/${entry.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...activeGames.map((game) => ({
      url: `${base}/jocuri/${game.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
