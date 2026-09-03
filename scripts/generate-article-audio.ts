/**
 * Generatorul audio al articolului — casa unică a mecanicii ElevenLabs
 * (ADR-013). Bucăți: `00-titlu` + `NN-<sectionId>` (beat-urile secțiunii,
 * concatenate pe `voce ?? text` — tagurile de emoții stau în JSON).
 *
 *   yarn generate-article-audio <slug> [titlu|<sectionId>]
 *
 * Chei: ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID (.env-ul site-ului,
 * necomis) — verificate ÎNAINTE de a atinge discul; modelul:
 * ELEVENLABS_MODEL (fallback: eleven_v3). Ieșirea:
 * public/assets/audio/articole/<slug>/ — comisă cu PR-ul de audio; rularea
 * completă mătură bucățile străine rămase (redenumiri de secțiuni).
 */

import "dotenv/config";
import { mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";
import type { Article } from "../app/articole/content/schema";
import { withRetry } from "./retry";

const CONTENT_DIR = join(__dirname, "../app/articole/content");
const OUT_ROOT = join(__dirname, "../public/assets/audio/articole");

type Piece = { name: string; text: string };

/**
 * Setările vocii — aceleași pentru TOATE bucățile (fără ele, fiecare apel API
 * iese cu alt ton; setările = canonul de voce al operatorului, 2026-09-03).
 */
const VOICE_SETTINGS = { stability: 0.5, similarity_boost: 0.75, speed: 1.0 };

function pieces(article: Article): Piece[] {
  const sections = article.sections.map((s, index) => ({
    name: `${String(index + 1).padStart(2, "0")}-${s.id}`,
    text: s.beats.map((b) => b.voce ?? b.text).join(" "),
  }));
  return [{ name: "00-titlu", text: article.title }, ...sections];
}

function requireKeys(): { key: string; voice: string } {
  const key = process.env.ELEVENLABS_API_KEY;
  const voice = process.env.ELEVENLABS_VOICE_ID;
  if (!key || !voice) throw new Error("ELEVENLABS_API_KEY / ELEVENLABS_VOICE_ID lipsă din .env");
  return { key, voice };
}

async function callApi(text: string): Promise<Buffer> {
  const { key, voice } = requireKeys();
  const model = process.env.ELEVENLABS_MODEL ?? "eleven_v3";
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_64`,
    {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ text, model_id: model, voice_settings: VOICE_SETTINGS }),
    }
  );
  if (!response.ok)
    throw new Error(`ElevenLabs HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
  return Buffer.from(await response.arrayBuffer());
}

/** Rularea completă șterge fișierele care nu-s bucăți așteptate (ADR-013). */
function prune(outDir: string, all: Piece[]): void {
  const expected = new Set(all.map((p) => `${p.name}.mp3`));
  for (const file of readdirSync(outDir))
    if (!expected.has(file)) {
      unlinkSync(join(outDir, file));
      console.log(`șters străin: ${file}`);
    }
}

async function main(): Promise<void> {
  const [slug, only] = process.argv.slice(2);
  if (!slug) throw new Error("folosire: yarn generate-article-audio <slug> [titlu|<sectionId>]");
  requireKeys();
  const raw = readFileSync(join(CONTENT_DIR, `${slug}.json`), "utf8");
  const all = pieces(JSON.parse(raw) as Article);
  const selected = only
    ? all.filter((p) => (p.name === "00-titlu" ? only === "titlu" : p.name.slice(3) === only))
    : all;
  if (selected.length === 0)
    throw new Error(`bucată necunoscută "${only}" — folosește "titlu" sau un id de secțiune`);
  const outDir = join(OUT_ROOT, slug);
  mkdirSync(outDir, { recursive: true });
  for (const piece of selected) {
    const audio = await withRetry(() => callApi(piece.text));
    writeFileSync(join(outDir, `${piece.name}.mp3`), audio);
    console.log(`scris ${piece.name}.mp3 (${Math.round(audio.length / 1024)}KB)`);
  }
  if (!only) prune(outDir, all);
}

main().catch((error: unknown) => {
  console.error(String(error));
  process.exit(1);
});
