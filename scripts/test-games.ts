/// <reference lib="dom" />
// Registrul de progres trăiește lângă `localStorage` (client), deci tipurile DOM
// sunt cerute doar ca să-l putem importa aici; nimic din test nu atinge browserul.
/**
 * Testele logicii pure a jocurilor: rotația „nu repeta nimic", amestecările,
 * acordul numeralelor și invariantele conținutului. Rulează local:
 *
 *   yarn test
 *
 * Fără bibliotecă de teste: `node:test` vine cu Node și își rulează testele
 * direct în procesul curent când fișierul e executat cu ts-node.
 */

import { PROGRESS_SOURCES, SERVER_DERIVED_PROGRESS } from "../app/jocuri/progress";
import assert from "node:assert/strict";
import test from "node:test";

import { cardText, todayCard } from "../app/azi/card";
import { dayNumber, pickForDay } from "../app/azi/daily-pick";
import { numeralDe, tries } from "../app/jocuri/components/format";
import {
  EMPTY_ROTATION,
  coerceRotation,
  pickUnseen,
  type RotationState,
} from "../app/jocuri/components/rotation";
import { scrambleIndexes, shuffle, shuffleApart } from "../app/jocuri/components/shuffle";
import {
  anagrams,
  categories,
  emojiRebus,
  hiddenWords,
  memoryPairs,
  proverbs,
  riddles,
  sellItems,
  storyDice,
  storyStarters,
  tabooWords,
  tongueTwisters,
  wheelDecks,
  wheelItems,
} from "../app/jocuri/content";
import { games } from "../app/jocuri/games";

const ids = (count: number) => Array.from({ length: count }, (_, i) => `id${i}`);

test("pickUnseen nu repetă nimic până nu a arătat tot", () => {
  const all = ids(30);
  let state: RotationState = EMPTY_ROTATION;
  const seen: string[] = [];
  for (let i = 0; i < 30; i++) {
    const { chosen, next } = pickUnseen(all, state, 1);
    seen.push(...chosen);
    state = next;
  }
  assert.equal(new Set(seen).size, 30);
  assert.equal(state.round, 1);
});

test("runda nouă nu repetă imediat ultima extragere", () => {
  const all = ids(5);
  let state: RotationState = EMPTY_ROTATION;
  for (let i = 0; i < 5; i++) state = pickUnseen(all, state, 1).next;
  const lastDrawn = state.last[0];
  const { chosen, next } = pickUnseen(all, state, 1);
  assert.equal(next.round, 2);
  assert.notEqual(chosen[0], lastDrawn);
});

test("când rămân mai puține decât lotul, începe runda următoare", () => {
  const all = ids(10);
  let state: RotationState = EMPTY_ROTATION;
  state = pickUnseen(all, state, 4).next;
  state = pickUnseen(all, state, 4).next; // 8 văzute, mai rămân 2
  const { chosen, next } = pickUnseen(all, state, 4);
  assert.equal(next.round, 2);
  assert.equal(new Set(chosen).size, 4);
  for (const id of chosen) assert.ok(!state.last.includes(id));
});

test("lot mai mare decât lista întreagă: dă tot ce există", () => {
  const { chosen } = pickUnseen(ids(3), EMPTY_ROTATION, 8);
  assert.equal(chosen.length, 3);
});

test("id-urile dispărute din conținut se curăță", () => {
  const state: RotationState = { seen: ["idX", "id1"], last: ["idX"], round: 1 };
  const { next } = pickUnseen(ids(3), state, 1);
  assert.ok(!next.seen.includes("idX"));
});

test("coerceRotation aduce orice gunoi la forma corectă", () => {
  assert.deepEqual(coerceRotation(null), EMPTY_ROTATION);
  assert.deepEqual(coerceRotation(42), EMPTY_ROTATION);
  assert.deepEqual(coerceRotation("text"), EMPTY_ROTATION);
  assert.deepEqual(coerceRotation([1, 2]), EMPTY_ROTATION);
  assert.deepEqual(coerceRotation({ seen: "nu-i listă" }), EMPTY_ROTATION);
  assert.deepEqual(coerceRotation({ seen: ["a", 5], last: [], round: 2.9 }), {
    seen: ["a"],
    last: [],
    round: 2,
  });
  const valid: RotationState = { seen: ["a"], last: ["a"], round: 3 };
  assert.deepEqual(coerceRotation(valid), valid);
});

