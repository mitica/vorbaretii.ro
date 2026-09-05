/**
 * Articolele scrise ÎNAINTE de legea „peste pragul benzii, două imagini per beat"
 * (ADR-029, GATE-0060 A) — scutite până le completează operatorul cu a doua
 * imagine. Baseline-ul DOAR SCADE (rules/quality): legea din `test-articles.ts`
 * cere ca fiecare slug de aici să existe și să încalce încă regula; altfel
 * intrarea se șterge.
 */
export const IMAGES_BASELINE: readonly string[] = ["martisorul-care-ajunge-in-pom"];
