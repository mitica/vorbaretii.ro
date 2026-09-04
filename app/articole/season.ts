/**
 * „De sezon” — perioada articolului (`months` 1–12 și/sau `days` „LL-ZZ”, din
 * JSON, validate de schemă) contra unei date: adevărat când luna datei e în
 * `months` SAU ziua ei e în `days`; fără perioadă = niciodată. Pur, fără Node —
 * pastila client îl cheamă cu data telefonului, nu a build-ului.
 */

export type Period = { months?: number[]; days?: string[] };

const two = (n: number) => String(n).padStart(2, "0");

export function inSeason(period: Period, date: Date): boolean {
  const month = date.getMonth() + 1;
  const day = `${two(month)}-${two(date.getDate())}`;
  return (period.months?.includes(month) ?? false) || (period.days?.includes(day) ?? false);
}
