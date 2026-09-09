/**
 * Articolele scrise ÎNAINTE de legea „peste pragul benzii, două imagini per beat"
 * (ADR-029, GATE-0060 A) — scutite până le completează operatorul cu a doua
 * imagine. Baseline-ul DOAR SCADE (rules/quality): legea din `test-articles.ts`
 * cere ca fiecare slug de aici să existe și să încalce încă regula; altfel
 * intrarea se șterge.
 *
 * Azi lista e GOALĂ — operatorul a completat articolele vechi; mecanismul
 * (`legacyImages`, ramura din `checkSecondImage`) rămâne pe loc, e al deciziei
 * ADR-031, pentru următorul baseline.
 */
export const IMAGES_BASELINE: readonly string[] = [];
