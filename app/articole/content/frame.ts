/**
 * Rama fixă a articolului (ADR-026 în harnessul privat) — casa unică: aceleași
 * patru secțiuni numite, în aceeași ordine, la fiecare articol, plus cele două
 * formule ale naratorului: pecetea care închide primul beat și replica ce
 * închide ultimul. Titlurile de secțiune nu sunt libere — subiectul stă în
 * titlul articolului, în sumar și în text. Formulele nu intră în bugetele
 * benzii: sunt ale ramei, nu ale articolului. Rama e lege pentru articolele
 * publicate de la FRAME_SINCE încolo; cele de dinainte rămân pe legea veche
 * („Și azi?" ultima) — nu se ating (ordinul operatorului, 2026-09-05).
 * Pur, fără Node — merge și în client.
 */

export const FRAME = [
  { id: "stai-sa-ti-zic", title: "Stai să-ți zic!" },
  { id: "cu-ochii-mei", title: "Am văzut cu ochii mei" },
  { id: "pana-stramba", title: "Pana strâmbă" },
  { id: "si-azi", title: "Și azi?" },
] as const;

/** Prima zi a ramei: `published` ≥ FRAME_SINCE cere rama întreagă. */
export const FRAME_SINCE = "2026-09-05";

/** Articolul e din era ramei? (date ISO, comparabile ca șiruri) */
export function framed(published: string): boolean {
  return published >= FRAME_SINCE;
}

/** Închide primul beat al articolului. */
export const OPENING_SEAL = "Eram acolo. Pe cuvântul meu.";
/** Închide ultimul beat al articolului. */
export const CLOSING_LINE = "…da' asta ți-o povestesc altă dată.";

/** Textul unui beat fără formula ramei de la capăt — bugetele numără doar articolul. */
export function stripFrameLine(text: string): string {
  const trimmed = text.trimEnd();
  for (const line of [OPENING_SEAL, CLOSING_LINE])
    if (trimmed.endsWith(line)) return trimmed.slice(0, -line.length);
  return text;
}
