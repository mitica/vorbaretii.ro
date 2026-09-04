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

import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";
import type { Article } from "../app/articole/content/schema";
import {
  AUDIO_MODEL,
  AUDIO_OUTPUT_FORMAT,
  VOICE_SETTINGS,
  articleAudioSpec,
  mergeSpokenAlignments,
  requestSlices,
  toSpokenBasis,
  type Alignment,
} from "../app/articole/audio-naming";
import { ttsRequest, apiKeys } from "./lib/elevenlabs";
import { withRetry } from "./retry";

const CONTENT_DIR = join(__dirname, "../app/articole/content");
const OUT_ROOT = join(__dirname, "../public/assets/audio/articole");

/** Audio + timpii per caracter (materia video-ului) dintr-o singură cerere. */
async function callApi(text: string): Promise<{ audio: Buffer; alignment: Alignment }> {
  const response = await ttsRequest(`/with-timestamps?output_format=${AUDIO_OUTPUT_FORMAT}`, {
    text,
    model_id: AUDIO_MODEL,
    voice_settings: VOICE_SETTINGS,
  });
  const payload = (await response.json()) as { audio_base64: string; alignment: Alignment };
  return { audio: Buffer.from(payload.audio_base64, "base64"), alignment: payload.alignment };
}

async function main(): Promise<void> {
  const [slug] = process.argv.slice(2);
  if (!slug) throw new Error("folosire: yarn generate-article-audio <slug>");
  apiKeys();
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
    const alignment = mergeSpokenAlignments(
      slices.map((slice, i) => toSpokenBasis(slice, parts[i]!.alignment))
    );
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
