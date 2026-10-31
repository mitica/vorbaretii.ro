/**
 * Registrul săptămânilor (Vorbăreți Acasă): ce se joacă acasă luni→duminică,
 * același lucru pentru toți. Îl scrie manivela (`yarn generate-acasa-weeks`) în
 * `weeks.json`, pe loturi, și ajunge la copii doar prin merge.
 *
 * Registru COMIS, nu calcul din dată: un link dat luni trebuie să arate același
 * lucru joi, și peste trei luni — iar o rotație din dată s-ar re-deriva la
 * fiecare element nou din fond. În registru stau doar id-uri din fond, niciodată
 * texte copiate; legea lui e `scripts/test-acasa.ts`.
 */

import registry from "./weeks.json";

/** Cele patru elemente ale săptămânii, în ordinea paginii. */
export const WEEK_KINDS = ["riddle", "wheel", "twister", "proverb"] as const;
export type WeekKind = (typeof WEEK_KINDS)[number];

/** O săptămână = lunea ei (AAAA-LL-ZZ) + câte un id din fiecare corpus. */
export type Week = { monday: string } & Record<WeekKind, string>;

export const weeks: readonly Week[] = registry as readonly Week[];
