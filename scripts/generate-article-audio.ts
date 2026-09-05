/**
 * Generatorul audio al articolului — mecanica ElevenLabs (ADR-033):
 * INTEGRALA articolului într-o singură generare = un fișier, prozodie
 * continuă (bucățile separate resetau tonul între ele; v3 n-are stitching).
 * O pronunție greșită e aleatoare pe v3 → re-take: ștergi fișierul, regenerezi.
 * Identitatea (hash pe text, setări, prag) și setările: `app/articole/audio-naming.ts`.
 *
 *   yarn generate-article-audio <slug>
 *
 * Text peste MAX_REQUEST_CHARS → cereri pe felii tăiate la graniți de
 * secțiune, concatenate în ACELAȘI fișier mp3 (CBR — cadrele se lipesc).
 * Hash existent pe disc = refolosit, zero apeluri. Rularea mătură fișierele
 * care nu mai corespund integralei curente.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import { join } from "path";
import type { Article } from "../app/articole/content/schema";
import {
  ARTICLE_AUDIO_FORMAT,
  articleAudioSpec,
  mergeSpokenAlignments,
  requestSlices,
  toSpokenBasis,
  type Alignment,
} from "../app/articole/audio-naming";
import { apiKeys, articleRequestBody, ttsRequest } from "./lib/elevenlabs";
import { episodeSpec, renderEpisode } from "./lib/episode";
import { withRetry } from "./retry";

const CONTENT_DIR = join(__dirname, "../app/articole/content");
const OUT_ROOT = join(__dirname, "../public/assets/audio/articole");

type Clip = { audio: Buffer; alignment: Alignment };

/** Audio + timpii per caracter (materia video-ului) dintr-o singură cerere. */
async function callApi(text: string): Promise<Clip> {
  const response = await ttsRequest(
    `/with-timestamps?output_format=${ARTICLE_AUDIO_FORMAT}`,
    articleRequestBody(text)
  );
  const payload = (await response.json()) as { audio_base64: string; alignment: Alignment };
  return { audio: Buffer.from(payload.audio_base64, "base64"), alignment: payload.alignment };
}

/** Integrala nouă: feliile cerute, lipite în același fișier, alinierea lipită. */
async function generateIntegral(
  spec: { text: string; file: string; alignmentFile: string },
  target: string,
  alignmentTarget: string
): Promise<void> {
  const slices = requestSlices(spec.text);
  const parts: Clip[] = [];
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

/** Episodul de podcast lângă integrală (ADR-032): coada = o cerere mp3, apoi lipirea și masterizarea; refolosit pe hash. */
async function ensureEpisode(
  article: Article,
  integralFile: string,
  outDir: string
): Promise<string> {
  const episode = episodeSpec(article, integralFile);
  const out = join(outDir, episode.file);
  if (existsSync(out)) return episode.file;
  const response = await withRetry(() =>
    ttsRequest(`?output_format=${ARTICLE_AUDIO_FORMAT}`, articleRequestBody(episode.tailText))
  );
  const tail = Buffer.from(await response.arrayBuffer());
  renderEpisode({ integralPath: join(outDir, integralFile), tail, out });
  console.log(`scris ${episode.file} (episodul: ${Math.round(statSync(out).size / 1024)}KB)`);
  return episode.file;
}

async function main(): Promise<void> {
  const [slug] = process.argv.slice(2);
  if (!slug) throw new Error("folosire: yarn generate-article-audio <slug>");
  apiKeys();
  const article = JSON.parse(readFileSync(join(CONTENT_DIR, `${slug}.json`), "utf8")) as Article;
  const spec = articleAudioSpec(article);
  const outDir = join(OUT_ROOT, slug);
  mkdirSync(outDir, { recursive: true });
  const target = join(outDir, spec.file);
  const alignmentTarget = join(outDir, spec.alignmentFile);
  if (existsSync(target) && existsSync(alignmentTarget)) {
    console.log(`refolosit (hash identic): ${spec.file}`);
  } else if (existsSync(target)) {
    throw new Error(
      `${spec.file} există fără alinierea lui — șterge mp3-ul și regenerează, sau produ alinierea prin forced-alignment (ADR-033)`
    );
  } else {
    await generateIntegral(spec, target, alignmentTarget);
  }
  const episodeFile = await ensureEpisode(article, spec.file, outDir);
  const keep = new Set([spec.file, spec.alignmentFile, episodeFile]);
  for (const file of readdirSync(outDir))
    if (!keep.has(file)) {
      unlinkSync(join(outDir, file));
      console.log(`șters (nu mai corespunde integralei sau episodului): ${file}`);
    }
}

main().catch((error: unknown) => {
  console.error(String(error));
  process.exit(1);
});