test("scrambleIndexes nu lasă niciodată cuvântul în ordinea corectă", () => {
  for (let i = 0; i < 200; i++) {
    const mixed = scrambleIndexes("PRIETEN");
    assert.deepEqual(
      [...mixed].sort((a, b) => a - b),
      [0, 1, 2, 3, 4, 5, 6]
    );
    assert.notEqual(mixed.map((j) => "PRIETEN"[j]).join(""), "PRIETEN");
  }
  assert.deepEqual(scrambleIndexes("A"), [0]);
});

test("shuffleApart schimbă mereu ordinea, cu aceleași elemente", () => {
  const items = ["a", "b", "c", "d"];
  for (let i = 0; i < 200; i++) {
    const mixed = shuffleApart(items);
    assert.deepEqual([...mixed].sort(), items);
    assert.ok(mixed.some((item, index) => item !== items[index]));
  }
  assert.deepEqual(shuffleApart(["x"]), ["x"]);
});

test("shuffle păstrează elementele", () => {
  const mixed = shuffle([1, 2, 3, 4, 5]);
  assert.deepEqual(
    [...mixed].sort((a, b) => a - b),
    [1, 2, 3, 4, 5]
  );
});

test("acordul numeralului: «o încercare», «de»", () => {
  assert.equal(tries(1), "o încercare");
  assert.equal(tries(3), "3 încercări");
  assert.equal(tries(19), "19 încercări");
  assert.equal(tries(20), "20 de încercări");
  assert.equal(tries(101), "101 încercări");
  assert.equal(tries(120), "120 de încercări");
  assert.equal(numeralDe(48), "48 de");
  assert.equal(numeralDe(12), "12");
  assert.equal(numeralDe(0), "0");
});

test("conținut: id-urile sunt unice în fiecare listă", () => {
  const lists: { name: string; ids: string[] }[] = [
    { name: "ghicitori", ids: riddles.map((item) => item.id) },
    { name: "proverbe", ids: proverbs.map((item) => item.id) },
    { name: "anagrame", ids: anagrams.map((item) => item.id) },
    { name: "memorie", ids: memoryPairs.map((item) => item.id) },
    { name: "zaruri", ids: storyDice.map((item) => item.id) },
    { name: "categorii", ids: categories.map((item) => item.id) },
    { name: "framantari", ids: tongueTwisters.map((item) => item.id) },
    { name: "ascuns", ids: hiddenWords.map((item) => item.id) },
    { name: "rebus", ids: emojiRebus.map((item) => item.id) },
    { name: "vinde", ids: sellItems.map((item) => item.id) },
    { name: "altfel", ids: tabooWords.map((item) => item.id) },
    ...wheelItems.map((items, index) => ({
      name: `roata.${wheelDecks[index]?.id ?? index}`,
      ids: items.map((item) => item.id),
    })),
  ];
  for (const list of lists) {
    assert.equal(new Set(list.ids).size, list.ids.length, list.name);
  }
});

test("conținut: regulile de gabarit din docs/games.md — jocurile de cuvinte", () => {
  for (const item of anagrams) {
    assert.ok(item.word.length <= 9, item.word);
    assert.equal(item.word, item.word.toLocaleUpperCase("ro"), item.word);
  }
  for (const pair of memoryPairs) assert.ok(pair.word.length <= 8, pair.word);
  for (const riddle of riddles) assert.ok(!riddle.answer.trim().includes(" "), riddle.answer);
  const alphabet = new Set("AĂÂBCDEFGHIÎJKLMNOPRSȘTȚUVXZ");
  for (const item of hiddenWords) {
    assert.ok(item.word.length <= 10, item.word);
    for (const letter of item.word) assert.ok(alphabet.has(letter), item.word);
  }
  for (const twister of tongueTwisters) {
    assert.ok(twister.text.length > 0 && twister.text.length <= 95, twister.text);
  }
});

