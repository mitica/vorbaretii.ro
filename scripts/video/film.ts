/**
 * Ceasul filmului (ADR-030): filmul = stingul de întâmpinare + integrala + ultima
 * întrebare + outro (cu stingul de încheiere înăuntru). Timeline-ul rămâne relativ
 * la aliniere (casa lui e MOD-001); aici se traduce: filmTime = STINGS.intro.seconds
 * + audioTime. Probele includ intro-ul când încep la primul segment și închiderea
 * când se termină la ultimul.
 */

import type { TimelineSegment } from "../../app/articole/beat-timing";
import { OUTRO, QUESTION, STINGS } from "./config";

export type FilmPhase = "intro" | "body" | "question" | "outro";
export type SegmentRange = { from: number; to: number };
export type TimeRange = { start: number; end: number };

const lastEnd = (timeline: TimelineSegment[]): number => timeline[timeline.length - 1]!.end;

export function toAudioTime(filmTime: number): number {
  return filmTime - STINGS.intro.seconds;
}

export function filmLength(timeline: TimelineSegment[]): number {
  return STINGS.intro.seconds + lastEnd(timeline) + QUESTION.seconds + OUTRO.seconds;
}

export function filmPhase(filmTime: number, timeline: TimelineSegment[]): FilmPhase {
  const audio = toAudioTime(filmTime);
  if (audio < 0) return "intro";
  const end = lastEnd(timeline);
  if (audio < end) return "body";
  if (audio < end + QUESTION.seconds) return "question";
  return "outro";
}

/** Intervalul randat, în timp de film: tot filmul, sau segmentele cerute — cu intro-ul la primul, cu închiderea la ultimul. */
export function filmRange(timeline: TimelineSegment[], range?: SegmentRange): TimeRange {
  const last = timeline.length - 1;
  if (!range) return { start: 0, end: filmLength(timeline) };
  const start = range.from === 0 ? 0 : STINGS.intro.seconds + timeline[range.from]!.start;
  const end =
    range.to === last ? filmLength(timeline) : STINGS.intro.seconds + timeline[range.to]!.end;
  return { start, end };
}
