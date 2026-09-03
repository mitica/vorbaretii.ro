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
  TAG_RE,
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

type Alignment = {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
};

/** Audio + timpii per caracter (materia video-ului) dintr-o singură cerere. */
async function callApi(text: string): Promise<{ audio: Buffer; alignment: Alignment }> {
  const { key, voice } = requireKeys();
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice}/with-timestamps?output_format=${AUDIO_OUTPUT_FORMAT}`,
    {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ text, model_id: AUDIO_MODEL, voice_settings: VOICE_SETTINGS }),
    }
  );
  if (!response.ok)
    throw new Error(`ElevenLabs HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
  const payload = (await response.json()) as { audio_base64: string; alignment: Alignment };
  return { audio: Buffer.from(payload.audio_base64, "base64"), alignment: payload.alignment };
}

/** Alinierea API-ului e pe textul TRIMIS (cu taguri); contractul e textul VORBIT. */
function toSpokenBasis(sentText: string, alignment: Alignment): Alignment {
  const spoken: Alignment = {
    characters: [],
    character_start_times_seconds: [],
    character_end_times_seconds: [],
  };
  const drop = new Set<number>();
  for (const match of sentText.matchAll(TAG_RE))
    for (let i = match.index; i < match.index + match[0].length; i++) drop.add(i);
  alignment.characters.forEach((ch, i) => {
    if (drop.has(i)) return;
    spoken.characters.push(ch);
    spoken.character_start_times_seconds.push(alignment.character_start_times_seconds[i]!);
    spoken.character_end_times_seconds.push(alignment.character_end_times_seconds[i]!);
  });
  return spoken;
}

/** Feliile se lipesc: timpii feliilor următoare se mută cu capătul celei dinainte. */
function mergeAlignments(parts: Alignment[]): Alignment {
  const merged: Alignment = {
    characters: [],
    character_start_times_seconds: [],
    character_end_times_seconds: [],
  };
  let offset = 0;
  for (const part of parts) {
    merged.characters.push(...part.characters);
    merged.character_start_times_seconds.push(
      ...part.character_start_times_seconds.map((t) => t + offset)
    );
    merged.character_end_times_seconds.push(
      ...part.character_end_times_seconds.map((t) => t + offset)
    );
    offset =
      merged.character_end_times_seconds[merged.character_end_times_seconds.length - 1] ?? offset;
  }
  return merged;
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
  const alignmentTarget = join(outDir, spec.alignmentFile);
  if (existsSync(target) && existsSync(alignmentTarget)) {
    console.log(`refolosit (hash identic): ${spec.file}`);
  } else if (existsSync(target)) {
    throw new Error(
      `${spec.file} există fără alinierea lui — șterge mp3-ul și regenerează, sau produ alinierea prin forced-alignment (ADR-014)`
    );
  } else {
    const slices = requestSlices(spec.text);
    const parts: { audio: Buffer; alignment: Alignment }[] = [];
    for (const slice of slices) parts.push(await withRetry(() => callApi(slice)));
    const audio = Buffer.concat(parts.map((p) => p.audio));
    writeFileSync(target, audio);
    const alignment = toSpokenBasis(spec.text, mergeAlignments(parts.map((p) => p.alignment)));
    writeFileSync(alignmentTarget, JSON.stringify(alignment));
    console.log(
      `scris ${spec.file} (${Math.round(audio.length / 1024)}KB, ${slices.length} felii) + ${spec.alignmentFile}`
    );
  }
  for (const file of readdirSync(outDir))
    if (file !== spec.file && file !== spec.alignmentFile) {
      unlinkSync(join(outDir, file));
      console.log(`șters (nu mai corespunde integralei): ${file}`);
    }
}

main().catch((error: unknown) => {
  console.error(String(error));
  process.exit(1);
});
