/**
 * Calendarul săptămânii: o săptămână = lunea ei, scrisă ca ștampilă AAAA-LL-ZZ.
 *
 * PUR, fără Node: îl citesc și pagina (în browser, ca să afle lunea LOCALĂ a
 * copilului), și manivela, și legea. Zilele se numără pe calendar, nu pe ceas
 * (`dayNumber`): 1970-01-01 a fost joi, deci ziua `d` e luni când `(d + 3) % 7`
 * e zero.
 */

import { dayNumber } from "../azi/daily-pick";

const DAY_MS = 86_400_000;
const STAMP = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Lunile ca literale, nu prin `toLocaleDateString`: aceeași etichetă în browser
 * și într-un script, fără să depindem de ICU-ul mașinii.
 */
const MONTHS = [
  "ianuarie",
  "februarie",
  "martie",
  "aprilie",
  "mai",
  "iunie",
  "iulie",
  "august",
  "septembrie",
  "octombrie",
  "noiembrie",
  "decembrie",
];

/** Numărul de calendar al unei ștampile; `null` dacă nu e o dată reală (2026-02-30). */
export function stampDay(stamp: string): number | null {
  if (!STAMP.test(stamp)) return null;
  const ms = Date.parse(`${stamp}T00:00:00Z`);
  if (Number.isNaN(ms)) return null;
  const day = ms / DAY_MS;
  return dayStamp(day) === stamp ? day : null;
}

/** Ștampila unui număr de calendar. */
export function dayStamp(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

export function isMonday(stamp: string): boolean {
  const day = stampDay(stamp);
  return day !== null && (day + 3) % 7 === 0;
}

/** Lunea de după — aceeași zi a săptămânii, peste șapte zile. */
export function nextMonday(monday: string): string {
  return dayStamp((stampDay(monday) ?? 0) + 7);
}

/** Lunea săptămânii în care cade data LOCALĂ a lui `date` (ceasul copilului). */
export function mondayOf(date: Date): string {
  const day = dayNumber(date);
  return dayStamp(day - ((day + 3) % 7));
}

/** „2–8 noiembrie”; peste granița lunii, „30 noiembrie – 6 decembrie”. */
export function weekLabel(monday: string): string {
  const start = new Date((stampDay(monday) ?? 0) * DAY_MS);
  const end = new Date(start.getTime() + 6 * DAY_MS);
  const startMonth = MONTHS[start.getUTCMonth()] as string;
  const endMonth = MONTHS[end.getUTCMonth()] as string;
  if (startMonth === endMonth) return `${start.getUTCDate()}–${end.getUTCDate()} ${endMonth}`;
  return `${start.getUTCDate()} ${startMonth} – ${end.getUTCDate()} ${endMonth}`;
}

/**
 * Săptămâna lunii `monday` din registru și cea mai recentă săptămână TRECUTĂ
 * (linkul din „n-a sosit încă”): nu ultima din lot, care poate fi în viitor.
 */
export function currentWeek<T extends { monday: string }>(
  weeks: readonly T[],
  monday: string
): { week: T | null; previous: T | null } {
  const past = weeks.filter((candidate) => candidate.monday < monday);
  return {
    week: weeks.find((candidate) => candidate.monday === monday) ?? null,
    previous: past[past.length - 1] ?? null,
  };
}
