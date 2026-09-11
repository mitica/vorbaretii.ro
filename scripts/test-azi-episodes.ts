/**
 * Legea episodului Vorbărici (ADR-047): scriptul ritualului — segmentele în
 * ordinea aprobată, cu liniștile ca valori numite — și contractul de voce al
 * personajului (regula de aur, oglindită mecanic).
 *
 * Cartea și scripturile rele se fabrică AICI: legile se văd roșii fără niciun
 * corpus real și fără niciun fișier pe disc. Rulează cu `yarn test`.
 */

import assert from "node:assert/strict";
import test from "node:test";
import type { RitualCard } from "../app/azi/card";
import {
  episodeScript,
  goldenRuleProblems,
  MIN_SILENCE_SECONDS,
  RITUAL_LINES,
  SILENCE,
  type Segment,
} from "../app/azi/episode";

const CARD: RitualCard = {
  date: "joi, 11 septembrie",
  items: [
    {
      kind: "ghicitoare",
      emoji: "🔮",
      prompt: "Cine bate la geam și nu intră?",
      second: "Ghiciți amândoi. Cine zice primul?",
      answer: "ploaia",
    },
    {
      kind: "roata",
      emoji: "🎡",
      prompt: "Ce ai face cu o zi în plus?",
      second: "Întâi copilul. Apoi TU.",
      stress: "TU",
    },
    {
      kind: "framantare",
      emoji: "👅",
      prompt: "Șase sași în șase saci.",
      second: "De trei ori, repede.",
    },
  ],
};

type Silence = Extract<Segment, { kind: "silence" }>;

const silences = (segments: readonly Segment[]): Silence[] =>
  segments.filter((segment): segment is Silence => segment.kind === "silence");

/**
 * Legea liniștilor pe UN script oarecare — al ritualului sau fabricat: un episod
 * fără liniște nu e ritual, ci un monolog; o liniște prea scurtă nu apucă să
 * încapă răspunsul copilului.
 */
function scriptProblems(segments: readonly Segment[]): string[] {
  const quiet = silences(segments);
  const problems =
    quiet.length === 0
      ? ["ADR-047 — script fără nicio liniște: liniștea e ritualul, nu textul dintre ele"]
      : [];
  for (const segment of quiet)
    if (segment.seconds < MIN_SILENCE_SECONDS)
      problems.push(
        `ADR-047 — liniște de ${segment.seconds}s, sub minimul de ${MIN_SILENCE_SECONDS}s`
      );
  return problems;
}

test("ADR-047: scriptul ritualului — 21 de segmente, în ordinea aprobată", () => {
  const script = episodeScript(CARD);
  const expected: Segment[] = [
    { kind: "sting", role: "intro" },
    { kind: "voice", text: RITUAL_LINES.greeting },
    { kind: "voice", text: RITUAL_LINES.riddleIntro },
    { kind: "voice", text: "Cine bate la geam și nu intră?", game: "ghicitori" },
    { kind: "silence", seconds: SILENCE.afterRiddle },
    { kind: "voice", text: RITUAL_LINES.askTogether },
    { kind: "silence", seconds: SILENCE.afterAskTogether },
    { kind: "voice", text: RITUAL_LINES.riddleAnswer },
    { kind: "voice", text: "ploaia", game: "ghicitori" },
    { kind: "voice", text: RITUAL_LINES.wheelIntro },
    { kind: "voice", text: "Ce ai face cu o zi în plus?", game: "roata-cuvintelor" },
    { kind: "voice", text: RITUAL_LINES.childFirst },
    { kind: "silence", seconds: SILENCE.forChild },
    { kind: "voice", text: RITUAL_LINES.adultNext },
    { kind: "silence", seconds: SILENCE.forAdult },
    { kind: "voice", text: RITUAL_LINES.twisterIntro },
    { kind: "voice", text: "Șase sași în șase saci.", game: "framantari-de-limba" },
    { kind: "silence", seconds: SILENCE.afterTwister },
    { kind: "voice", text: RITUAL_LINES.tangled },
    { kind: "voice", text: RITUAL_LINES.farewell },
    { kind: "sting", role: "outro" },
  ];
  assert.equal(script.length, 21, "episodul are 21 de segmente");
  assert.deepEqual(script, expected, "ordinea, liniștile și jocurile sunt cele aprobate");
  assert.deepEqual(
    silences(script).map((segment) => segment.seconds),
    [6, 4, 20, 20, 8],
    "liniștile ritualului, în ordine"
  );
});

