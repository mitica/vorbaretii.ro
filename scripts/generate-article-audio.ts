/**
 * Generatorul audio al articolului — mecanica ElevenLabs (ADR-014):
 * INTEGRALA articolului într-o singură generare = un fișier, prozodie
 * continuă (bucățile separate resetau tonul între ele). Identitatea
 * (hash pe text + setări) și setările: `app/articole/audio-naming.ts`.
 *
 *   yarn generate-article-audio <slug>
 *
 * Text peste MAX_REQUEST_CHARS → cereri pe felii tăiate la graniți de
 * secțiune, concatenate în ACELAȘI fișier mp3 (CBR — cadrele se lipesc).
 * Hash existent pe disc = refolosit, zero apeluri. Rularea mătură fișierele
 * care nu mai corespund integralei curente.
 */

import "dotenv/config";
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";
import type { Article } from "../app/articole/content/schema";
import {
  AUDIO_MODEL,
  AUDIO_OUTPUT_FORMAT,
  MAX_REQUEST_CHARS,
  VOICE_SETTINGS,
  articleAudioSpec,
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

/** Feliile de cerere: integrala, sau tăiată la graniți de secțiune sub cap. */
function requestSlices(text: string): string[] {
  if (text.length <= MAX_REQUEST_CHARS) return [text];
  const slices: string[] = [];
  let current = "";
  for (const block of text.split("\n\n")) {
    const next = current === "" ? block : `${current}\n\n${block}`;
    if (next.length > MAX_REQUEST_CHARS && current !== "") {
      slices.push(current);
      current = block;
    } else {
      current = next;
    }
  }
  if (current !== "") slices.push(current);
  return slices;
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

async function main(): Promise<void> {
  const [slug] = process.argv.slice(2);
  if (!slug) throw new Error("folosire: yarn generate-article-audio <slug>");
  requireKeys();
  const raw = readFileSync(join(CONTENT_DIR, `${slug}.json`), "utf8");
  const spec = articleAudioSpec(JSON.parse(raw) as Article);
  const outDir = join(OUT_ROOT, slug);
  mkdirSync(outDir, { recursive: true });
  const target = join(outDir, spec.file);
  if (existsSync(target)) {
    console.log(`refolosit (hash identic): ${spec.file}`);
  } else {
    const slices = requestSlices(spec.text);
    const parts: Buffer[] = [];
    for (const slice of slices) parts.push(await withRetry(() => callApi(slice)));
    const audio = Buffer.concat(parts);
    writeFileSync(target, audio);
    console.log(
      `scris ${spec.file} (${Math.round(audio.length / 1024)}KB, ${slices.length} felii)`
    );
  }
  for (const file of readdirSync(outDir))
    if (file !== spec.file) {
      unlinkSync(join(outDir, file));
      console.log(`șters (nu mai corespunde integralei): ${file}`);
    }
}

main().catch((error: unknown) => {
  console.error(String(error));
  process.exit(1);
});
