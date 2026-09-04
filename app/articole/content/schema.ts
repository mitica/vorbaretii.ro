/**
 * Contractul de date al articolului (harnessul privat: ADR-002/ADR-003/ADR-025/
 * ADR-026) și validatorul lui, scris de mână — zero dependențe noi.
 * `validateArticle` întoarce lista erorilor (goală = valid); testele îl
 * exersează cu articole stricate, iar registrul aruncă la build pe orice
 * eroare. Bugetele de cuvinte sunt PER BANDĂ de vârstă (budgets.ts); rama
 * fixă a casei — patru secțiuni numite, pecetea și replica naratorului — e a
 * frame.ts; `rejectSlug` păzește identitatea: slugul nu e numele gol al
 * subiectului.
 */

import type { Taxonomy } from "../taxonomy";
import { bandOf, budgetFor, wordCount, type Budget } from "./budgets";
import { frameErrors, stripFrameLine } from "./frame";

type Beat = { text: string; images: string[]; voce?: string };
type Question = { question: string; answer: string };
type Section = {
  id: string;
  title: string;
  beats: Beat[];
  more?: string;
  questions: Question[];
};
type Illustration = { anchor: string; alt: string };
type Source = { url: string; lang: string };
export type Article = {
  title: string;
  category: string;
  tags: string[];
  summary: string;
  age: number;
  months?: number[];
  days?: string[];
  published: string;
  updated?: string;
  series?: string;
  sections: Section[];
  illustrations: Illustration[];
  sources: Source[];
};

/** Pragurile FĂRĂ bandă (ADR-002/ADR-022); bugetele de cuvinte stau în budgets.ts. */
export const LIMITS = {
  questionCharsMax: 85,
  answerCharsMax: 40,
  imagesPerSectionMin: 2,
  questionsPerArticleMin: 4,
  ageMin: 7,
  ageMax: 14,
} as const;

