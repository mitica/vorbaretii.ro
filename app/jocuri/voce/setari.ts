/**
 * Casa vocii jocurilor (ADR-020): care jocuri au voce, cheia vocii (directorul),
 * forma rostirilor compuse. PUR — merge și în client
 * (butonul mascotei), și în scripturi (generator, lege).
 *
 * O ROSTIRE = textul exact trimis vocii; fișierul ei = hashId(text).mp3 în
 * directorul cheii curente. Text schimbat = fișier nou; setări schimbate =
 * cheie nouă (director nou, cel vechi măturat de generator).
 */
import { AUDIO_MODEL, AUDIO_OUTPUT_FORMAT, VOICE_SETTINGS } from "../../articole/audio-setari";

/** Ritmul vocii la jocuri (verdictul probei: cel al integralei). */
export const VITEZA = 1.0;
/** Un fișier peste bugetul ăsta pică legea (ADR-020). */
export const BUGET_FISIER = 120 * 1024;
/** Rădăcina fișierelor, relativ la repo; servită sub /assets/audio/jocuri. */
export const DIRECTOR_VOCE = "public/assets/audio/jocuri";

export type SetariJoc = {
  /** Tag de emoție prefixat textului trimis (intră în cheie, nu în hash). */
  tag?: string;
};

/** Jocurile cu voce (designul FEAT-011, decizia 1) — cheia = slug-ul din games.ts. */
export const VOCE_JOCURI: Readonly<Record<string, SetariJoc>> = {
  ghicitori: {},
  "roata-cuvintelor": {},
  curiozitati: {},
  "proverbe-pereche": {},
  "framantari-de-limba": {},
  "spune-o-altfel": {},
  categorii: {},
  "vinde-mi-asta": {},
};

export function cheiaVocii(slug: string): string {
  const { stability, similarity_boost } = VOICE_SETTINGS;
  const baza = `${AUDIO_MODEL}_${AUDIO_OUTPUT_FORMAT}_s${stability}_b${similarity_boost}_sp${VITEZA}`;
  const tag = VOCE_JOCURI[slug]?.tag;
  return tag ? `${baza}_t${tag}` : baza;
}

/** Textul trimis vocii: tagul jocului (dacă e) + rostirea. */
export function textTrimis(slug: string, rostire: string): string {
  const tag = VOCE_JOCURI[slug]?.tag;
  return tag ? `[${tag}] ${rostire}` : rostire;
}

/* ----------------------------------------------- rostirile compuse (o casă) */

export function rostireCategorie(prompt: string): string {
  return `Spune ${prompt}!`;
}

export function rostireAltfel(word: string, forbidden: readonly string[]): string {
  return `${word}. Fără să spui: ${forbidden.join(", ")}.`;
}

export function rostireBonus(bonus: string): string {
  return `Argument bonus: ${bonus}`;
}
