/**
 * Numele, căile și linkul de dat pe grup. PUR — le citesc pagina și legea.
 *
 * Pe grup pleacă DOAR linkul săptămânii (decizia operatorului): conținutul,
 * vocea și dezvăluirile sunt motivul de a-l deschide.
 */

import type { ResolvedWeek } from "./items";

export const ACASA = {
  name: "Vorbăreți Acasă",
  page: "/acasa",
  /** Subtitlul de pe pagină; data vine după el. */
  subtitle: "Vorbărim toată săptămâna",
  /** Descrierea meta/OG: acolo titlul nu stă alături. */
  description: "Vorbărim acasă toată săptămâna",
} as const;

/** Calea săptămânii pe site: `/acasa/2026-11-02`. */
export function weekPath(monday: string): string {
  return `${ACASA.page}/${monday}`;
}

/** „Vorbăreți Acasă — 2–8 noiembrie”: titlul paginii săptămânii (și al previzualizării pe grup). */
export function weekTitle(week: Pick<ResolvedWeek, "label">): string {
  return `${ACASA.name} — ${week.label}`;
}

/** Linkul copiat de „Copiază linkul”: `vorbaretii.ro/acasa/2026-11-02`. */
export function weekLink(monday: string): string {
  return `vorbaretii.ro${weekPath(monday)}`;
}
