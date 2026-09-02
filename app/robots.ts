import type { MetadataRoute } from "next";
import config from "@/lib/config";

/** Se generează static la build (out/robots.txt). /ads e intern, nu se indexează. */
export default function robots(): MetadataRoute.Robots {
  const base = config.ROOT_PATH.replace(/\/$/, "");
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/ads/" },
    sitemap: `${base}/sitemap.xml`,
  };
}
