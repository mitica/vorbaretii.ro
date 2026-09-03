/**
 * Casa unică a identității bucăților audio (ADR-013): numele fișierului =
 * hash(textul bucății + setările API comise) — conținut identic = fișier
 * refolosit (generatorul sare apelul API); orice schimbare de text sau de
 * setări = nume NOU (cache-urile nu pot servi vechiul). Setările și modelul
 * sunt COD (mecanismul), nu .env — acolo rămân doar secretele
 * (ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID). Vocea NU intră în nume
 * (registrul rulează la build fără .env): schimbi vocea → ștergi directorul
 * slug-ului și regenerezi.
 */

import { createHash } from "node:crypto";
import type { Article } from "./content/schema";

export const AUDIO_MODEL = "eleven_v3";
export const AUDIO_OUTPUT_FORMAT = "mp3_44100_64";
export const VOICE_SETTINGS = { stability: 0.5, similarity_boost: 0.75, speed: 1.0 };

export type AudioPieceSpec = { id: string; label: string; text: string; file: string };

function fileNameFor(text: string): string {
  const material = JSON.stringify({
    text,
    model: AUDIO_MODEL,
    format: AUDIO_OUTPUT_FORMAT,
    settings: VOICE_SETTINGS,
  });
  return `${createHash("sha256").update(material).digest("hex").slice(0, 16)}.mp3`;
}

/** Bucățile articolului, în ordinea lui: titlul + fiecare secțiune (voce ?? text). */
export function articleAudioPieces(article: Article): AudioPieceSpec[] {
  const sections = article.sections.map((s) => {
    const text = s.beats.map((b) => b.voce ?? b.text).join(" ");
    return { id: s.id, label: s.title, text, file: fileNameFor(text) };
  });
  const title = { id: "titlu", label: article.title, text: article.title };
  return [{ ...title, file: fileNameFor(article.title) }, ...sections];
}