test("conținut: regulile de gabarit din docs/games.md — jocurile de scenă", () => {
  for (const deck of wheelDecks) assert.equal(deck.prompts.length, 12, deck.label);
  for (const die of storyDice) {
    assert.ok(die.word.length <= 9, die.word);
    assert.ok(!die.word.includes(" "), die.word);
  }
  for (const starter of storyStarters) assert.ok(starter.length <= 45, starter);
  for (const category of categories) {
    assert.match(category.prompt, /^5 /);
    assert.ok(category.prompt.length <= 60, category.prompt);
  }
  for (const sell of sellItems) {
    assert.ok(sell.item.length <= 45, sell.item);
    assert.ok(sell.bonus.length > 0 && sell.bonus.length <= 80, sell.item);
  }
  for (const taboo of tabooWords) {
    assert.ok(taboo.word.length <= 12, taboo.word);
    assert.equal(taboo.forbidden.length, 3, taboo.word);
  }
  for (const rebus of emojiRebus) {
    assert.ok(rebus.answer.length > 0 && rebus.answer.length <= 50, rebus.answer);
    assert.ok(["poveste", "proverb", "cuvant"].includes(rebus.category), rebus.answer);
  }
});

test("conținut: întrebările roții sunt scurte — una singură, fără coadă", () => {
  for (const deck of wheelDecks) {
    for (const prompt of deck.prompts) {
      assert.ok(!/\?\s+\S/.test(prompt), `coadă după întrebare: ${prompt}`);
      assert.ok(prompt.length <= 85, `prea lungă (${prompt.length}): ${prompt}`);
    }
  }
});

// --- Legea fondului: orizontul de 90 de zile (ADR-042) --------------------

/** Fondul unei liste sub pragul orizontului — [] când e suficient. */
function corpusShortfalls(name: string, count: number, threshold: number): string[] {
  if (count >= threshold) return [];
  return [
    `ADR-042: ${name} are ${count}, sub pragul de ${threshold} (diferență ${threshold - count})`,
  ];
}

test("fond: ghicitorile și frământările acoperă orizontul de 90 de zile, roata are cel puțin 8 decuri (ADR-042)", () => {
  const problems = [
    ...corpusShortfalls("ghicitori", riddles.length, 90),
    ...corpusShortfalls("framantari", tongueTwisters.length, 90),
    ...corpusShortfalls("decuri roata", wheelDecks.length, 8),
  ];
  assert.equal(problems.length, 0, problems.join("\n"));
});

test("fond: aceeași verificare respinge un fond fabricat de 89 — legea se probează pe sine (ADR-042)", () => {
  const problems = corpusShortfalls("fond fabricat", 89, 90);
  assert.equal(problems.length, 1);
  assert.match(problems[0]!, /ADR-042/);
  assert.match(problems[0]!, /fond fabricat/);
  assert.match(problems[0]!, /diferență 1/);
});

test("conținut: întrebările ghicitorilor încap pe ecran — plafon 120 caractere (ADR-042)", () => {
  const over = riddles.filter((riddle) => riddle.question.length > 120);
  assert.deepEqual(
    over.map((riddle) => riddle.id),
    [],
    `ADR-042: întrebări peste 120 caractere: ${over
      .map((riddle) => `${riddle.id} (${riddle.question.length})`)
      .join(", ")}`
  );
});

test("registrul: fiecare joc are slug, seo și eticheta elementelor", () => {
  for (const game of games) {
    assert.match(game.slug, /^[a-z-]+$/);
    assert.ok(game.seo.title.length > 10, game.slug);
    assert.ok(game.seo.description.length > 20, game.slug);
    assert.ok(game.itemsLabel.length > 0, game.slug);
  }
});

