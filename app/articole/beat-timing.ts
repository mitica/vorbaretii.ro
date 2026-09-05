/**
 * Casa derivării timpilor (ADR-015): din articol + alinierea integralei ies
 * segmentele vorbite (titlul, apoi fiecare beat, în ordinea articolului) cu
 * timpii lor și ai fiecărui cuvânt. PURĂ — zero I/O; consumatorii: generatorul
 * video, testele-lege, stratul mascotei (v2). Robustețe: potrivirea merge pe
 * caracterele NON-spațiu (separatorii integralei și CRLF-urile alinierii devin
 * irelevante), iar orice nepotrivire de caracter aruncă cu poziția — derivarea
 * nu ghicește niciodată.
 */

import type { Article } from "./content/schema";
import { speaksSectionTitle, spokenText, tagMarks } from "./audio-naming";
import type { Band } from "./content/budgets";

export type Alignment = {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
};

export type TimedWord = { text: string; start: number; end: number };
export type TimelineSegment = {
  kind: "titlu" | "sectiune" | "beat";
  sectionId?: string;
  beatIndex?: number;
  text: string;
  start: number;
  end: number;
  words: TimedWord[];
};

type SpokenPiece = {
  kind: "titlu" | "sectiune" | "beat";
  sectionId?: string;
  beatIndex?: number;
  text: string;
};

/** Piesele vorbite ale unei secțiuni: numele ei (când se rostește — ADR-028), apoi beat-urile. */
function sectionPieces(section: Article["sections"][number]): SpokenPiece[] {
  const name: SpokenPiece[] = speaksSectionTitle(section)
    ? [{ kind: "sectiune", sectionId: section.id, text: spokenText(section.title) }]
    : [];
  const beats = section.beats.map((beat, beatIndex) => ({
    kind: "beat" as const,
    sectionId: section.id,
    beatIndex,
    text: spokenText(beat.voce ?? beat.text),
  }));
  return [...name, ...beats];
}

function spokenPieces(article: Article): SpokenPiece[] {
  return [
    { kind: "titlu", text: spokenText(article.title) },
    ...article.sections.flatMap(sectionPieces),
  ];
}

/** Indecșii caracterelor non-spațiu din aliniere, în ordine. */
function inkIndexes(alignment: Alignment): number[] {
  const indexes: number[] = [];
  alignment.characters.forEach((ch, i) => {
    if (!/\s/.test(ch)) indexes.push(i);
  });
  return indexes;
}

type Cursor = { indexes: number[]; position: number };

/** Consumă caracterele non-spațiu ale unui text, aserționând potrivirea. */
function consume(
  text: string,
  cursor: Cursor,
  alignment: Alignment
): { start: number; end: number } {
  const ink = [...text].filter((ch) => !/\s/.test(ch));
  const first = cursor.indexes[cursor.position];
  for (const expected of ink) {
    const index = cursor.indexes[cursor.position];
    if (index === undefined)
      throw new Error(`alinierea se termină înaintea textului la "${text.slice(0, 40)}…"`);
    const actual = alignment.characters[index]!;
    if (actual !== expected)
      throw new Error(
        `caracterul "${actual}" din aliniere nu se potrivește cu "${expected}" (poziția ${index})`
      );
    cursor.position++;
  }
  const last = cursor.indexes[cursor.position - 1]!;
  return {
    start: alignment.character_start_times_seconds[first!]!,
    end: alignment.character_end_times_seconds[last]!,
  };
}

/** Timeline-ul articolului: titlul + beat-urile, fiecare cu timpii cuvintelor lui. */
export function articleTimeline(article: Article, alignment: Alignment): TimelineSegment[] {
  const cursor: Cursor = { indexes: inkIndexes(alignment), position: 0 };
  const timeline: TimelineSegment[] = [];
  for (const piece of spokenPieces(article)) {
    const words: TimedWord[] = [];
    const wordTexts = piece.text.split(/\s+/).filter(Boolean);
    const first = cursor.position;
    for (const word of wordTexts) words.push({ text: word, ...consume(word, cursor, alignment) });
    const start = alignment.character_start_times_seconds[cursor.indexes[first]!]!;
    const end = words.length > 0 ? words[words.length - 1]!.end : start;
    timeline.push({ ...piece, start, end, words });
  }
  if (cursor.position !== cursor.indexes.length)
    throw new Error(
      `alinierea are ${cursor.indexes.length - cursor.position} caractere după finalul articolului — textul și alinierea nu-s aceeași integrală`
    );
  return timeline;
}

