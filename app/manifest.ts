import type { MetadataRoute } from "next";

/**
 * Manifestul PWA — se generează static la build (out/manifest.webmanifest)
 * și Next îl leagă singur în <head>. Aplicația instalată pornește pe prima
 * pagină (decizia lui Dumitru, D17); jocurile sunt la o atingere distanță.
 *
 * Fără icon „maskable" deocamdată: V-ul umple tot cadrul și s-ar tăia în
 * masca rotundă de Android. Când vrem unul, îl generăm cu padding în
 * scripts/generate-icons.ts.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vorbăreții — Jocuri în română pentru copii",
    short_name: "Vorbăreții",
    description:
      "Jocuri în română pentru copii, gratuite și fără cont, de la clubul de socializare Vorbăreții.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#d6dbdc",
    lang: "ro",
    icons: [
      {
        src: "/assets/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/assets/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
