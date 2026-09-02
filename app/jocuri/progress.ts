/**
 * Progresul salvat de jocuri, citit pentru pagina de index și pentru salutul
 * de revenire. Totul trece prin storage.ts și rămâne în browserul copilului —
 * fără cont, fără server (decisions.md D8).
 */

import { coerceRotation } from "./components/rotation";
import { loadJson, saveJson } from "./components/storage";
import {
  anagrams,
  categories,
  emojiRebus,
  hiddenWords,
  memoryPairs,
  proverbs,
  riddles,
  storyDice,
  tongueTwisters,
  wheelDecks,
  wheelItems
} from "./content";

export type GameProgress = { seen: number; total: number; round: number };

/** Cheile de rotație și id-urile fiecărui joc; roata are câte o cheie pe set. */
const sources: Record<string, { key: string; ids: string[] }[]> = {
  "roata-cuvintelor": wheelDecks.map((deck, index) => ({
    key: `roata.${deck.id}`,
    ids: wheelItems[index].map((item) => item.id)
  })),
  ghicitori: [{ key: "ghicitori", ids: riddles.map((item) => item.id) }],
  "proverbe-pereche": [
    { key: "proverbe", ids: proverbs.map((item) => item.id) }
  ],
  anagrame: [{ key: "anagrame", ids: anagrams.map((item) => item.id) }],
  "zarurile-de-poveste": [
    { key: "zaruri", ids: storyDice.map((item) => item.id) }
  ],
  categorii: [{ key: "categorii", ids: categories.map((item) => item.id) }],
  "framantari-de-limba": [
    { key: "framantari", ids: tongueTwisters.map((item) => item.id) }
  ],
  "cuvantul-ascuns": [
    { key: "ascuns", ids: hiddenWords.map((item) => item.id) }
  ],
  "poveste-din-emoji": [
    { key: "rebus", ids: emojiRebus.map((item) => item.id) }
  ],
  memorie: [{ key: "memorie", ids: memoryPairs.map((item) => item.id) }]
};

/**
 * Câte elemente a văzut copilul din jocul `slug`, din câte în total. La roată,
 * seturile se adună; runda e cea mai mică dintre seturi (abia când le-a
 * terminat pe toate a închis o trecere completă).
 */
export function readProgress(slug: string): GameProgress | null {
  const parts = sources[slug];
  if (!parts) return null;
  let seen = 0;
  let total = 0;
  let round = Number.POSITIVE_INFINITY;
  for (const part of parts) {
    const state = coerceRotation(loadJson<unknown>(part.key, null));
    const known = new Set(part.ids);
    seen += state.seen.filter((id) => known.has(id)).length;
    total += part.ids.length;
    round = Math.min(round, state.round);
  }
  return { seen, total, round: Number.isFinite(round) ? round : 1 };
}

/* ----------------------------------------------------------- ultima vizită */

const VISIT_KEY = "ultima-vizita";

export type LastVisit = { slug: string; at: number };

export function readLastVisit(): LastVisit | null {
  const value = loadJson<unknown>(VISIT_KEY, null);
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.slug !== "string" || typeof raw.at !== "number") return null;
  return { slug: raw.slug, at: raw.at };
}

export function writeLastVisit(slug: string): void {
  saveJson(VISIT_KEY, { slug, at: Date.now() });
}