test("ADR-047: un script fără nicio liniște e respins", () => {
  const mute: Segment[] = [
    { kind: "sting", role: "intro" },
    { kind: "voice", text: RITUAL_LINES.greeting },
    { kind: "sting", role: "outro" },
  ];
  const problems = scriptProblems(mute);
  assert.equal(problems.length, 1, "scriptul mut trebuie respins");
  assert.match(problems[0] ?? "", /ADR-047/);
  assert.deepEqual(scriptProblems(episodeScript(CARD)), [], "scriptul ritualului trece curat");
});

test("ADR-047: o liniște sub minim e respinsă", () => {
  const hurried: Segment[] = [
    { kind: "voice", text: RITUAL_LINES.childFirst },
    { kind: "silence", seconds: 3 },
  ];
  const problems = scriptProblems(hurried);
  assert.equal(problems.length, 1, "liniștea de 3 s trebuie respinsă");
  assert.match(problems[0] ?? "", /ADR-047/);
  assert.ok(MIN_SILENCE_SECONDS >= 4, "minimul de liniște e de cel puțin 4 s");
});

test("ADR-047: regula de aur — specia, acordul feminin, adresarea, țara, tagurile", () => {
  const forbidden = [
    "Mi-a înghețat o aripă la geam.",
    "Am văzut cu ochii mei, zic eu, gaița.",
    "Ciocul meu știe.",
    "Mi-am făcut cuib lângă voi.",
    "Sunt sigură că știi.",
    "Mie una îmi place.",
    "Dragi copii, ascultați aici.",
    "Sper că ți-a plăcut, așadar mergem mai departe.",
    "Alți nemți au alt cuvânt pentru asta.",
    "Întreabă-i pe colegii tăi.",
    "[bored] Și răspunsul e…",
  ];
  for (const line of forbidden) {
    const problems = goldenRuleProblems(line);
    assert.ok(problems.length > 0, `„${line}” trebuie respins`);
    assert.match(problems[0] ?? "", /ADR-047/, "mesajul citează ADR-047");
  }
  assert.match(
    goldenRuleProblems(forbidden[0] ?? "")[0] ?? "",
    /aripa/,
    "mesajul numește termenul"
  );
});

test("ADR-047: regula prinde cuvinte întregi, cu sau fără diacritice — nu bucăți de cuvânt", () => {
  assert.equal(goldenRuleProblems("O ciocolată caldă.").length, 0, "„cioc” în „ciocolată”");
  assert.equal(goldenRuleProblems("Mergem mai departe.").length, 0, "un rând curat");
  assert.ok(goldenRuleProblems("SUNT SIGURĂ.").length > 0, "diacriticele și majusculele nu scapă");
  assert.ok(goldenRuleProblems("Sunt sigura.").length > 0, "nici scrisul fără diacritice");
  assert.equal(goldenRuleProblems("[curious] Și răspunsul e…").length, 0, "tag canonic");
});

test("ADR-047: cele zece rânduri fixe trec regula de aur, fără nicio problemă", () => {
  const lines = Object.values(RITUAL_LINES);
  assert.equal(lines.length, 10, "ritualul are zece rânduri fixe");
  for (const line of lines) {
    assert.ok(line.trim().length > 0, "un rând fix gol");
    assert.deepEqual(goldenRuleProblems(line), [], `rândul „${line}” încalcă regula de aur`);
  }
});

test("ADR-047: o carte fără cele trei elemente nu produce un episod mut — se oprește", () => {
  const first = CARD.items[0];
  assert.ok(first);
  assert.throws(() => episodeScript({ date: CARD.date, items: [first] }), /ADR-047/);
  assert.throws(
    () =>
      episodeScript({
        date: CARD.date,
        items: [{ ...first, answer: undefined }, ...CARD.items.slice(1)],
      }),
    /ADR-047/,
    "o ghicitoare fără răspuns n-are ce rosti"
  );
});

test("ADR-047: planseul nu respinge cuvinte comune care se confunda dupa normalizare", () => {
  // Normalizat, „pană” devine „pana” — adica exact „până”, cel mai comun cuvant
  // din limba; iar „singură” devine „singura”, articolul. Termenii astia se cauta
  // CU diacritice, altfel legea ar opri orice rand viitor care spune „până mâine”.
  for (const innocent of [
    "Mai trec pe la geam până mâine.",
    "E singura dată când spun asta.",
    "Stai până termin.",
  ])
    assert.deepEqual(goldenRuleProblems(innocent), [], `respins pe nedrept: „${innocent}”`);

  for (const guilty of ["Am pierdut o pană.", "Am fost singură la geam."]) {
    const problems = goldenRuleProblems(guilty);
    assert.equal(problems.length, 1, `ar fi trebuit respins: „${guilty}”`);
    assert.match(problems[0] as string, /ADR-047/);
  }
});
