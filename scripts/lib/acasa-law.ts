/**
 * Legea registrului Vorbăreți Acasă (`app/acasa/weeks.json`). PURĂ: vocea vine
 * injectată, ca registrele rele să se poată fabrica în test fără niciun fișier
 * pe disc. Registrul gol e valid.
 *
 * Fiecare problemă numește săptămâna și id-ul: după o corectură de text în fond,
 * id-ul vechi rămâne orfan aici, iar mesajul spune exact ce rând de reparat.
 */

import { isMonday, nextMonday } from "../../app/acasa/dates";
import { LOOK, corpusEntry, utterancesOf } from "../../app/acasa/items";
import { WEEK_KINDS, type WeekKind } from "../../app/acasa/registry";

/** Are rostirea asta fișier pe disc, în directorul jocului ei? */
export type Voiced = (slug: string, text: string) => boolean;

const KEYS = new Set<string>(["monday", ...WEEK_KINDS]);

type Row = Record<string, unknown>;

function shapeProblems(row: Row, where: string): string[] {
  const problems: string[] = [];
  for (const key of Object.keys(row)) {
    if (!KEYS.has(key)) problems.push(`${where}: cheie în plus „${key}”`);
  }
  for (const kind of WEEK_KINDS) {
    if (typeof row[kind] !== "string") problems.push(`${where}: lipsește id-ul „${kind}”`);
  }
  return problems;
}

function calendarProblems(monday: string, previous: string | null): string[] {
  if (!isMonday(monday)) return [`săptămâna ${monday}: nu e o zi de luni`];
  if (previous === null || !isMonday(previous)) return [];
  const expected = nextMonday(previous);
  return monday === expected
    ? []
    : [`săptămâna ${monday}: după ${previous} urma ${expected} (contigue, în ordine)`];
}

/** Ce lipsește unui element: fondul sau vocea. Mesajele vin fără săptămână — o pune cine cheamă. */
function itemProblems(kind: WeekKind, id: string, voiced: Voiced): string[] {
  const entry = corpusEntry(kind, id);
  if (!entry) return [`id-ul „${id}” (${kind}) nu e în fond`];
  const slug = LOOK[kind].slug;
  return utterancesOf(entry)
    .filter((text) => !voiced(slug, text))
    .map((text) => `id-ul „${id}” (${kind}) n-are voce pe disc pentru „${text}”`);
}

function weekProblems(row: Row, seen: Map<string, string>, voiced: Voiced): string[] {
  const monday = String(row.monday);
  const where = `săptămâna ${monday}`;
  const problems = shapeProblems(row, where);
  for (const kind of WEEK_KINDS) {
    const id = row[kind];
    if (typeof id !== "string") continue;
    const first = seen.get(`${kind}:${id}`);
    if (first) problems.push(`${where}: id-ul „${id}” (${kind}) s-a mai dat în ${first}`);
    seen.set(`${kind}:${id}`, monday);
    problems.push(...itemProblems(kind, id, voiced).map((problem) => `${where}: ${problem}`));
  }
  return problems;
}

/** Problemele registrului; listă goală = trece. */
export function registryProblems(registry: readonly unknown[], voiced: Voiced): string[] {
  const problems: string[] = [];
  const seen = new Map<string, string>();
  let previous: string | null = null;
  for (const raw of registry) {
    const row = (typeof raw === "object" && raw !== null ? raw : {}) as Row;
    const monday = String(row.monday);
    problems.push(...calendarProblems(monday, previous), ...weekProblems(row, seen, voiced));
    previous = monday;
  }
  return problems;
}
