/**
 * Legea episodului Vorbărici (ADR-047): scriptul ritualului — segmentele în
 * ordinea aprobată, cu liniștile ca valori numite —, contractul de voce al
 * personajului (regula de aur, oglindită mecanic) și legea rostirilor de marcă
 * de pe disc (cele zece rânduri fixe, rostite o dată și comise).
 *
 * Cartea și scripturile rele se fabrică AICI: legile se văd roșii fără niciun
 * corpus real și fără niciun fișier pe disc. Rulează cu `yarn test`.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { RitualCard } from "../app/azi/card";
import {
  episodeScript,
  goldenRuleProblems,
  MIN_SILENCE_SECONDS,
  RITUAL_LINES,
  SILENCE,
  type Segment,
} from "../app/azi/episode";
import { hashId } from "../app/jocuri/content/ids";
import {
  BRAND_VOICE_DIR,
  FILE_BUDGET,
  VOICED_GAMES,
  baseVoiceKey,
  voiceKey,
} from "../app/jocuri/voice/settings";
import { readKeyedDir, type VoiceDir } from "./lib/voice-law";

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

/* ------------------------------- rostirile de marcă ale ritualului (ADR-047) */

// Cele zece rânduri fixe se rostesc O DATĂ și se comit ca asset: de-aia legea lor
// e a FIȘIERELOR de pe disc, nu a textelor. Nucleul e pur — primește o listare de
// director și întoarce problemele —, deci se vede roșu pe listări fabricate, fără
// niciun mp3 comis (N6).

/** Comanda care repară orice problemă de mai jos; un singur text, în fiecare mesaj. */
const BRAND_FIX = "rulează yarn generate-azi-voice";

/**
 * Legea rostirilor de marcă: orfanul și cheia veche sunt roșii, lipsa NU.
 * Un rând fix fără fișier îl oprește pe generatorul de episoade, care are nevoie
 * de el ca să compună ziua; dacă ar fi roșie și AICI, un corpus negenerat ar
 * bloca orice landing, inclusiv pe cele fără nicio legătură cu vocea.
 */
function brandProblems(dir: VoiceDir | null, key: string, expected: ReadonlySet<string>): string[] {
  if (!dir) return [];
  const problems = dir.keys
    .filter((found) => found !== key)
    .map((found) => `ADR-047 — cheie de voce veche pe disc „${found}”: ${BRAND_FIX}`);
  for (const file of dir.files) {
    if (!expected.has(file.name))
      problems.push(`ADR-047 — rostire de marcă orfană „${file.name}”: ${BRAND_FIX}`);
    if (file.bytes > FILE_BUDGET)
      problems.push(
        `ADR-047 — „${file.name}” peste bugetul de ${FILE_BUDGET / 1024}KB: ${BRAND_FIX}`
      );
  }
  return problems;
}

/** Numele fișierelor celor zece rânduri fixe — cheia lor de identitate e textul. */
const brandFiles = (): Set<string> =>
  new Set(Object.values(RITUAL_LINES).map((line) => `${hashId(line)}.mp3`));

/** Rădăcina rostirilor de marcă în directorul de lucru curent (repo real sau temporar). */
const brandRoot = (): string => join(process.cwd(), BRAND_VOICE_DIR);

const BRAND_KEY = "cheie-curenta";
const GREETING = `${hashId(RITUAL_LINES.greeting)}.mp3`;

function brandDir(files: { name: string; bytes?: number }[], keys = [BRAND_KEY]): VoiceDir {
  return { keys, files: files.map((f) => ({ name: f.name, bytes: f.bytes ?? 30_000 })) };
}

test("ADR-047: corpusul de marcă gol — sau lipsă cu totul — trece verde", () => {
  const expected = brandFiles();
  assert.deepEqual(brandProblems(null, BRAND_KEY, expected), [], "niciun director = verde");
  assert.deepEqual(brandProblems(brandDir([]), BRAND_KEY, expected), [], "director gol = verde");
  assert.deepEqual(
    brandProblems(brandDir([{ name: GREETING }]), BRAND_KEY, expected),
    [],
    "ADR-047 — nouă rânduri fixe lipsă nu au voie să blocheze un landing"
  );
});

test("ADR-047: un fișier orfan în directorul de marcă pică legea, cu comanda în mesaj", () => {
  const problems = brandProblems(
    brandDir([{ name: GREETING }, { name: "zzz.mp3" }]),
    BRAND_KEY,
    brandFiles()
  );
  assert.equal(problems.length, 1, "exact orfanul e problema");
  assert.match(problems[0] ?? "", /ADR-047/, "mesajul citează decizia");
  assert.match(problems[0] ?? "", /zzz\.mp3/, "mesajul numește fișierul");
  assert.match(problems[0] ?? "", /yarn generate-azi-voice/, "mesajul spune ce se rulează");
});