type Ctx = {
  errors: string[];
  taxonomy: Taxonomy;
  anchors: Set<string>;
  used: Set<string>;
  /** Bugetul benzii lui `age`, sau null când vârsta e invalidă (bugetele nu se mai verifică). */
  budget: Budget | null;
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const isDate = (v: unknown) => isStr(v) && DATE_RE.test(v);
const known = (map: Record<string, string>, v: unknown) => isStr(v) && v in map;

function checkMeta(a: Record<string, unknown>, ctx: Ctx) {
  if (!isStr(a.title)) ctx.errors.push("title lipsă sau gol (ADR-002)");
  if (!isStr(a.summary)) ctx.errors.push("summary lipsă sau gol (ADR-002)");
  if (!ctx.budget)
    ctx.errors.push(`age trebuie să fie ${LIMITS.ageMin}..${LIMITS.ageMax}, întreg (ADR-022)`);
  if (!isDate(a.published)) ctx.errors.push("published lipsă sau nu e YYYY-MM-DD (ADR-002)");
  if (a.updated !== undefined && !isDate(a.updated))
    ctx.errors.push("updated nu e YYYY-MM-DD (ADR-002)");
}

const isMonth = (v: unknown) => Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 12;
const DAY_RE = /^(\d{2})-(\d{2})$/;
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** „LL-ZZ": lună 01..12, zi validă în lună (29.02 permis — anii bisecți există). */
function isDayOfYear(v: unknown): boolean {
  const m = typeof v === "string" ? DAY_RE.exec(v) : null;
  if (!m) return false;
  const month = Number(m[1]);
  const day = Number(m[2]);
  return month >= 1 && month <= 12 && day >= 1 && day <= DAYS_IN_MONTH[month - 1]!;
}

/** O listă de perioadă (`months` sau `days`): absentă, sau nevidă, validă și fără dubluri. */
function checkPeriodList(ctx: Ctx, name: "months" | "days", list: unknown) {
  if (list === undefined) return;
  const ok = name === "months" ? isMonth : isDayOfYear;
  const what = name === "months" ? "luni 1..12" : "zile „LL-ZZ” valide";
  if (!Array.isArray(list) || list.length === 0 || !list.every(ok)) {
    ctx.errors.push(`${name}: listă nevidă de ${what} (ADR-022)`);
    return;
  }
  if (new Set(list).size !== list.length) ctx.errors.push(`${name}: valori duplicate (ADR-022)`);
}

function checkPeriod(a: Record<string, unknown>, ctx: Ctx) {
  checkPeriodList(ctx, "months", a.months);
  checkPeriodList(ctx, "days", a.days);
}

function checkTaxonomy(a: Record<string, unknown>, ctx: Ctx) {
  if (!known(ctx.taxonomy.categories, a.category))
    ctx.errors.push(`category "${String(a.category)}" fără intrare în taxonomy (ADR-002)`);
  const tags = Array.isArray(a.tags) ? a.tags : [];
  if (tags.length === 0) ctx.errors.push("tags: minim un tag (ADR-002)");
  for (const tag of tags)
    if (!known(ctx.taxonomy.tags, tag))
      ctx.errors.push(`tag "${String(tag)}" fără intrare în taxonomy (ADR-002)`);
  if (a.series !== undefined && !known(ctx.taxonomy.seriesTitles, a.series))
    ctx.errors.push(`series "${String(a.series)}" fără intrare în taxonomy (ADR-002)`);
}

function checkQuestion(q: unknown, ctx: Ctx) {
  if (!isRecord(q) || !isStr(q.question) || !isStr(q.answer)) {
    ctx.errors.push("întrebare fără question/answer (ADR-002)");
    return;
  }
  const question = q.question.trim();
  const marks = question.split("?").length - 1;
  if (marks !== 1 || !question.endsWith("?"))
    ctx.errors.push(`întrebarea "${question}" nu e UNA singură, fără coadă după „?” (ADR-002)`);
  if (question.length > LIMITS.questionCharsMax)
    ctx.errors.push(`întrebarea depășește ${LIMITS.questionCharsMax} caractere (ADR-002)`);
  if (q.answer.trim().length > LIMITS.answerCharsMax)
    ctx.errors.push(
      `răspunsul "${q.answer}" depășește ${LIMITS.answerCharsMax} caractere (ADR-002)`
    );
}

function checkBeatAnchors(images: unknown[], sid: string, ctx: Ctx) {
  for (const anchor of images) {
    if (typeof anchor === "string") ctx.used.add(anchor);
    if (typeof anchor !== "string" || !ctx.anchors.has(anchor))
      ctx.errors.push(
        `ancora "${String(anchor)}" din "${sid}" nu există în illustrations (ADR-002)`
      );
  }
}

/** Un singur beat: cuvintele + ancorele lui; întoarce numărătoarea. */
function checkBeat(beat: unknown, sid: string, ctx: Ctx): { words: number; images: number } {
  if (!isRecord(beat) || !isStr(beat.text) || !Array.isArray(beat.images)) {
    ctx.errors.push(`beat invalid în secțiunea "${sid}" (ADR-002)`);
    return { words: 0, images: 0 };
  }
  const beatWords = wordCount(stripFrameLine(beat.text));
  if (ctx.budget && beatWords > ctx.budget.beatWordsMax)
    ctx.errors.push(`un beat din "${sid}" depășește ${ctx.budget.beatWordsMax} cuvinte (ADR-022)`);
  if (beat.voce !== undefined && !isStr(beat.voce))
    ctx.errors.push(`un beat din "${sid}" are «voce» goală — câmpul e opțional, nu vid (ADR-013)`);
  checkBeatAnchors(beat.images, sid, ctx);
  return { words: beatWords, images: beat.images.length };
}

function checkBeats(s: Record<string, unknown>, ctx: Ctx): number {
  const sid = String(s.id);
  const beats = Array.isArray(s.beats) ? s.beats : [];
  if (beats.length === 0) ctx.errors.push(`secțiunea "${sid}" nu are beats (ADR-002)`);
  let words = 0;
  let images = 0;
  for (const beat of beats) {
    const counted = checkBeat(beat, sid, ctx);
    words = words + counted.words;
    images = images + counted.images;
  }
  if (images < LIMITS.imagesPerSectionMin)
    ctx.errors.push(`secțiunea "${sid}" are sub ${LIMITS.imagesPerSectionMin} imagini (ADR-002)`);
  return words;
}

function checkSection(s: unknown, ctx: Ctx): number {
  if (!isRecord(s) || !isStr(s.id) || !isStr(s.title)) {
    ctx.errors.push("secțiune fără id/title (ADR-002)");
    return 0;
  }
  const words = checkBeats(s, ctx);
  const b = ctx.budget;
  if (b && (words < b.sectionWordsMin || words > b.sectionWordsMax))
    ctx.errors.push(
      `secțiunea "${s.id}" are ${words} cuvinte, în afara ${b.sectionWordsMin}–${b.sectionWordsMax} ale benzii (ADR-022)`
    );
  checkExtras(s, ctx);
  return words;
}

/** „Mai mult” + întrebările unei secțiuni deja validate structural. */
function checkExtras(s: Record<string, unknown>, ctx: Ctx) {
  const sid = String(s.id);
  const moreMax = ctx.budget?.moreWordsMax ?? Infinity;
  if (s.more !== undefined && (!isStr(s.more) || wordCount(s.more) > moreMax))
    ctx.errors.push(`„mai mult” din "${sid}" depășește ${moreMax} cuvinte (ADR-022)`);
  const questions = Array.isArray(s.questions) ? s.questions : [];
  if (questions.length === 0)
    ctx.errors.push(`secțiunea "${sid}" nu are nicio întrebare (ADR-002)`);
  for (const q of questions) checkQuestion(q, ctx);
}

/** Corpul articolului, pe bugetul benzii (numărul de secțiuni e al ramei). */
function checkBody(total: number, ctx: Ctx) {
  const b = ctx.budget;
  if (!b) return;
  if (total < b.bodyWordsMin || total > b.bodyWordsMax)
    ctx.errors.push(
      `corpul are ${total} cuvinte, în afara ${b.bodyWordsMin}–${b.bodyWordsMax} ale benzii (ADR-022)`
    );
}

function checkSections(a: Record<string, unknown>, ctx: Ctx) {
  const sections = Array.isArray(a.sections) ? a.sections : [];
  const ids = new Set<string>();
  let total = 0;
  let questions = 0;
  for (const s of sections) {
    if (isRecord(s) && isStr(s.id)) {
      if (ids.has(s.id)) ctx.errors.push(`id de secțiune duplicat "${s.id}" (ADR-002)`);
      ids.add(s.id);
    }
    total = total + checkSection(s, ctx);
    questions = questions + (isRecord(s) && Array.isArray(s.questions) ? s.questions.length : 0);
  }
  if (questions < LIMITS.questionsPerArticleMin)
    ctx.errors.push(`sub ${LIMITS.questionsPerArticleMin} întrebări pe articol (ADR-022)`);
  ctx.errors.push(...frameErrors(sections));
  checkBody(total, ctx);
}

function checkIllustrations(a: Record<string, unknown>, ctx: Ctx) {
  const list = Array.isArray(a.illustrations) ? a.illustrations : [];
  for (const il of list) {
    if (!isRecord(il) || !isStr(il.anchor) || !isStr(il.alt)) {
      ctx.errors.push("ilustrație fără anchor/alt (ADR-002)");
      continue;
    }
    if (ctx.anchors.has(il.anchor)) ctx.errors.push(`ancoră duplicată "${il.anchor}" (ADR-002)`);
    ctx.anchors.add(il.anchor);
  }
  if (!ctx.anchors.has("erou"))
    ctx.errors.push('lipsește ilustrația-erou (ancora "erou") (ADR-002)');
}

function checkSources(a: Record<string, unknown>, ctx: Ctx) {
  const sources = Array.isArray(a.sources) ? a.sources : [];
  let wiki = false;
  for (const src of sources) {
    if (!isRecord(src) || !isStr(src.url) || !isStr(src.lang)) {
      ctx.errors.push("sursă fără url/lang (ADR-002)");
      continue;
    }
    try {
      const host = new URL(src.url).hostname;
      if (host === "wikipedia.org" || host.endsWith(".wikipedia.org")) wiki = true;
    } catch {
      ctx.errors.push(`sursă cu URL invalid "${src.url}" (ADR-003)`);
    }
  }
  if (!wiki) ctx.errors.push("niciun link Wikipedia — fiecare articol cere minim unul (ADR-003)");
}

const SLUG_KINDS: [keyof Taxonomy, string][] = [
  ["categories", "categorie"],
  ["tags", "etichetă"],
  ["seriesTitles", "serie"],
];

/** Slugul poartă UNGHIUL: egal cu o cheie de taxonomie (subiectul e mereu primul tag) = respins. */
export function rejectSlug(slug: string, taxonomy: Taxonomy): string[] {
  return SLUG_KINDS.filter(([key]) => slug in taxonomy[key]).map(
    ([, kind]) =>
      `slugul "${slug}" e o cheie de taxonomie (${kind}) — slugul poartă unghiul, nu subiectul (ADR-022)`
  );
}

/** Toate erorile articolului, sau [] dacă e valid. Mesajele citează ADR-ul. */
export function validateArticle(json: unknown, taxonomy: Taxonomy): string[] {
  if (!isRecord(json)) return ["articolul nu e un obiect JSON (ADR-002)"];
  const band = typeof json.age === "number" ? bandOf(json.age) : null;
  const ctx: Ctx = {
    errors: [],
    taxonomy,
    anchors: new Set(),
    used: new Set(),
    budget: band ? budgetFor(band) : null,
  };
  checkMeta(json, ctx);
  checkPeriod(json, ctx);
  checkTaxonomy(json, ctx);
  checkIllustrations(json, ctx);
  checkSections(json, ctx);
  checkSources(json, ctx);
  for (const anchor of ctx.anchors)
    if (anchor !== "erou" && !ctx.used.has(anchor))
      ctx.errors.push(`ilustrația "${anchor}" nu e folosită de niciun beat (ADR-002)`);
  return ctx.errors;
}
