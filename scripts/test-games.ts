/**
 * Testele logicii pure a jocurilor: rotația „nu repeta nimic", amestecările,
 * acordul numeralelor și invariantele conținutului. Rulează local:
 *
 *   yarn test
 *
 * Fără bibliotecă de teste: `node:test` vine cu Node și își rulează testele
 * direct în procesul curent când fișierul e executat cu ts-node.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { numeralDe, tries } from "../app/jocuri/components/format";
import {
  EMPTY_ROTATION,
  coerceRotation,
  pickUnseen,
  type RotationState
} from "../app/jocuri/components/rotation";
import {
  scrambleIndexes,
  shuffle,
  shuffleApart
} from "../app/jocuri/components/shuffle";
import {
  anagrams,
  memoryPairs,
  proverbs,
  riddles,
  wheelDecks,
  wheelItems
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
    round: 2
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
    ...wheelItems.map((items, index) => ({
      name: `roata.${wheelDecks[index].id}`,
      ids: items.map((item) => item.id)
    }))
  ];
  for (const list of lists) {
    assert.equal(new Set(list.ids).size, list.ids.length, list.name);
  }
});

test("conținut: regulile de gabarit din docs/games.md", () => {
  for (const item of anagrams) {
    assert.ok(item.word.length <= 9, item.word);
    assert.equal(item.word, item.word.toLocaleUpperCase("ro"), item.word);
  }
  for (const pair of memoryPairs) assert.ok(pair.word.length <= 8, pair.word);
  for (const riddle of riddles)
    assert.ok(!riddle.answer.trim().includes(" "), riddle.answer);
  for (const deck of wheelDecks)
    assert.equal(deck.prompts.length, 12, deck.label);
});

test("registrul: fiecare joc are slug, seo și eticheta elementelor", () => {
  for (const game of games) {
    assert.match(game.slug, /^[a-z-]+$/);
    assert.ok(game.seo.title.length > 10, game.slug);
    assert.ok(game.seo.description.length > 20, game.slug);
    assert.ok(game.itemsLabel.length > 0, game.slug);
  }
});
