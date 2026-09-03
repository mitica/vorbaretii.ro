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
import { spokenText } from "./audio-naming";

export type Alignment = {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
};

export type TimedWord = { text: string; start: number; end: number };
export type TimelineSegment = {
  kind: "titlu" | "beat";
  sectionId?: string;
  beatIndex?: number;
  text: string;
  start: number;
  end: number;
  words: TimedWord[];
};

type SpokenPiece = { kind: "titlu" | "beat"; sectionId?: string; beatIndex?: number; text: string };

function spokenPieces(article: Article): SpokenPiece[] {
  const beats = article.sections.flatMap((section) =>
    section.beats.map((beat, beatIndex) => ({
      kind: "beat" as const,
      sectionId: section.id,
      beatIndex,
      text: spokenText(beat.voce ?? beat.text),
    }))
  );
  return [{ kind: "titlu", text: spokenText(article.title) }, ...beats];
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