export type Window = { start: number; end: number };
/** Cuvântul care închide o propoziție: terminator, eventual urmat de ghilimele/paranteză — o casă (ferestrele cadrelor, reacțiile, pauza mascotei). */
const SENTENCE_END = /[.!?…:]["”»)]*$/;
export const endsSentence = (word: TimedWord): boolean => SENTENCE_END.test(word.text);

/** Indecșii cuvintelor care ÎNCEP o propoziție nouă (după un terminator). */
function sentenceStarts(words: TimedWord[]): number[] {
  const starts: number[] = [];
  for (let i = 1; i < words.length; i++) if (endsSentence(words[i - 1]!)) starts.push(i);
  return starts;
}

/** Tăieturi egale ca număr de cuvinte — rezerva când nu sunt destule granițe de propoziție. */
function evenCuts(length: number, count: number): number[] {
  return Array.from({ length: count - 1 }, (_, k) => Math.round(((k + 1) * length) / count));
}

/** `count − 1` tăieturi la granițele de propoziție cele mai apropiate de împărțirea egală. */
function cutIndexes(words: TimedWord[], count: number): number[] {
  const candidates = sentenceStarts(words);
  if (candidates.length < count - 1) return evenCuts(words.length, count);
  const cuts: number[] = [];
  for (let k = 1; k < count; k++) {
    const target = (k * words.length) / count;
    const previous = cuts[cuts.length - 1] ?? 0;
    const options = candidates.filter((i) => i > previous);
    if (options.length === 0) return evenCuts(words.length, count);
    cuts.push(
      options.reduce((best, i) => (Math.abs(i - target) < Math.abs(best - target) ? i : best))
    );
  }
  return cuts;
}

/**
 * Ferestrele cadrelor unui segment (ADR-030): cadre = min(count, ⌊durată / minShotSeconds⌋),
 * cel puțin unul; fiecare fereastră începe la primul ei cuvânt (prima la segment.start),
 * ultima se închide la segment.end — fără goluri, în ordinea imaginilor.
 */
export function shotWindows(
  segment: TimelineSegment,
  count: number,
  minShotSeconds: number
): Window[] {
  const duration = segment.end - segment.start;
  const shots = Math.max(1, Math.min(count, Math.floor(duration / minShotSeconds)));
  if (shots === 1 || segment.words.length < shots)
    return [{ start: segment.start, end: segment.end }];
  const cuts = cutIndexes(segment.words, shots);
  const bounds = [segment.start, ...cuts.map((i) => segment.words[i]!.start), segment.end];
  return bounds.slice(0, -1).map((start, k) => ({ start, end: bounds[k + 1]! }));
}

type ReactionPose = "bucurie" | "gandeste";
export type Reaction = { start: number; end: number; pose: ReactionPose };

/** Familia fiecărui tag (ADR-030): bucurie / gândește; restul nu reacționează. */
const TAG_POSE: Record<string, ReactionPose> = {
  "[excited]": "bucurie",
  "[laughs]": "bucurie",
  "[laughs harder]": "bucurie",
  "[starts laughing]": "bucurie",
  "[mischievously]": "bucurie",
  "[curious]": "gandeste",
  "[whispers]": "gandeste",
  "[sighs]": "gandeste",
  "[exhales]": "gandeste",
};

/** Offsetul de început al fiecărui cuvânt în textul vorbit al segmentului. */
function wordOffsets(spoken: string, words: TimedWord[]): number[] {
  let cursor = 0;
  return words.map((word) => {
    const at = spoken.indexOf(word.text, cursor);
    cursor = at + word.text.length;
    return at;
  });
}

/** Sfârșitul propoziției care începe la cuvântul `from`: capătul primului cuvânt cu terminator. */
function sentenceEnd(words: TimedWord[], from: number, fallback: number): number {
  for (let i = from; i < words.length; i++) if (endsSentence(words[i]!)) return words[i]!.end;
  return fallback;
}

/** Reacțiile unui beat: per tag din `voce`, de la cuvântul tagat, cel mult maxSeconds, până la capătul propoziției. */
function beatReactions(tagged: string, segment: TimelineSegment, maxSeconds: number): Reaction[] {
  const spoken = spokenText(tagged);
  const offsets = wordOffsets(spoken, segment.words);
  const reactions: Reaction[] = [];
  for (const mark of tagMarks(tagged)) {
    const pose = TAG_POSE[mark.tag];
    const index = offsets.findIndex((offset) => offset >= mark.spokenIndex);
    if (!pose || index === -1) continue;
    const start = segment.words[index]!.start;
    const end = Math.min(sentenceEnd(segment.words, index, segment.end), start + maxSeconds);
    reactions.push({ start, end: Math.max(end, start + 0.1), pose });
  }
  return reactions;
}

/** Doza pe bandă (ghidul §Video), numărată pe articol: 7–8 toate; 9–11 primele 3; 12–14 prima bucurie. */
function dose(reactions: Reaction[], band: Band): Reaction[] {
  if (band === "7-8") return reactions;
  if (band === "9-11") return reactions.slice(0, 3);
  const joy = reactions.find((r) => r.pose === "bucurie");
  return joy ? [joy] : [];
}

/** Reacțiile mascotei pe tagurile de emoție ale articolului (ADR-030), în ordinea filmului. */
export type ReactionOptions = { band: Band; maxSeconds: number };

export function reactionsFor(
  article: Article,
  timeline: TimelineSegment[],
  opts: ReactionOptions
): Reaction[] {
  const all = timeline.flatMap((segment) => {
    if (segment.kind !== "beat") return [];
    const beat = article.sections.find((s) => s.id === segment.sectionId)?.beats[
      segment.beatIndex!
    ];
    return beat?.voce ? beatReactions(beat.voce, segment, opts.maxSeconds) : [];
  });
  return dose(all, opts.band);
}
