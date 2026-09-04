/**
 * Rama fixă a articolului (ADR-026 în harnessul privat) — casa unică: aceleași
 * patru secțiuni numite, în aceeași ordine, la fiecare articol, plus cele două
 * formule ale naratorului: pecetea care închide primul beat și replica ce
 * închide ultimul. Titlurile de secțiune nu sunt libere — subiectul stă în
 * titlul articolului, în sumar și în text. Formulele nu intră în bugetele
 * benzii: sunt ale ramei, nu ale articolului. Rama e lege pentru articolele
 * publicate de la FRAME_SINCE încolo; cele de dinainte rămân pe legea veche
 * („Și azi?" ultima) — nu se ating (ordinul operatorului, 2026-09-05).
 * Verificarea ramei trăiește tot aici (`shapeErrors`); schema o apelează.
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

/** Închide primul beat al articolului. */
export const OPENING_SEAL = "Eram acolo. Pe cuvântul meu.";
/** Închide ultimul beat al articolului. */
export const CLOSING_LINE = "…da' asta ți-o povestesc altă dată.";

type Rec = Record<string, unknown>;
const isRecord = (v: unknown): v is Rec => typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";

/** Textul unui beat fără formula ramei de la capăt — bugetele numără doar articolul. */
export function stripFrameLine(text: string): string {
  const trimmed = text.trimEnd();
  for (const line of [OPENING_SEAL, CLOSING_LINE])
    if (trimmed.endsWith(line)) return trimmed.slice(0, -line.length);
  return text;
}

/** Beat-ul de la marginea unei secțiuni (primul sau ultimul), dacă e formată. */
function edgeBeat(section: unknown, edge: "first" | "last"): Rec | null {
  const beats = isRecord(section) && Array.isArray(section.beats) ? section.beats : [];
  const beat: unknown = edge === "first" ? beats[0] : beats[beats.length - 1];
  return isRecord(beat) ? beat : null;
}

/** Textul beat-ului (și «voce», dacă există — audio-ul o rostește) se închide cu formula. */
function frameLineError(beat: Rec | null, line: string, where: string): string | null {
  const carriers = [beat?.text, beat?.voce].filter(isStr);
  const broken = !beat || carriers.some((t) => !t.trimEnd().endsWith(line));
  return broken ? `${where} trebuie să se închidă cu „${line}” (ADR-026)` : null;
}

/** Erorile ramei: patru secțiuni numite, în ordine; pecetea și replica. */
function frameErrors(sections: unknown[]): string[] {
  const errors: string[] = [];
  if (sections.length !== FRAME.length)
    errors.push(`rama are ${FRAME.length} secțiuni, articolul are ${sections.length} (ADR-026)`);
  FRAME.forEach((slot, i) => {
    const s = sections[i];
    const id = isRecord(s) && isStr(s.id) ? s.id : "";
    const title = isRecord(s) && isStr(s.title) ? s.title : "";
    if (id !== slot.id || title !== slot.title)
      errors.push(
        `secțiunea ${i + 1} trebuie să fie „${slot.title}” (id "${slot.id}"), nu „${title}” (id "${id}") (ADR-026)`
      );
  });
  const opening = frameLineError(edgeBeat(sections[0], "first"), OPENING_SEAL, "primul beat");
  const last = edgeBeat(sections[sections.length - 1], "last");
  const closing = frameLineError(last, CLOSING_LINE, "ultimul beat");
  for (const e of [opening, closing]) if (e !== null) errors.push(e);
  return errors;
}

/** Legea de dinaintea ramei (ADR-022): ultima secțiune e „Și azi?”. */
function legacyClosingErrors(sections: unknown[]): string[] {
  const last = sections[sections.length - 1];
  const id = isRecord(last) && isStr(last.id) ? last.id : "";
  if (id === FRAME[3].id) return [];
  return [`ultima secțiune trebuie să fie „Și azi?” (id "${FRAME[3].id}"), nu "${id}" (ADR-022)`];
}

/** Forma articolului după data publicării: rama (de la FRAME_SINCE) sau legea veche. */
export function shapeErrors(published: unknown, sections: unknown[]): string[] {
  const framed = isStr(published) && published >= FRAME_SINCE;
  return framed ? frameErrors(sections) : legacyClosingErrors(sections);
}
