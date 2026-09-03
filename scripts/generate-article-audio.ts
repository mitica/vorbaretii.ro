/**
 * Generatorul audio al articolului — casa unică a mecanicii ElevenLabs
 * (ADR-013). Bucăți: `00-titlu` + `NN-<sectionId>` (beat-urile secțiunii,
 * concatenate pe `voce ?? text` — tagurile de emoții stau în JSON).
 *
 *   yarn generate-article-audio <slug> [titlu|<sectionId>]
 *
 * Chei: ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID (.env-ul site-ului,
 * necomis); modelul: ELEVENLABS_MODEL (fallback: eleven_v3). Ieșirea:
 * public/assets/audio/articole/<slug>/ — comisă cu PR-ul de audio.
 */

import "dotenv/config";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { Article } from "../app/articole/content/schema";
import { withRetry } from "./retry";

const CONTENT_DIR = join(__dirname, "../app/articole/content");
const OUT_ROOT = join(__dirname, "../public/assets/audio/articole");

type Piece = { name: string; text: string };

function pieces(article: Article): Piece[] {
  const sections = article.sections.map((s, index) => ({
    name: `${String(index + 1).padStart(2, "0")}-${s.id}`,
    text: s.beats.map((b) => b.voce ?? b.text).join(" "),
  }));
  return [{ name: "00-titlu", text: article.title }, ...sections];
}

async function callApi(text: string): Promise<Buffer> {
  const key = process.env.ELEVENLABS_API_KEY;
  const voice = process.env.ELEVENLABS_VOICE_ID;
  if (!key || !voice) throw new Error("ELEVENLABS_API_KEY / ELEVENLABS_VOICE_ID lipsă din .env");
  const model = process.env.ELEVENLABS_MODEL ?? "eleven_v3";
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_64`,
    {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ text, model_id: model }),
    }
  );
  if (!response.ok)
    throw new Error(`ElevenLabs HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
  return Buffer.from(await response.arrayBuffer());
}

async function main(): Promise<void> {
  const [slug, only] = process.argv.slice(2);
  if (!slug) throw new Error("folosire: yarn generate-article-audio <slug> [titlu|<sectionId>]");
  const raw = readFileSync(join(CONTENT_DIR, `${slug}.json`), "utf8");
  const article = JSON.parse(raw) as Article;
  const outDir = join(OUT_ROOT, slug);
  mkdirSync(outDir, { recursive: true });
  for (const piece of pieces(article)) {
    if (only && !piece.name.endsWith(`-${only}`) && piece.name !== `00-${only}`) continue;
    const audio = await withRetry(() => callApi(piece.text));
    const file = join(outDir, `${piece.name}.mp3`);
    writeFileSync(file, audio);
    console.log(`scris ${file} (${Math.round(audio.length / 1024)}KB)`);
  }
}

main().catch((error: unknown) => {
  console.error(String(error));
  process.exit(1);
});
