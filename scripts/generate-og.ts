/**
 * Imaginile sociale (og:image), 1200×630 — câte una per joc + una pentru
 * indexul /jocuri. Se randează cu Playwright dintr-un șablon HTML în paleta
 * mărcii (D6) și SE COMIT în public/assets/og/. Rulează după ce adaugi un joc:
 *
 *   yarn generate-og
 */

import { mkdirSync, readFileSync } from "fs";
import { join } from "path";
import { chromium } from "playwright";
import { articles } from "../app/articole/articles";
import { games } from "../app/jocuri/games";

const OUT = join(__dirname, "..", "public", "assets", "og");

type Card = {
  slug: string;
  emojis: string[];
  eyebrow: string;
  title: string;
  tagline: string;
  /** Titlurile lungi (prima pagină) coboară sub cei 82px impliciți. */
  titleSize?: number;
  /** Fotografie din public/ în locul emoji-urilor (cardul primei pagini). */
  photo?: string;
};

const cards: Card[] = [
  {
    slug: "home",
    emojis: [],
    photo: "assets/images/girl-video-call-friends-896.jpg",
    eyebrow: "Online, de la 7 ani",
    title: "Club de socializare în română pentru copiii din diaspora.",
    tagline: "Nu curs. Prieteni. Prima lecție e gratuită.",
    titleSize: 56,
  },
  {
    slug: "jocuri",
    emojis: ["🎡", "🔮", "🎲"],
    eyebrow: "Gratuit, fără cont",
    title: "Jocuri în română pentru copii",
    tagline: "Roata cuvintelor, ghicitori, zarurile de poveste și altele.",
  },
  {
    slug: "articole",
    emojis: ["📜", "🏰", "🎈"],
    eyebrow: "Lucruri adevărate despre România",
    title: "Articole în română pentru copii",
    tagline: "Istorie, tradiții, locuri — cu întrebări de joc la final.",
  },
  ...articles.map((entry) => ({
    slug: entry.slug,
    emojis: [],
    photo: entry.images.erou ? entry.images.erou.src.slice(1) : undefined,
    eyebrow: "Lucruri adevărate despre România",
    title: entry.data.title + ".",
    tagline: "Un articol pentru copii, cu surse la vedere și întrebări de joc.",
    titleSize: 56,
  })),
  ...games.map((game) => ({
    slug: game.slug,
    emojis: [game.emoji],
    eyebrow: "Jocuri în română pentru copii",
    title: game.title,
    tagline: game.tagline,
  })),
];

function styles(card: Card) {
  return `
    * { margin: 0; box-sizing: border-box; }
    body {
      width: 1200px; height: 630px; overflow: hidden;
      font-family: -apple-system, "Segoe UI", Roboto, sans-serif;
      background: linear-gradient(to bottom, rgb(214,219,220), #ffffff);
      display: flex; align-items: center; gap: 56px; padding: 72px;
      position: relative;
    }
    .blob {
      position: absolute; border-radius: 9999px; filter: blur(80px); opacity: .3;
    }
    .text { position: relative; flex: 1; min-width: 0; }
    .eyebrow {
      color: #4F46E5; font-size: 30px; font-weight: 700;
      letter-spacing: .14em; text-transform: uppercase;
    }
    h1 {
      margin-top: 22px; color: #111827; font-size: ${card.titleSize ?? 82}px;
      font-weight: 800; letter-spacing: -0.02em; line-height: 1.08;
    }
    .tagline { margin-top: 26px; color: #4B5563; font-size: 36px; line-height: 1.35; }
    .brand { margin-top: 44px; font-size: 34px; font-weight: 700; color: #111827; }
    .brand b { color: #BE185D; font-size: 40px; }
    .card {
      position: relative; display: flex; gap: 24px; align-items: center; justify-content: center;
      background: #ffffff; border: 3px solid #FBCFE8; border-radius: 48px;
      width: 380px; height: 380px; flex-shrink: 0; overflow: hidden;
      box-shadow: 0 20px 45px rgba(190, 24, 93, .12);
    }
    .card img { width: 100%; height: 100%; object-fit: cover; }
  `;
}

function html(card: Card) {
  const emojiSize = card.emojis.length > 1 ? 150 : 240;
  const photoMime = card.photo?.endsWith(".svg") ? "image/svg+xml" : "image/jpeg";
  const right = card.photo
    ? `<img src="data:${photoMime};base64,${readFileSync(
        join(__dirname, "..", "public", card.photo)
      ).toString("base64")}">`
    : card.emojis.map((emoji) => `<span style="font-size:${emojiSize}px">${emoji}</span>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>${styles(card)}</style></head><body>
    <div class="blob" style="left:-120px;top:-120px;width:420px;height:420px;background:#ff80b5"></div>
    <div class="blob" style="right:-120px;bottom:-140px;width:460px;height:460px;background:#9089fc"></div>
    <div class="text">
      <div class="eyebrow">${card.eyebrow}</div>
      <h1>${card.title}</h1>
      <div class="tagline">${card.tagline}</div>
      <div class="brand"><b>V</b>orbăreții.ro</div>
    </div>
    <div class="card">${right}</div>
  </body></html>`;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  for (const card of cards) {
    await page.setContent(html(card), { waitUntil: "networkidle" });
    const file = join(OUT, `${card.slug}.png`);
    await page.screenshot({ path: file });
    console.log(`scris ${file}`);
  }
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