test("registrul de progres acoperă toate jocurile: static sau derivat la build", () => {
  // Un joc lipsă din registru nu crapă — `readProgress` întoarce null și cardul
  // lui rămâne mut pentru totdeauna. Legea cere ca fiecare slug să fie undeva.
  const covered = new Set([...Object.keys(PROGRESS_SOURCES), ...SERVER_DERIVED_PROGRESS]);
  for (const game of games) {
    assert.ok(covered.has(game.slug), `jocul ${game.slug} lipsește din registrul de progres`);
  }
  for (const slug of covered) {
    assert.ok(
      games.some((g) => g.slug === slug),
      `registrul de progres are un slug fantomă: ${slug}`
    );
  }
});

// --- Cartea zilei: rotația determinist din dată (ADR-041) -----------------

/** Simulează 400 de zile consecutive care traversează 1 ianuarie de două ori. */
function simulateDays(list: readonly string[], stamp: string) {
  const days: number[] = [];
  const picks: (string | null)[] = [];
  for (let i = 0; i < 400; i++) {
    const day = dayNumber(new Date(2025, 11, 20 + i));
    days.push(day);
    picks.push(pickForDay(list, day, stamp));
  }
  return { days, picks };
}

/** Grupează extragerile pe ciclu, dar păstrează doar ciclurile complet acoperite. */
function fullCycles(days: number[], picks: (string | null)[], n: number): Map<number, string[]> {
  const byCycle = new Map<number, string[]>();
  for (let i = 0; i < days.length; i++) {
    const day = days[i] as number;
    const cycle = Math.floor(day / n);
    const arr = byCycle.get(cycle) ?? [];
    arr.push(picks[i] as string);
    byCycle.set(cycle, arr);
  }
  const first = days[0] as number;
  const last = days[days.length - 1] as number;
  for (const cycle of [...byCycle.keys()]) {
    if (cycle * n < first || cycle * n + n - 1 > last) byCycle.delete(cycle);
  }
  return byCycle;
}

test("azi: zilele rămân continue peste granița de an", () => {
  const { days } = simulateDays(ids(90), "azi-ghicitoare");
  for (let i = 1; i < days.length; i++) {
    assert.equal((days[i] as number) - (days[i - 1] as number), 1);
  }
});

test("azi: fiecare ciclu de 90 arată toate cele 90 de elemente, o dată", () => {
  const { days, picks } = simulateDays(ids(90), "azi-ghicitoare");
  const cycles = fullCycles(days, picks, 90);
  assert.ok(cycles.size >= 3, "prea puține cicluri complete de verificat");
  for (const [cycle, elements] of cycles) {
    assert.equal(elements.length, 90, `ciclul ${cycle}`);
    assert.equal(new Set(elements).size, 90, `ciclul ${cycle}`);
  }
});

test("azi: pentru 12 elemente (sub pragul de 42), niciun element nu se repetă în ciclu", () => {
  const { days, picks } = simulateDays(ids(12), "azi-framantare");
  const cycles = fullCycles(days, picks, 12);
  assert.ok(cycles.size >= 20, "prea puține cicluri complete de verificat");
  for (const [cycle, elements] of cycles) {
    assert.equal(new Set(elements).size, 12, `ciclul ${cycle}`);
  }
});

test("azi: între două apariții ale aceluiași element trec cel puțin 21 de zile (n=90, peste graniță)", () => {
  const { days, picks } = simulateDays(ids(90), "azi-roata");
  const last = new Map<string, number>();
  for (let i = 0; i < picks.length; i++) {
    const id = picks[i] as string;
    const day = days[i] as number;
    const previous = last.get(id);
    if (previous !== undefined) {
      assert.ok(day - previous >= 21, `${id}: interval de ${day - previous} zile`);
    }
    last.set(id, day);
  }
});

