/**
 * Cartea zilei: cele trei lucruri de făcut împreună, în ordine fixă —
 * ghicitoare, întrebare de roată, frământare de limbă (FEAT-017).
 *
 * Funcții pure: data vine mereu ca argument, nimic nu se salvează, nimic nu
 * cere serverul. Fiecare element se trage din corpusul lui cu ȘTAMPILA lui —
 * trei rotații independente, ca ghicitoarea de azi să nu-ți spună frământarea
 * de azi (ADR-041).
 *
 * Al doilea rând al fiecărui element e IDENTIC în fiecare zi: e invitația care
 * cere un om mare lângă copil, iar repetiția e exact ce vrea un copil de 7-8 ani.
 */

import { pickForDay, dayNumber } from "./daily-pick";
import { RITUAL } from "./naming";
import { riddles, tongueTwisters, wheelItems } from "../jocuri/content";

export type RitualItem = {
  /** Din ce corpus vine — și cheia de randare a rândului. */
  kind: "ghicitoare" | "roata" | "framantare";
  emoji: string;
  /** Textul de citit cu voce tare. */
  prompt: string;
  /** Al doilea rând: ce fac cei doi cu el. */
  second: string;
  /** Cuvântul din `second` care se îngroașă la afișare; textul copiat rămâne simplu. */
  stress?: string;
  /** Doar ghicitoarea are răspuns — și el nu pleacă NICIODATĂ în textul copiat. */
  answer?: string;
};

export type RitualCard = {
  /** „marți, 9 septembrie" — mic, fiindcă așa intră în textul copiat; pe pagină
   *  eticheta îl scrie cu majuscule din stilul ei. */
  date: string;
  items: RitualItem[];
};

/**
 * Zilele și lunile ca literale, nu prin `toLocaleDateString`: aceeași etichetă
 * în browser și într-un script, fără să depindem de ICU-ul mașinii.
 */
const WEEKDAYS = ["duminică", "luni", "marți", "miercuri", "joi", "vineri", "sâmbătă"];
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

/** Întrebările tuturor seturilor roții, puse cap la cap — un singur corpus de rotit. */
const WHEEL_PROMPTS = wheelItems.flat();

function dateLabel(date: Date): string {
  const weekday = WEEKDAYS[date.getDay()] as string;
  const month = MONTHS[date.getMonth()] as string;
  return `${weekday}, ${date.getDate()} ${month}`;
}

/** Elementul zilei dintr-un corpus cu id-uri; corpus gol → `null`, fără să arunce. */
function pick<T extends { id: string }>(items: readonly T[], day: number, stamp: string): T | null {
  const chosen = pickForDay(
    items.map((item) => item.id),
    day,
    stamp
  );
  return items.find((item) => item.id === chosen) ?? null;
}

export function todayCard(date: Date): RitualCard {
  const day = dayNumber(date);
  const riddle = pick(riddles, day, "azi-ghicitoare");
  const wheel = pick(WHEEL_PROMPTS, day, "azi-roata");
  const twister = pick(tongueTwisters, day, "azi-framantare");
  const items: RitualItem[] = [];
  if (riddle) {
    items.push({
      kind: "ghicitoare",
      emoji: "🔮",
      prompt: riddle.question,
      second: "Ghiciți amândoi. Cine zice primul?",
      answer: riddle.answer,
    });
  }
  if (wheel) {
    items.push({
      kind: "roata",
      emoji: "🎡",
      prompt: wheel.text,
      second: "Întâi copilul. Apoi TU.",
      stress: "TU",
    });
  }
  if (twister) {
    items.push({
      kind: "framantare",
      emoji: "👅",
      prompt: twister.text,
      second: "De trei ori, repede. Cine se încurcă, plătește cu un hohot.",
    });
  }
  return { date: dateLabel(date), items };
}

/**
 * Cartea ca text simplu, de lipit în orice conversație. Răspunsul ghicitorii
 * lipsește DELIBERAT: el e motivul de a deschide linkul de la sfârșit.
 */
export function cardText(card: RitualCard): string {
  const blocks = card.items.map((item) => `${item.emoji} ${item.prompt}\n${item.second}`);
  return [`${RITUAL.name} — ${card.date}`, ...blocks, "vorbaretii.ro/azi"].join("\n\n");
}
