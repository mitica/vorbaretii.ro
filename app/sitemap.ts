import type { MetadataRoute } from "next";
import config from "@/lib/config";
import { games } from "./jocuri/games";

/** Se generează static la build (out/sitemap.xml). Rutele vin din registru. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = config.ROOT_PATH.replace(/\/$/, "");
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: `${base}/jocuri`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9
    },
    ...games.map((game) => ({
      url: `${base}/jocuri/${game.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8
    }))
  ];
}
