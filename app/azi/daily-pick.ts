/**
 * Cartea zilei: alegerea determinist din data — inima /azi (ADR-041).
 *
 * Funcție pură: nicio stare, niciun `Date.now()` intern, nicio dependență de
 * browser sau `localStorage`. Data vine mereu ca argument — copilul din alt
 * fus orar vede aceeași carte cât timp e „azi" pentru el, nu pentru un ceas
 * fix pe server.
 */

import { hashId } from "../jocuri/content/ids";

/** Câte zile trebuie să treacă între două apariții ale aceluiași element. */
const MIN_GAP_DAYS = 21;
/** Sub acest prag, capul unui ciclu și coada celui anterior s-ar suprapune — nimic de reparat. */
const BOUNDARY_REPAIR_MIN_SIZE = 2 * MIN_GAP_DAYS;

/**
 * Numărul continuu de zile pentru data LOCALĂ a lui `date` — fără graniță de
 * an, fără fus orar: câmpurile calendaristice locale intră direct în UTC, deci
 * 31 decembrie și 1 ianuarie rămân zile consecutive, nu capete de listă.
 */
export function dayNumber(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000;
}

/** mulberry32: generator rapid, determinist, semănat dintr-un singur întreg. */
function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates semănat — aceeași sămânță dă mereu aceeași permutare. */
function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const rng = mulberry32(seed);
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = copy[i] as T;
    const b = copy[j] as T;
    copy[i] = b;
    copy[j] = a;
  }
  return copy;
}

/** Permutarea BRUTĂ (nereparată) a unui ciclu — sămânța vine din ștampilă + ciclu. */
function cyclePermutation(ids: readonly string[], cycle: number, stamp: string): string[] {
  const seed = parseInt(hashId(`${stamp}-ciclu-${cycle}`), 36);
  return seededShuffle(ids, seed);
}

/**
 * Repară granița: niciun element din coada ciclului anterior (ultimele 20 de
 * poziții) nu poate rămâne în capul celui curent (primele 20). Fiecare
 * element din cap care încalcă regula se schimbă cu cea mai joasă poziție
 * liberă din mijloc — [20, n-21] — care nu e ea însăși din coadă (altfel
 * reparația ar muta problema, n-ar rezolva-o). Coada ciclului curent nu se
 * atinge niciodată: reparația viitoare are nevoie doar de permutarea BRUTĂ a
 * acestui ciclu, fără recursie.
 */
function repairBoundary(current: readonly string[], previousTail: ReadonlySet<string>): string[] {
  const n = current.length;
  const lastMiddle = n - MIN_GAP_DAYS - 1;
  const repaired = [...current];
  let candidate = MIN_GAP_DAYS;
  for (let head = 0; head < MIN_GAP_DAYS; head++) {
    if (!previousTail.has(repaired[head] as string)) continue;
    while (candidate <= lastMiddle && previousTail.has(repaired[candidate] as string)) {
      candidate++;
    }
    if (candidate > lastMiddle) break;
    const headValue = repaired[head] as string;
    repaired[head] = repaired[candidate] as string;
    repaired[candidate] = headValue;
    candidate++;
  }
  return repaired;
}

/**
 * Elementul zilei `day` dintr-o rotație pe `ids`, semănată din `stamp`.
 * Pură și deterministă: aceleași argumente întorc mereu același element.
 * `ids` goală întoarce `null` — nimic de ales.
 */
export function pickForDay(ids: readonly string[], day: number, stamp: string): string | null {
  const n = ids.length;
  if (n === 0) return null;
  const cycle = Math.floor(day / n);
  const position = day % n;
  const raw = cyclePermutation(ids, cycle, stamp);
  if (n < BOUNDARY_REPAIR_MIN_SIZE || cycle <= 0) {
    return raw[position] ?? null;
  }
  const previous = cyclePermutation(ids, cycle - 1, stamp);
  const previousTail = new Set(previous.slice(n - MIN_GAP_DAYS));
  const repaired = repairBoundary(raw, previousTail);
  return repaired[position] ?? null;
}
