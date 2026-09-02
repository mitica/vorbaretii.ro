/**
 * „Nu-mi da de două ori același lucru."
 *
 * Fiecare joc care scoate elemente dintr-o listă (ghicitori, proverbe, cuvinte,
 * întrebări) trece prin aici. Ținem minte ce a ieșit deja în runda curentă și
 * extragem doar din ce a rămas. Când lista se termină, începe o rundă nouă —
 * fără să repete imediat ce tocmai s-a jucat.
 */

import { shuffle } from "./shuffle";

export type RotationState = {
  /** Id-urile ieșite deja în runda curentă. */
  seen: string[];
  /** Ce s-a extras ultima dată — ca să nu reapară imediat la runda nouă. */
  last: string[];
  /** A câta trecere completă prin listă. Prima e 1. */
  round: number;
};

export const EMPTY_ROTATION: RotationState = { seen: [], last: [], round: 1 };

/**
 * Aduce orice valoare din `localStorage` la forma corectă. Acolo poate sta
 * orice: un format vechi, un JSON scris de altcineva, o valoare trunchiată.
 * Promisiunea „jocul nu se strică niciodată din stocare" ține doar dacă și
 * forma datelor e verificată, nu doar parsarea lor.
 */
export function coerceRotation(value: unknown): RotationState {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return EMPTY_ROTATION;
  }
  const raw = value as Record<string, unknown>;
  const onlyStrings = (input: unknown): string[] =>
    Array.isArray(input)
      ? input.filter((item): item is string => typeof item === "string")
      : [];
  const round =
    typeof raw.round === "number" && Number.isFinite(raw.round) && raw.round >= 1
      ? Math.floor(raw.round)
      : 1;
  return { seen: onlyStrings(raw.seen), last: onlyStrings(raw.last), round };
}

/** Curăță id-uri care nu mai există (conținut editat între două vizite). */
function sanitize(state: RotationState, ids: readonly string[]): RotationState {
  const known = new Set(ids);
  return {
    seen: state.seen.filter((id) => known.has(id)),
    last: state.last.filter((id) => known.has(id)),
    round: state.round >= 1 ? state.round : 1
  };
}

export function pickUnseen(
  ids: readonly string[],
  state: RotationState,
  count: number
): { chosen: string[]; next: RotationState } {
  const clean = sanitize(state, ids);
  const size = Math.min(count, ids.length);
  const unseen = ids.filter((id) => !clean.seen.includes(id));

  if (unseen.length >= size) {
    const chosen = shuffle(unseen).slice(0, size);
    return {
      chosen,
      next: { seen: [...clean.seen, ...chosen], last: chosen, round: clean.round }
    };
  }

  // Lista s-a epuizat: rundă nouă, dar sărim peste ce tocmai a ieșit.
  const withoutLast = ids.filter((id) => !clean.last.includes(id));
  const pool = withoutLast.length >= size ? withoutLast : ids;
  const chosen = shuffle(pool).slice(0, size);
  return { chosen, next: { seen: chosen, last: chosen, round: clean.round + 1 } };
}
