/**
 * Bugetele articolului PER BANDĂ de vârstă (ADR-025 în harnessul privat; benzile:
 * ADR-016): lungimile ghidului pe vârste devin lege mecanică — corp, secțiune,
 * beat, „mai mult". Numărul și numele secțiunilor sunt ale ramei fixe
 * (frame.ts, ADR-027), nu ale benzii. Nicio regulă la nivel de propoziție
 * (decizia operatorului, 2026-09-04: ce e mecanic în text iese fără suflet). Banda
 * derivă din `age` („de la N ani") și nu se stochează. Pur, fără Node — merge
 * și în client. O cifră schimbată aici schimbă contractul (harness: varste.md).
 */

import { stripFrameLine } from "./frame";

export const BANDS = ["7-8", "9-11", "12-14"] as const;
export type Band = (typeof BANDS)[number];

export type Budget = {
  bodyWordsMin: number;
  bodyWordsMax: number;
  sectionWordsMin: number;
  sectionWordsMax: number;
  beatWordsMax: number;
  moreWordsMax: number;
  /** Peste atâtea cuvinte beat-ul cere DOUĂ imagini (GATE-0060 A): ≈ 2 × cadrul minim al benzii × ritmul vorbirii. */
  twoImagesAboveWords: number;
};

const BUDGETS: Record<Band, Budget> = {
  "7-8": {
    bodyWordsMin: 200,
    bodyWordsMax: 320,
    sectionWordsMin: 40,
    sectionWordsMax: 80,
    beatWordsMax: 45,
    moreWordsMax: 40,
    twoImagesAboveWords: 22, // 2 × 6 s × 1,8 cuv/s
  },
  "9-11": {
    bodyWordsMin: 350,
    bodyWordsMax: 550,
    sectionWordsMin: 60,
    sectionWordsMax: 120,
    beatWordsMax: 60,
    moreWordsMax: 80,
    twoImagesAboveWords: 23, // 2 × 5 s × 2,3 cuv/s
  },
  "12-14": {
    bodyWordsMin: 500,
    bodyWordsMax: 750,
    sectionWordsMin: 90,
    sectionWordsMax: 160,
    beatWordsMax: 80,
    moreWordsMax: 120,
    twoImagesAboveWords: 20, // 2 × 4 s × 2,5 cuv/s
  },
};

/** Banda unei vârste („de la N ani"); în afara 7–14, sau nu întreg → null. */
export function bandOf(age: number): Band | null {
  if (!Number.isInteger(age)) return null;
  if (age >= 7 && age <= 8) return "7-8";
  if (age >= 9 && age <= 11) return "9-11";
  if (age >= 12 && age <= 14) return "12-14";
  return null;
}

export function budgetFor(band: Band): Budget {
  return BUDGETS[band];
}

export function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** Cuvintele pe care le numără LEGEA: ale articolului, fără formula ramei de la capătul beat-ului (ADR-027). */
export function countedWords(beatText: string): number {
  return wordCount(stripFrameLine(beatText));
}
