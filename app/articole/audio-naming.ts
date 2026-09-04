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

import { AUDIO_MODEL, AUDIO_OUTPUT_FORMAT, VOICE_SETTINGS } from "./audio-setari";

export { AUDIO_MODEL, AUDIO_OUTPUT_FORMAT, VOICE_SETTINGS };
/** Peste limita asta per cerere, textul se taie la graniți de secțiune (ADR-014). */
const MAX_REQUEST_CHARS = 2900;

export type ArticleAudioSpec = { text: string; file: string; alignmentFile: string };

/**
 * Contractul alinierii: timpii adresează TEXTUL VORBIT — integrala fără
 * tagurile de emoții (modelul nu le rostește). Ambele surse (with-timestamps
 * la generare, forced-alignment pe fișiere istorice) se normalizează aici.
 */
const TAG_RE = /\[[a-z ]+\]\s*/g;

export function spokenText(text: string): string {
  return text.replace(TAG_RE, "");
}

export type Alignment = {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
};

/** Separatorul integralei — între titlu/secțiuni și, la fel, între feliile lipite. */
export const SLICE_SEPARATOR = "\n\n";

/**
 * Feliile de cerere: integrala întreagă, sau tăiată la graniți de secțiune sub
 * cap. Invariant: `slices.join(SLICE_SEPARATOR) === text` — lipirea reconstruiește
 * exact textul trimis, altfel alinierea lipită nu mai adresează textul vorbit.
 */
export function requestSlices(text: string): string[] {
  if (text.length <= MAX_REQUEST_CHARS) return [text];
  const slices: string[] = [];
  let current = "";
  for (const block of text.split(SLICE_SEPARATOR)) {
    const next = current === "" ? block : `${current}${SLICE_SEPARATOR}${block}`;
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

/** Alinierea API-ului e pe textul TRIMIS (cu taguri); contractul e textul VORBIT. */
export function toSpokenBasis(sentText: string, alignment: Alignment): Alignment {
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

/**
 * Feliile se lipesc pe basis-ul VORBIT al fiecăreia: separatorul dintre felii
 * REINTRĂ în flux (caractere de tăcere, durată zero la cusătură), iar timpii
 * feliilor următoare se mută cu capătul celei dinainte — astfel caracterele
 * lipite == textul vorbit al integralei, caracter cu caracter.
 */
export function mergeSpokenAlignments(parts: Alignment[]): Alignment {
  const merged: Alignment = {
    characters: [],
    character_start_times_seconds: [],
    character_end_times_seconds: [],
  };
  let offset = 0;
  parts.forEach((part, index) => {
    if (index > 0)
      for (const ch of SLICE_SEPARATOR) {
        merged.characters.push(ch);
        merged.character_start_times_seconds.push(offset);
        merged.character_end_times_seconds.push(offset);
      }
    merged.characters.push(...part.characters);
    merged.character_start_times_seconds.push(
      ...part.character_start_times_seconds.map((t) => t + offset)
    );
    merged.character_end_times_seconds.push(
      ...part.character_end_times_seconds.map((t) => t + offset)
    );
    offset =
      merged.character_end_times_seconds[merged.character_end_times_seconds.length - 1] ?? offset;
  });
  return merged;
}

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
