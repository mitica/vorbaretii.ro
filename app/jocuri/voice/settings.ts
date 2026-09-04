/**
 * Casa vocii jocurilor (ADR-020): care jocuri au voce, cheia vocii (directorul),
 * forma rostirilor compuse. PUR — merge și în client
 * (butonul mascotei), și în scripturi (generator, lege).
 *
 * O ROSTIRE = textul exact trimis vocii; fișierul ei = hashId(text).mp3 în
 * directorul cheii curente. Text schimbat = fișier nou; setări schimbate =
 * key nouă (dir nou, cel vechi măturat de generator).
 */
import { AUDIO_MODEL, AUDIO_OUTPUT_FORMAT, VOICE_SETTINGS } from "../../articole/audio-settings";
import { hashId } from "../content/ids";

/** Ritmul vocii la jocuri (verdictul probei: cel al integralei). */
export const SPEED = 1.0;
/** Un fișier peste bugetul ăsta pică legea (ADR-020). */
export const FILE_BUDGET = 120 * 1024;
/** Rădăcina fișierelor, relativ la repo; servită sub /assets/audio/jocuri. */
export const VOICE_DIR = "public/assets/audio/jocuri";

export type GameVoiceSettings = {
  /** Tag de emoție prefixat textului trimis (intră în key, nu în hash). */
  tag?: string;
};

/** Jocurile cu voce (designul FEAT-011, decizia 1) — cheia = slug-ul din games.ts. */
export const VOICED_GAMES: Readonly<Record<string, GameVoiceSettings>> = {
  "ghicitori": {},
  "roata-cuvintelor": {},
  "curiozitati": {},
  "proverbe-pereche": {},
  "framantari-de-limba": {},
  "spune-o-altfel": {},
  "categorii": {},
  "vinde-mi-asta": {},
};

export function voiceKey(slug: string): string {
  const { stability, similarity_boost } = VOICE_SETTINGS;
  const base = `${AUDIO_MODEL}_${AUDIO_OUTPUT_FORMAT}_s${stability}_b${similarity_boost}_sp${SPEED}`;
  const tag = VOICED_GAMES[slug]?.tag;
  return tag ? `${base}_t${tag}` : base;
}

/** Textul trimis vocii: tagul jocului (dacă e) + rostirea. */
export function requestText(slug: string, utterance: string): string {
  const tag = VOICED_GAMES[slug]?.tag;
  return tag ? `[${tag}] ${utterance}` : utterance;
}

export function hasVoice(slug: string): boolean {
  return Object.prototype.hasOwnProperty.call(VOICED_GAMES, slug);
}

/** URL-ul servit al unei rostiri. */
export function audioPath(slug: string, utterance: string): string {
  return `/assets/audio/jocuri/${slug}/${voiceKey(slug)}/${hashId(utterance)}.mp3`;
}

/* ----------------------------------------------- rostirile compuse (o casă) */

export function categoryUtterance(prompt: string): string {
  return `Spune ${prompt}!`;
}

export function tabooUtterance(word: string, forbidden: readonly string[]): string {
  return `${word}. Fără să spui: ${forbidden.join(", ")}.`;
}

export function bonusUtterance(bonus: string): string {
  return `Argument bonus: ${bonus}`;
}