test("azi: ștampile diferite dau șiruri necorelate", () => {
  const list = ids(90);
  const { days, picks: picksA } = simulateDays(list, "azi-ghicitoare");
  const { picks: picksB } = simulateDays(list, "azi-roata");
  const indexOf = new Map(list.map((id, i) => [id, i]));

  // Necorelarea care se poate cere: șirurile nu sunt identice…
  assert.ok(
    picksA.some((pick, i) => pick !== picksB[i]),
    "cele două ștampile dau același șir — alegerile se corelează"
  );

  // …și nici o simplă decalare una față de alta. Un decalaj constant ar însemna că
  // ghicitoarea de azi îți spune frământarea de azi.
  // NU se cere ca perechea (A, B) să nu revină niciodată: două permutări independente
  // coincid, în medie, într-o poziție, deci ~10 coincidențe pe cele 5 cicluri traversate.
  // Singurul mod de a le duce la zero ar fi corelarea deliberată a listelor (GATE-0072).
  const diffs = new Set<number>();
  for (let i = 0; i < days.length; i++) {
    const indexA = indexOf.get(picksA[i] as string) as number;
    const indexB = indexOf.get(picksB[i] as string) as number;
    diffs.add((indexA - indexB + list.length) % list.length);
  }
  assert.ok(diffs.size > 1, "decalajul dintre indici e constant — șirurile sunt corelate");
});

test("azi: listă goală întoarce null, fără să arunce", () => {
  assert.equal(pickForDay([], 12345, "azi-ghicitoare"), null);
});

test("azi: determinist — aceleași argumente întorc mereu același element", () => {
  const list = ids(90);
  const day = dayNumber(new Date(2026, 5, 15));
  const first = pickForDay(list, day, "azi-ghicitoare");
  const second = pickForDay(list, day, "azi-ghicitoare");
  assert.equal(first, second);
  assert.ok(first !== null);
});

// --- Cartea zilei: cele trei elemente și textul de dat mai departe (FEAT-017) ---

/** O zi fixă, ca ghicitoarea și eticheta să fie mereu aceleași în teste. */
const SAMPLE_DAY = new Date(2025, 8, 9);

test("azi: eticheta zilei e scrisă în română din literale, nu din ICU", () => {
  assert.equal(todayCard(SAMPLE_DAY).date, "marți, 9 septembrie");
  assert.equal(todayCard(new Date(2026, 0, 1)).date, "joi, 1 ianuarie");
  assert.equal(todayCard(new Date(2026, 11, 25)).date, "vineri, 25 decembrie");
  assert.equal(todayCard(new Date(2026, 1, 28)).date, "sâmbătă, 28 februarie");
});

test("azi: cartea are exact trei elemente, în ordinea fixată, fiecare cu al doilea rând", () => {
  const card = todayCard(SAMPLE_DAY);
  assert.equal(card.items.length, 3);
  assert.deepEqual(
    card.items.map((item) => item.kind),
    ["ghicitoare", "roata", "framantare"]
  );
  assert.deepEqual(
    card.items.map((item) => item.emoji),
    ["🔮", "🎡", "👅"]
  );
  assert.deepEqual(
    card.items.map((item) => item.second),
    [
      "Ghiciți amândoi. Cine zice primul?",
      "Întâi copilul. Apoi TU.",
      "De trei ori, repede. Cine se încurcă, plătește cu un hohot.",
    ]
  );
  for (const item of card.items) {
    assert.ok(item.prompt.length > 0, `elementul ${item.kind} n-are text`);
  }
});

test("azi: textul de copiat ascunde răspunsul ghicitorii și poartă adresa", () => {
  const card = todayCard(SAMPLE_DAY);
  const blocks = cardText(card).split("\n\n");

  assert.equal(blocks.length, 5, "capul, cele trei elemente și adresa");
  assert.equal(blocks[0], "Cartea de azi — marți, 9 septembrie");
  assert.equal(blocks[4], "vorbaretii.ro/azi");
  card.items.forEach((item, i) => {
    assert.equal(blocks[i + 1], `${item.emoji} ${item.prompt}\n${item.second}`);
  });

  const answer = card.items[0]?.answer ?? "";
  assert.ok(answer.length > 0, "ghicitoarea zilei n-are răspuns de ascuns");
  assert.ok(
    !(blocks[1] ?? "").includes(answer),
    `răspunsul „${answer}” a ajuns în textul copiat — dispare motivul de a deschide linkul`
  );
});
