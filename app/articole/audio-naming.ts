/**
 * Casa unică a identității audio (ADR-014): UN fișier per articol —
 * integrala (titlul + secțiunile, cu tagurile din `voce`), numită
 * hash(text integral + setările API comise). Conținut identic = fișier
 * refolosit (zero apeluri API); text/setări schimbate = nume nou (niciun
 * cache nu poate servi vechiul). Setările și modelul sunt COD; în .env
 * rămân doar secretele (ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID — vocea NU
 * intră în nume: schimbi vocea → ștergi fișierul și regenerezi).
 */

import { createHash } from "node:crypto";
import type { Article } from "./content/schema";

export const AUDIO_MODEL = "eleven_v3";
export const AUDIO_OUTPUT_FORMAT = "mp3_44100_64";
export const VOICE_SETTINGS = { stability: 0.5, similarity_boost: 0.75, speed: 1.0 };
/** Peste limita asta per cerere, textul se taie la graniți de secțiune (ADR-014). */
export const MAX_REQUEST_CHARS = 2900;

export type ArticleAudioSpec = { text: string; file: string; alignmentFile: string };

/** Textul integral: titlul + fiecare secțiune (beat-urile pe voce ?? text). */
function articleAudioText(article: Article): string {
  const sections = article.sections.map((s) => s.beats.map((b) => b.voce ?? b.text).join(" "));
  return [article.title, ...sections].join("\n\n");
}

export function articleAudioSpec(article: Article): ArticleAudioSpec {
  const text = articleAudioText(article);
  const material = JSON.stringify({
    text,
    model: AUDIO_MODEL,
    format: AUDIO_OUTPUT_FORMAT,
    settings: VOICE_SETTINGS,
  });
  const hash = createHash("sha256").update(material).digest("hex").slice(0, 16);
  return { text, file: `${hash}.mp3`, alignmentFile: `${hash}.alignment.json` };
}