test("ADR-047: o cheie de voce veche pe disc pică legea — episodul ar suna din două guri", () => {
  const problems = brandProblems(
    brandDir([{ name: GREETING }], [BRAND_KEY, "cheie-veche"]),
    BRAND_KEY,
    brandFiles()
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0] ?? "", /ADR-047/);
  assert.match(problems[0] ?? "", /cheie-veche/, "mesajul numește cheia rămasă");
  assert.match(problems[0] ?? "", /yarn generate-azi-voice/);
});

test("ADR-047: o rostire de marcă peste buget pică legea", () => {
  const problems = brandProblems(
    brandDir([{ name: GREETING, bytes: FILE_BUDGET + 1 }]),
    BRAND_KEY,
    brandFiles()
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0] ?? "", /ADR-047/);
  assert.match(problems[0] ?? "", /buget/);
  assert.deepEqual(
    brandProblems(brandDir([{ name: GREETING, bytes: FILE_BUDGET }]), BRAND_KEY, brandFiles()),
    [],
    "exact la buget încă trece"
  );
});

test("ADR-047: legea citește discul pe calea contractului — director de marcă, cheia de bază", () => {
  // Calea e CONTRACT, nu detaliu: sub ea se comit punțile, iar episodul le caută
  // acolo. Un director mutat ar lăsa legea și generatorul de acord între ele și
  // în dezacord cu ce se servește — de-aia litera stă scrisă aici.
  assert.equal(BRAND_VOICE_DIR, "public/assets/audio/brand/vorbarici");
  const root = mkdtempSync(join(tmpdir(), "marca-"));
  const dir = join(root, BRAND_VOICE_DIR, baseVoiceKey());
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, GREETING), Buffer.alloc(10));
  writeFileSync(join(dir, "zzz.mp3"), Buffer.alloc(10));
  const before = process.cwd();
  process.chdir(root);
  try {
    const problems = brandProblems(
      readKeyedDir(brandRoot(), baseVoiceKey()),
      baseVoiceKey(),
      brandFiles()
    );
    assert.equal(problems.length, 1, "orfanul de pe discul real se vede");
    assert.match(problems[0] ?? "", /zzz\.mp3/);
  } finally {
    process.chdir(before);
    rmSync(root, { recursive: true, force: true });
  }
});

test("ADR-047: discul real — nicio rostire de marcă orfană, nicio cheie veche, niciun fișier gras", () => {
  assert.deepEqual(
    brandProblems(readKeyedDir(brandRoot(), baseVoiceKey()), baseVoiceKey(), brandFiles()),
    []
  );
});

test("ADR-047: generatorul scrie unde citește legea — același director, aceeași cheie", () => {
  const source = readFileSync(join(process.cwd(), "scripts/generate-azi-voice.ts"), "utf8");
  assert.ok(
    source.includes("BRAND_VOICE_DIR"),
    "ADR-047 — generatorul nu compune calea din BRAND_VOICE_DIR"
  );
  assert.ok(
    source.includes("baseVoiceKey()"),
    "ADR-047 — generatorul nu scrie în cheia de bază a vocii"
  );
});

/**
 * Valoarea de AZI a cheii, fixată: sub ea stau cele 366 de rostiri ale jocurilor
 * și cele zece de marcă. O re-acordare deliberată a vocii înseamnă regenerarea
 * corpusului ȘI schimbarea literalului de aici — niciodată invers, fiindcă o
 * cheie mișcată din greșeală mătură de pe disc tot ce s-a rostit până acum.
 */
const VOICE_KEY_TODAY = "eleven_v3_src192_out128k_s0.5_b0.75_sp1_p12emye9";

test("ADR-047: cheia de bază e prefixul cheii fiecărui joc, iar valoarea de azi n-a mișcat", () => {
  assert.equal(baseVoiceKey(), VOICE_KEY_TODAY, "ADR-047 — cheia de bază s-a schimbat");
  for (const slug of Object.keys(VOICED_GAMES)) {
    assert.ok(
      voiceKey(slug).startsWith(baseVoiceKey()),
      `ADR-047 — ${slug}: cheia jocului nu începe cu cheia de bază`
    );
    assert.equal(
      voiceKey(slug),
      VOICE_KEY_TODAY,
      `ADR-047 — ${slug}: cheia s-a schimbat, iar rostirile comise ar fi măturate`
    );
  }
});
