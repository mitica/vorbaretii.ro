/**
 * Bugetele articolului PER BANDĂ de vârstă (ADR-022 în harnessul privat; benzile:
 * ADR-016): lungimile ghidului pe vârste devin lege mecanică — corp, secțiune,
 * beat, „mai mult", numărul de secțiuni. Nicio regulă la nivel de propoziție
 * (decizia operatorului, 2026-09-04: ce e mecanic în text iese fără suflet). Banda
 * derivă din `age` („de la N ani") și nu se stochează. Pur, fără Node — merge
 * și în client. O cifră schimbată aici schimbă contractul (harness: varste.md).
 */

export const BANDS = ["7-8", "9-11", "12-14"] as const;
export type Band = (typeof BANDS)[number];

export type Budget = {
  bodyWordsMin: number;
  bodyWordsMax: number;
  sectionWordsMin: number;
  sectionWordsMax: number;
  beatWordsMax: number;
  moreWordsMax: number;
  sectionsMin: number;
  sectionsMax: number;
};

const BUDGETS: Record<Band, Budget> = {
  "7-8": {
    bodyWordsMin: 200,
    bodyWordsMax: 320,
    sectionWordsMin: 40,
    sectionWordsMax: 80,
    beatWordsMax: 45,
    moreWordsMax: 40,
    sectionsMin: 3,
    sectionsMax: 4,
  },
  "9-11": {
    bodyWordsMin: 350,
    bodyWordsMax: 550,
    sectionWordsMin: 60,
    sectionWordsMax: 120,
    beatWordsMax: 60,
    moreWordsMax: 80,
    sectionsMin: 4,
    sectionsMax: 4,
  },
  "12-14": {
    bodyWordsMin: 500,
    bodyWordsMax: 750,
    sectionWordsMin: 90,
    sectionWordsMax: 160,
    beatWordsMax: 80,
    moreWordsMax: 120,
    sectionsMin: 4,
    sectionsMax: 5,
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
