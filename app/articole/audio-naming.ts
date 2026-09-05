/**
 * Casa unică a identității audio (ADR-033): UN fișier per articol —
 * integrala (titlul + secțiunile, cu tagurile din `voce`), numită
 * hash(text integral, setările API comise, pragul feliei). Conținut identic =
 * fișier refolosit (zero apeluri API); text/setări schimbate = name nou (niciun
 * cache nu poate servi vechiul); o pronunție greșită (aleatoare pe v3) = re-take:
 * ștergi fișierul și regenerezi. Setările și modelul sunt COD; în .env rămân doar
 * secretele (ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID — vocea NU intră în name).
 */

import { createHash } from "node:crypto";
import type { Article } from "./content/schema";

import { ARTICLE_AUDIO_FORMAT, AUDIO_MODEL, VOICE_SETTINGS } from "./audio-settings";

export { ARTICLE_AUDIO_FORMAT, AUDIO_MODEL, VOICE_SETTINGS };
/** Peste limita asta per cerere, textul se taie la graniți de secțiune (ADR-033; limita v3 e 5000). */
export const MAX_REQUEST_CHARS = 4500;

export type ArticleAudioSpec = { text: string; file: string; alignmentFile: string };

/**
 * Contractul alinierii: timpii adresează TEXTUL VORBIT — integrala fără
 * tagurile de emoții (modelul nu le rostește). Casa tagurilor e
 * `content/spoken.ts` (pură, o intră și schema); aici se re-exportă pentru
 * consumatorii identității.
 */
import { TAG_RE, spokenText, tagCount, tagMarks } from "./content/spoken";

export { spokenText, tagCount, tagMarks };

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
 * REINTRĂ în flux (chars de tăcere, durată zero la cusătură), iar timpii
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

/**
 * Cuvintele comparabile ale unui text (ADR-028): vorbit (fără taguri), minuscule,
 * fără punctuația de la capetele fiecărui cuvânt — cratima din interior rămâne.
 */
function comparableWords(text: string): string[] {
  return spokenText(text)
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    .filter(Boolean);
}

type SpokenSection = { title: string; beats: { text: string; voce?: string }[] };

/**
 * ADR-028: numele secțiunii se rostește DOAR dacă primul ei beat (voce ?? text) nu
 * începe deja cu cuvintele numelui — altfel formula s-ar dubla. Secțiune fără
 * beat-uri → se rostește. Casa unică a regulii; beat-timing și video o consumă.
 */
export function speaksSectionTitle(section: SpokenSection): boolean {
  const name = comparableWords(section.title);
  const first = section.beats[0];
  const opening = comparableWords(first?.voce ?? first?.text ?? "");
  return !name.every((word, i) => opening[i] === word);
}

/** Blocurile vorbite ale unei secțiuni: numele ei (când se rostește), apoi beat-urile. */
function sectionBlocks(section: Article["sections"][number]): string[] {
  const beats = section.beats.map((b) => b.voce ?? b.text).join(" ");
  return speaksSectionTitle(section) ? [section.title, beats] : [beats];
}

/** Textul integral: titlul + per secțiune [numele, ADR-028] + beat-urile, blocuri separate. */
function articleAudioText(article: Article): string {
  return [article.title, ...article.sections.flatMap(sectionBlocks)].join(SLICE_SEPARATOR);
}

/** Identitatea integralei: textul, modelul, formatul articolelor, setările și pragul feliei (ADR-033). */
export function articleAudioSpec(article: Article): ArticleAudioSpec {
  const text = articleAudioText(article);
  const material = JSON.stringify({
    text,
    model: AUDIO_MODEL,
    format: ARTICLE_AUDIO_FORMAT,
    settings: VOICE_SETTINGS,
    maxRequestChars: MAX_REQUEST_CHARS,
  });
  const hash = createHash("sha256").update(material).digest("hex").slice(0, 16);
  return { text, file: `${hash}.mp3`, alignmentFile: `${hash}.alignment.json` };
}

/** Ultima întrebare a articolului — a ultimei secțiuni; o casă pentru film (compose.ts) și pentru coada episodului. */
export function lastQuestion(article: Article): string {
  const section = article.sections[article.sections.length - 1];
  const question = section?.questions[section.questions.length - 1];
  return question?.question ?? "";
}

/** Ritualul episodului de podcast (stilul §3(d), ADR-032): introducerea, invitația, replica de închidere. */
export const EPISODE_TAIL = {
  intro: "Și acum, o întrebare pentru tine:",
  invite: "Spune-i celui de lângă tine ce crezi.",
  closing: "Vorbăreții punct ro — unde copiii vorbesc românește cu prieteni.",
} as const;

/** Coada rostită a episodului: introducerea, ultima întrebare, o pauză, invitația, replica. */
export function episodeTailText(article: Article): string {
  return `${EPISODE_TAIL.intro} ${lastQuestion(article)} … ${EPISODE_TAIL.invite} ${EPISODE_TAIL.closing}`;
}
