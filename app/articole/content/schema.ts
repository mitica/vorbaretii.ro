/**
 * Contractul de date al articolului (harnessul privat: ADR-002/ADR-003) și
 * validatorul lui, scris de mână — zero dependențe noi. `validateArticle`
 * întoarce lista erorilor (goală = valid); testele îl exersează cu articole
 * stricate, iar registrul (T3) aruncă la build pe orice eroare.
 */

import type { Taxonomy } from "../taxonomy";

type Beat = { text: string; images: string[] };
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
  published: string;
  updated?: string;
  series?: string;
  sections: Section[];
  illustrations: Illustration[];
  sources: Source[];
};

/** Bugetele ratificate (harness: JRN-59/63/67) — cifre, nu gusturi. */
export const LIMITS = {
  bodyWordsMin: 350,
  bodyWordsMax: 550,
  sectionWordsMin: 60,
  sectionWordsMax: 120,
  beatWordsMax: 60,
  moreWordsMax: 80,
  questionCharsMax: 85,
  answerCharsMax: 40,
  imagesPerSectionMin: 2,
  sectionsMin: 2,
  ageMin: 6,
  ageMax: 14,
} as const;

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

type Ctx = { errors: string[]; taxonomy: Taxonomy; anchors: Set<string>; used: Set<string> };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const isDate = (v: unknown) => isStr(v) && DATE_RE.test(v);
const known = (map: Record<string, string>, v: unknown) => isStr(v) && v in map;

function checkMeta(a: Record<string, unknown>, ctx: Ctx) {
  if (!isStr(a.title)) ctx.errors.push("title lipsă sau gol (ADR-002)");
  if (!isStr(a.summary)) ctx.errors.push("summary lipsă sau gol (ADR-002)");
  const ageOk = typeof a.age === "number" && a.age >= LIMITS.ageMin && a.age <= LIMITS.ageMax;
  if (!ageOk) ctx.errors.push(`age trebuie să fie ${LIMITS.ageMin}..${LIMITS.ageMax} (ADR-002)`);
  if (!isDate(a.published)) ctx.errors.push("published lipsă sau nu e YYYY-MM-DD (ADR-002)");
  if (a.updated !== undefined && !isDate(a.updated))
    ctx.errors.push("updated nu e YYYY-MM-DD (ADR-002)");
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

/** Un singur beat: cuvintele + ancorele lui; întoarce numărătoarea. */
function checkBeat(beat: unknown, sid: string, ctx: Ctx): { words: number; images: number } {
  if (!isRecord(beat) || !isStr(beat.text) || !Array.isArray(beat.images)) {
    ctx.errors.push(`beat invalid în secțiunea "${sid}" (ADR-002)`);
    return { words: 0, images: 0 };
  }
  const beatWords = wordCount(beat.text);
  if (beatWords > LIMITS.beatWordsMax)
    ctx.errors.push(`un beat din "${sid}" depășește ${LIMITS.beatWordsMax} cuvinte (ADR-002)`);
  for (const anchor of beat.images) {
    if (typeof anchor === "string") ctx.used.add(anchor);
    if (typeof anchor !== "string" || !ctx.anchors.has(anchor))
      ctx.errors.push(
        `ancora "${String(anchor)}" din "${sid}" nu există în illustrations (ADR-002)`
      );
  }
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
  if (words < LIMITS.sectionWordsMin || words > LIMITS.sectionWordsMax)
    ctx.errors.push(
      `secțiunea "${s.id}" are ${words} cuvinte, în afara ${LIMITS.sectionWordsMin}–${LIMITS.sectionWordsMax} (ADR-002)`
    );
  checkExtras(s, ctx);
  return words;
}

/** „Mai mult” + întrebările unei secțiuni deja validate structural. */
function checkExtras(s: Record<string, unknown>, ctx: Ctx) {
  const sid = String(s.id);
  if (s.more !== undefined && (!isStr(s.more) || wordCount(s.more) > LIMITS.moreWordsMax))
    ctx.errors.push(`„mai mult” din "${sid}" depășește ${LIMITS.moreWordsMax} cuvinte (ADR-002)`);
  const questions = Array.isArray(s.questions) ? s.questions : [];
  if (questions.length === 0)
    ctx.errors.push(`secțiunea "${sid}" nu are nicio întrebare (ADR-002)`);
  for (const q of questions) checkQuestion(q, ctx);
}

function checkSections(a: Record<string, unknown>, ctx: Ctx) {
  const sections = Array.isArray(a.sections) ? a.sections : [];
  if (sections.length < LIMITS.sectionsMin)
    ctx.errors.push(`sub ${LIMITS.sectionsMin} secțiuni (ADR-002)`);
  const ids = new Set<string>();
  let total = 0;
  for (const s of sections) {
    if (isRecord(s) && isStr(s.id)) {
      if (ids.has(s.id)) ctx.errors.push(`id de secțiune duplicat "${s.id}" (ADR-002)`);
      ids.add(s.id);
    }
    total += checkSection(s, ctx);
  }
  if (total < LIMITS.bodyWordsMin || total > LIMITS.bodyWordsMax)
    ctx.errors.push(
      `corpul are ${total} cuvinte, în afara ${LIMITS.bodyWordsMin}–${LIMITS.bodyWordsMax} (ADR-002)`
    );
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

/** Toate erorile articolului, sau [] dacă e valid. Mesajele citează ADR-ul. */
export function validateArticle(json: unknown, taxonomy: Taxonomy): string[] {
  if (!isRecord(json)) return ["articolul nu e un obiect JSON (ADR-002)"];
  const ctx: Ctx = { errors: [], taxonomy, anchors: new Set(), used: new Set() };
  checkMeta(json, ctx);
  checkTaxonomy(json, ctx);
  checkIllustrations(json, ctx);
  checkSections(json, ctx);
  checkSources(json, ctx);
  for (const anchor of ctx.anchors)
    if (anchor !== "erou" && !ctx.used.has(anchor))
      ctx.errors.push(`ilustrația "${anchor}" nu e folosită de niciun beat (ADR-002)`);
  return ctx.errors;
}
