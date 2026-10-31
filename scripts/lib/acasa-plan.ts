/**
 * Alegerea unui lot de săptămâni Vorbăreți Acasă — nucleul PUR al manivelei
 * (`scripts/generate-acasa-weeks.ts`). Vocea vine injectată, ca alegerea să se
 * poată proba fără disc.
 *
 * - lotul începe într-o zi de luni și CONTINUĂ registrul (gol → orice luni);
 * - nicio repetare față de tot registrul, doar elemente cu toată vocea pe disc;
 * - determinist pe seed: fiecare corpus se ordonează după `hashId(seed|tip|id)`,
 *   deci aceleași intrări dau mereu același lot;
 * - fond insuficient → oprire cu mesaj pe tip, niciodată repetare tăcută.
 */

import { isMonday, nextMonday, stampDay, dayStamp } from "../../app/acasa/dates";
import { CORPUS, LOOK, utterancesOf, type CorpusEntry } from "../../app/acasa/items";
import { WEEK_KINDS, type Week, type WeekKind } from "../../app/acasa/registry";
import { hashId } from "../../app/jocuri/content/ids";
import type { Voiced } from "./acasa-law";

export type PlanInput = {
  registry: readonly Week[];
  from: string;
  count: number;
  seed: string;
  voiced: Voiced;
};

function checkStart({ registry, from, count }: PlanInput): void {
  if (!isMonday(from)) throw new Error(`--from ${from} nu e o zi de luni`);
  const last = registry[registry.length - 1];
  if (last && from !== nextMonday(last.monday)) {
    throw new Error(
      `--from ${from} nu continuă registrul: ultima săptămână e ${last.monday}, lotul începe ${nextMonday(last.monday)}`
    );
  }
  if (!Number.isInteger(count) || count < 1) throw new Error(`--weeks ${count}: cel puțin 1`);
}

/** Ce mai poate intra dintr-un corpus: nefolosit în registru, cu voce, fără dubluri, în ordinea seed-ului. */
export function poolOf(kind: WeekKind, input: PlanInput): CorpusEntry[] {
  const used = new Set(input.registry.map((week) => week[kind]));
  const slug = LOOK[kind].slug;
  const fresh = new Map<string, CorpusEntry>();
  for (const entry of CORPUS[kind]) {
    if (used.has(entry.id) || fresh.has(entry.id)) continue;
    if (utterancesOf(entry).every((text) => input.voiced(slug, text))) fresh.set(entry.id, entry);
  }
  const rank = (entry: CorpusEntry): string => hashId(`${input.seed}|${kind}|${entry.id}`);
  return [...fresh.values()].sort((a, b) => order(rank(a), rank(b)) || order(a.id, b.id));
}

/** Ordinea pe coduri, nu pe locale: același lot pe orice mașină. */
function order(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

/** Lotul: `count` săptămâni de la `from`, câte un element nou din fiecare corpus. */
export function planWeeks(input: PlanInput): Week[] {
  checkStart(input);
  const pools = new Map(WEEK_KINDS.map((kind) => [kind, poolOf(kind, input)]));
  const short = WEEK_KINDS.filter((kind) => (pools.get(kind) ?? []).length < input.count);
  if (short.length > 0) {
    const lines = short.map(
      (kind) => `${kind}: rămân ${pools.get(kind)?.length ?? 0} cu voce, trebuie ${input.count}`
    );
    throw new Error(`fond insuficient pentru ${input.count} săptămâni — ${lines.join("; ")}`);
  }
  const start = stampDay(input.from) ?? 0;
  const pickId = (kind: WeekKind, i: number): string => (pools.get(kind)?.[i] as CorpusEntry).id;
  return Array.from({ length: input.count }, (_, i) => ({
    monday: dayStamp(start + 7 * i),
    riddle: pickId("riddle", i),
    wheel: pickId("wheel", i),
    twister: pickId("twister", i),
    proverb: pickId("proverb", i),
  }));
}
