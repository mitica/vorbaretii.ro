/**
 * Proba A/B a tagurilor (FEAT-009 în harnessul privat, decizia 6): integrala de
 * PROBĂ a unui articol din JSON-ul DAT (o copie re-tagată pe drumul vechi, „tagurile
 * după”), scrisă la `public/assets/audio/probe/<slug>-b.mp3` — în afara rădăcinii
 * legii audio (ADR-014): fără aliniere, fără măturare, neservită de nicio pagină;
 * ajunge pe telefon prin merge, ca operatorul să asculte A (integrala articolului)
 * și B. Temporară: pleacă odată cu verdictul. Nu citește registrul (ADR-019):
 * intrarea e calea dată.
 *
 *   yarn probe-article-audio <slug> <json-path>
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Article } from "../app/articole/content/schema";
import {
  AUDIO_MODEL,
  AUDIO_OUTPUT_FORMAT,
  VOICE_SETTINGS,
  articleAudioSpec,
  requestSlices,
} from "../app/articole/audio-naming";
import { apiKeys, ttsRequest } from "./lib/elevenlabs";
import { withRetry } from "./retry";

const OUT_DIR = join(__dirname, "../public/assets/audio/probe");

/** Mp3 brut pentru o felie — aceleași setări ca integrala, fără timestamps. */
async function synthesize(text: string): Promise<Buffer> {
  const response = await ttsRequest(`?output_format=${AUDIO_OUTPUT_FORMAT}`, {
    text,
    model_id: AUDIO_MODEL,
    voice_settings: VOICE_SETTINGS,
  });
  return Buffer.from(await response.arrayBuffer());
}

async function main(): Promise<void> {
  const [slug, jsonPath] = process.argv.slice(2);
  if (!slug || !jsonPath) throw new Error("folosire: yarn probe-article-audio <slug> <json-path>");
  apiKeys();
  const article = JSON.parse(readFileSync(jsonPath, "utf8")) as Article;
  const { text } = articleAudioSpec(article);
  const slices = requestSlices(text);
  console.log(`proba B pentru "${slug}": ${text.length} caractere, ${slices.length} felii`);
  const parts: Buffer[] = [];
  for (const slice of slices) parts.push(await withRetry(() => synthesize(slice)));
  mkdirSync(OUT_DIR, { recursive: true });
  const audio = Buffer.concat(parts);
  writeFileSync(join(OUT_DIR, `${slug}-b.mp3`), audio);
  console.log(
    `scris public/assets/audio/probe/${slug}-b.mp3 (${Math.round(audio.length / 1024)}KB)`
  );
}

main().catch((error: unknown) => {
  console.error(String(error));
  process.exit(1);
});
