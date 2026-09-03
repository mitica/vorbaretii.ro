/**
 * Generatorul audio al articolului — mecanica ElevenLabs (ADR-013).
 * Identitatea fișierelor (hash pe text + setări API, refolosire pe hash
 * existent) și setările trăiesc în `app/articole/audio-naming.ts` — o casă,
 * împărțită cu registrul și cu legea din teste.
 *
 *   yarn generate-article-audio <slug> [titlu|<sectionId>]
 *
 * Chei (doar secretele): ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID (.env).
 * Ieșirea: public/assets/audio/articole/<slug>/<hash>.mp3 — comisă cu PR-ul;
 * rularea completă mătură fișierele care nu mai corespund niciunei bucăți.
 */

import "dotenv/config";
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";
import type { Article } from "../app/articole/content/schema";
import {
  AUDIO_MODEL,
  AUDIO_OUTPUT_FORMAT,
  VOICE_SETTINGS,
  articleAudioPieces,
  type AudioPieceSpec,
} from "../app/articole/audio-naming";
import { withRetry } from "./retry";

const CONTENT_DIR = join(__dirname, "../app/articole/content");
const OUT_ROOT = join(__dirname, "../public/assets/audio/articole");

function requireKeys(): { key: string; voice: string } {
  const key = process.env.ELEVENLABS_API_KEY;
  const voice = process.env.ELEVENLABS_VOICE_ID;
  if (!key || !voice) throw new Error("ELEVENLABS_API_KEY / ELEVENLABS_VOICE_ID lipsă din .env");
  return { key, voice };
}

async function callApi(text: string): Promise<Buffer> {
  const { key, voice } = requireKeys();
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=${AUDIO_OUTPUT_FORMAT}`,
    {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ text, model_id: AUDIO_MODEL, voice_settings: VOICE_SETTINGS }),
    }
  );
  if (!response.ok)
    throw new Error(`ElevenLabs HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
  return Buffer.from(await response.arrayBuffer());
}

/** Rularea completă șterge fișierele care nu-s ale niciunei bucăți (ADR-013). */
function prune(outDir: string, all: AudioPieceSpec[]): void {
  const expected = new Set(all.map((p) => p.file));
  for (const file of readdirSync(outDir))
    if (!expected.has(file)) {
      unlinkSync(join(outDir, file));
      console.log(`șters (nu mai corespunde niciunei bucăți): ${file}`);
    }
}

async function main(): Promise<void> {
  const [slug, only] = process.argv.slice(2);
  if (!slug) throw new Error("folosire: yarn generate-article-audio <slug> [titlu|<sectionId>]");
  requireKeys();
  const raw = readFileSync(join(CONTENT_DIR, `${slug}.json`), "utf8");
  const all = articleAudioPieces(JSON.parse(raw) as Article);
  const selected = only ? all.filter((p) => p.id === only) : all;
  if (selected.length === 0)
    throw new Error(`bucată necunoscută "${only}" — folosește "titlu" sau un id de secțiune`);
  const outDir = join(OUT_ROOT, slug);
  mkdirSync(outDir, { recursive: true });
  for (const piece of selected) {
    const target = join(outDir, piece.file);
    if (existsSync(target)) {
      console.log(`refolosit (hash identic): ${piece.id} → ${piece.file}`);
      continue;
    }
    const audio = await withRetry(() => callApi(piece.text));
    writeFileSync(target, audio);
    console.log(`scris ${piece.id} → ${piece.file} (${Math.round(audio.length / 1024)}KB)`);
  }
  if (!only) prune(outDir, all);
}

main().catch((error: unknown) => {
  console.error(String(error));
  process.exit(1);
});
