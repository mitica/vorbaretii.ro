/**
 * De la id la ce vede copilul: fondul celor patru corpusuri și ținuta fiecărui
 * element al săptămânii (emoji, jocul vocii, dezvăluirea).
 *
 * PUR, dar trage după el corpusurile jocurilor — de-aia îl citesc doar pagina
 * de pe server (la build), manivela și legea. În browser pleacă săptămâna deja
 * rezolvată (`ResolvedWeek`), nu fondul.
 */

import { GAME_OF } from "../azi/episode";
import { proverbs, riddles, tongueTwisters, wheelItems } from "../jocuri/content";
import { weekLabel } from "./dates";
import { WEEK_KINDS, type Week, type WeekKind } from "./registry";

/** Un element din fond, în forma comună: textul de citit și, unde e, ce se dezvăluie. */
export type CorpusEntry = { id: string; prompt: string; reveal?: string };

export type WeekItem = {
  kind: WeekKind;
  emoji: string;
  /** Jocul din care vine — directorul vocii lui. */
  slug: string;
  /** Textul de citit cu voce tare. */
  prompt: string;
  /** Răspunsul ghicitorii, înțelesul proverbului: nu pleacă NICIODATĂ în textul copiat. */
  reveal?: { label: string; text: string };
};

export type ResolvedWeek = { monday: string; label: string; items: WeekItem[] };

/** Săptămâna gata de trimis în browser: plus hash-urile rostirilor ei care au fișier pe disc. */
export type VoicedWeek = ResolvedWeek & { voiced: string[] };

/** Ușa unică spre conținut (`app/jocuri/content.ts`), adusă la aceeași formă. */
export const CORPUS: Readonly<Record<WeekKind, readonly CorpusEntry[]>> = {
  riddle: riddles.map((r) => ({ id: r.id, prompt: r.question, reveal: r.answer })),
  wheel: wheelItems.flat().map((w) => ({ id: w.id, prompt: w.text })),
  twister: tongueTwisters.map((t) => ({ id: t.id, prompt: t.text })),
  proverb: proverbs.map((p) => ({ id: p.id, prompt: p.proverb, reveal: p.meaning })),
};

type Look = { emoji: string; slug: string; revealLabel?: string };

/** Ținuta fiecărui tip — fără instrucțiuni sub text: copiii știu ce e acolo (decizia operatorului). */
export const LOOK: Readonly<Record<WeekKind, Look>> = {
  riddle: {
    emoji: "🔮",
    slug: GAME_OF["ghicitoare"],
    revealLabel: "Arată răspunsul",
  },
  wheel: {
    emoji: "🎡",
    slug: GAME_OF["roata"],
  },
  twister: {
    emoji: "👅",
    slug: GAME_OF["framantare"],
  },
  proverb: {
    emoji: "🧩",
    slug: "proverbe-pereche",
    revealLabel: "Arată înțelesul",
  },
};

export function corpusEntry(kind: WeekKind, id: string): CorpusEntry | undefined {
  return CORPUS[kind].find((entry) => entry.id === id);
}

/** Ce citește vocea ACUM: textul de pe tablă — după dezvăluire, doar răspunsul / înțelesul. */
export function currentUtterance(item: WeekItem, shown: boolean): string {
  return shown && item.reveal ? item.reveal.text : item.prompt;
}

/** Ce trebuie să aibă voce pe disc: textul și, unde e, dezvăluirea (răspuns, înțeles). */
export function utterancesOf(entry: Pick<CorpusEntry, "prompt" | "reveal">): string[] {
  return entry.reveal ? [entry.prompt, entry.reveal] : [entry.prompt];
}

function itemOf(week: Week, kind: WeekKind): WeekItem {
  const entry = corpusEntry(kind, week[kind]);
  if (!entry) {
    throw new Error(`Săptămâna ${week.monday}: id-ul „${week[kind]}” (${kind}) nu e în fond`);
  }
  const look = LOOK[kind];
  const reveal =
    entry.reveal && look.revealLabel ? { label: look.revealLabel, text: entry.reveal } : undefined;
  return {
    kind,
    emoji: look.emoji,
    slug: look.slug,
    prompt: entry.prompt,
    reveal,
  };
}

/** Săptămâna cu texte, gata de randat; un id lipsă din fond oprește build-ul, nu tace. */
export function resolveWeek(week: Week): ResolvedWeek {
  return {
    monday: week.monday,
    label: weekLabel(week.monday),
    items: WEEK_KINDS.map((kind) => itemOf(week, kind)),
  };
}
