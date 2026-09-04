/**
 * Testele contractului de articol: un articol valid trece, fiecare
 * constrângere respinge (văzută ROȘIE întâi, contra unui validator gol).
 * Legea per bandă (ADR-025 în harnessul privat; mecanica ADR-016): bugetele,
 * perioada, slugul — fără reguli la nivel de propoziție — rama fixă a casei (ADR-027:
 * patru secțiuni numite, pecetea și replica naratorului, în afara bugetelor) plus legea
 * importatorilor registrului (ADR-019: generarea nu citește corpusul).
 * Rulează cu `yarn test`, alături de test-games.ts.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { validateArticle, rejectSlug, LIMITS, type Article } from "../app/articole/content/schema";
import { BANDS, bandOf, budgetFor, countedWords, wordCount } from "../app/articole/content/budgets";
import { CLOSING_LINE, FRAME, OPENING_SEAL } from "../app/articole/content/frame";
import { articles, compareArticles, questionDecks } from "../app/articole/articles";
import { inSeason } from "../app/articole/season";
import { taxonomy, type Taxonomy } from "../app/articole/taxonomy";

const T: Taxonomy = {
  categories: { traditii: "Tradiții" },
  tags: { martisor: "Mărțișor", primavara: "Primăvară" },
  seriesTitles: { "de-sarbatori": "De sărbători" },
};

/** n propoziții a câte w cuvinte, terminate cu punct — bugetele și propozițiile se numără, nu se mimează. */
function prose(sentences: number, wordsPerSentence = 8): string {
  return Array.from({ length: sentences }, (_, i) =>
    Array.from({ length: wordsPerSentence }, (_, j) => (j === 0 ? `Vorba${i}` : `cuvânt${j}`)).join(
      " "
    )
  )
    .map((s) => `${s}.`)
    .join(" ");
}

type Slot = { id: string; title: string };

/** O secțiune a benzii 7–8: 2 beat-uri × 4 propoziții × 8 cuvinte = 64 de cuvinte. */
function section(slot: Slot, anchorA: string, anchorB: string) {
  return {
    id: slot.id,
    title: slot.title,
    beats: [
      { text: prose(4), images: [anchorA] },
      { text: prose(4), images: [anchorB] },
    ],
    more: prose(2),
    questions: [
      { question: `Ce spune secțiunea ${slot.id} despre mărțișor?`, answer: "un fapt scurt" },
    ],
  };
}

const ANCHORS = [
  ["a1", "a2"],
  ["b1", "b2"],
  ["c1", "c2"],
  ["d1", "d2"],
] as const;

/** Rama întreagă (ADR-027): cele patru secțiuni + pecetea în primul beat, replica în ultimul. */
function framedSections() {
  const sections = FRAME.map((slot, i) => section(slot, ANCHORS[i]![0], ANCHORS[i]![1]));
  sections[0]!.beats[0]!.text = `${sections[0]!.beats[0]!.text} ${OPENING_SEAL}`;
  sections[3]!.beats[1]!.text = `${sections[3]!.beats[1]!.text} ${CLOSING_LINE}`;
  return sections;
}

/** Povestea-fixtură a suitei (model.md): Mărțișorul la 7 ani — corp 256 de cuvinte (fără formule). */
function fixture(): Article {
  return {
    title: "Mărțișorul cu bănuț de argint",
    category: "traditii",
    tags: ["martisor", "primavara"],
    summary: "De ce vine mărțișorul pe 1 martie și unde ajunge firul după ce îl dai jos.",
    age: 7,
    months: [2, 3],
    published: "2026-09-05",
    series: "de-sarbatori",
    sections: framedSections(),
    illustrations: [
      { anchor: "erou", alt: "eroul" },
      { anchor: "a1", alt: "a1" },
      { anchor: "a2", alt: "a2" },
      { anchor: "b1", alt: "b1" },
      { anchor: "b2", alt: "b2" },
      { anchor: "c1", alt: "c1" },
      { anchor: "c2", alt: "c2" },
      { anchor: "d1", alt: "d1" },
      { anchor: "d2", alt: "d2" },
    ],
    sources: [
      { url: "https://ro.wikipedia.org/wiki/Mărțișor", lang: "ro" },
      { url: "https://example.com/altceva", lang: "ro" },
    ],
  };
}

function rejects(name: string, mutate: (a: Article) => void, needle: string) {
  test(name, () => {
    const a = fixture();
    mutate(a);
    const errors = validateArticle(a, T);
    assert.ok(
      errors.some((e) => e.includes(needle)),
      `așteptam o eroare cu „${needle}”, am primit: ${JSON.stringify(errors)}`
    );
  });
}

const B78 = budgetFor("7-8");

test("articolul valid trece fără erori", () => {
  assert.deepEqual(validateArticle(fixture(), T), []);
});

test("taxonomy.ts există și e forma așteptată", () => {
  assert.ok(taxonomy.categories && taxonomy.tags && taxonomy.seriesTitles);
});

rejects(
  "fără sursă Wikipedia — respins (ADR-003)",
  (a) => (a.sources = [{ url: "https://example.com", lang: "ro" }]),
  "Wikipedia"
);
rejects("tag fără intrare în taxonomy", (a) => a.tags.push("inexistent"), 'tag "inexistent"');
rejects("tags gol — minim unul", (a) => (a.tags = []), "minim un tag");
rejects("category necunoscută", (a) => (a.category = "nimic"), 'category "nimic"');
rejects("series necunoscută", (a) => (a.series = "nimic"), 'series "nimic"');
rejects(
  "întrebare cu coadă după semnul întrebării",
  (a) => (a.sections[0]!.questions[0]!.question = "Cine poartă mărțișor? De ce?"),
  "fără coadă"
);
rejects(
  `întrebare peste ${LIMITS.questionCharsMax} de caractere`,
  (a) => (a.sections[0]!.questions[0]!.question = `${"foarte ".repeat(15)}lungă întrebare?`),
  `${LIMITS.questionCharsMax} caractere`
);
rejects(
  `răspuns peste ${LIMITS.answerCharsMax} de caractere`,
  (a) => (a.sections[0]!.questions[0]!.answer = "x".repeat(60)),
  `${LIMITS.answerCharsMax}`
);
rejects("secțiune fără nicio întrebare", (a) => (a.sections[1]!.questions = []), "nicio întrebare");
rejects(
  `sub ${LIMITS.questionsPerArticleMin} întrebări pe articol (ADR-025)`,
  (a) => (a.sections[1]!.questions = []),
  `sub ${LIMITS.questionsPerArticleMin} întrebări`
);
rejects(
  `beat peste ${B78.beatWordsMax} de cuvinte la 7–8 (ADR-025)`,
  (a) => (a.sections[0]!.beats[0]!.text = prose(6)),
  `${B78.beatWordsMax} cuvinte`
);
rejects(
  "secțiune sub bugetul benzii (ADR-025)",
  (a) => {
    a.sections[2]!.beats[0]!.text = prose(1);
    a.sections[2]!.beats[1]!.text = prose(1);
  },
  'secțiunea "pana-stramba" are'
);
rejects(
  "corpul sub bugetul benzii 7–8: 3 secțiuni × 48 de cuvinte (ADR-025)",
  (a) => {
    a.sections = [a.sections[0]!, a.sections[1]!, a.sections[3]!];
    for (const s of a.sections) for (const b of s.beats) b.text = prose(3);
  },
  "corpul are 144"
);
rejects(
  "corpul peste bugetul benzii 12–14: 4 secțiuni × 192 de cuvinte (ADR-025)",
  (a) => {
    a.age = 12;
    for (const s of a.sections) for (const b of s.beats) b.text = prose(8, 12);
  },
  "corpul are 768"
);
rejects(
  "aceeași fixtură la 9 ani cade sub corpul benzii 9–11 (ADR-016/ADR-025)",
  (a) => (a.age = 9),
  "corpul are 256"
);
rejects(
  "aceeași fixtură la 12 ani cade sub secțiunea benzii 12–14 (ADR-016/ADR-025)",
  (a) => (a.age = 12),
  'secțiunea "stai-sa-ti-zic" are 64'
);
rejects(
  `age sub ${LIMITS.ageMin} (ADR-025)`,
  (a) => (a.age = 6),
  `${LIMITS.ageMin}..${LIMITS.ageMax}`
);
rejects("months cu lună peste 12", (a) => (a.months = [13]), "months");
rejects("months gol", (a) => (a.months = []), "months");
rejects("months cu dubluri", (a) => (a.months = [2, 2]), "duplicate");
rejects("days cu lună inexistentă", (a) => (a.days = ["13-01"]), "days");
rejects("days cu zi inexistentă în lună", (a) => (a.days = ["02-30"]), "days");
rejects("days cu dubluri", (a) => (a.days = ["03-01", "03-01"]), "duplicate");
// --- Rama fixă (ADR-027): patru secțiuni numite, în ordine; pecetea și replica ---

rejects(
  "ultima secțiune nu e „Și azi?” (ADR-027)",
  (a) => (a.sections[3]!.id = "azi"),
  "secțiunea 4 trebuie să fie „Și azi?”"
);
rejects(
  "secțiunile în altă ordine (ADR-027)",
  (a) => a.sections.reverse(),
  "secțiunea 1 trebuie să fie „Stai să-ți zic!”"
);
rejects(
  "titlul unei secțiuni nu e cel al ramei (ADR-027)",
  (a) => (a.sections[2]!.title = "Pana dreaptă"),
  "secțiunea 3 trebuie să fie „Pana strâmbă”"
);
rejects(
  "primul beat fără pecetea naratorului (ADR-027)",
  (a) => (a.sections[0]!.beats[0]!.text = prose(4)),
  `primul beat trebuie să se închidă cu „${OPENING_SEAL}”`
);
rejects(
  "ultimul beat fără replica de închidere (ADR-027)",
  (a) => (a.sections[3]!.beats[1]!.text = prose(4)),
  `ultimul beat trebuie să se închidă cu „${CLOSING_LINE}”`
);
rejects(
  "«voce» a primului beat fără pecete — audio-ul n-ar rosti-o (ADR-027)",
  (a) => (a.sections[0]!.beats[0]!.voce = `[curious] ${prose(4)}`),
  "primul beat trebuie să se închidă cu"
);
test("rama e lege la orice dată de publicare — nicio excepție pe dată (ADR-027)", () => {
  const a = fixture();
  a.published = "2026-09-04";
  a.sections.reverse();
  assert.ok(validateArticle(a, T).some((e) => e.includes("ADR-027")));
});
test("formulele ramei nu intră în bugete: 45 de cuvinte + pecetea trec la 7–8 (ADR-027)", () => {
  const a = fixture();
  a.sections[0]!.beats[0]!.text = `${prose(5, 9)} ${OPENING_SEAL}`;
  assert.deepEqual(validateArticle(a, T), []);
});
rejects(
  `„mai mult” peste ${B78.moreWordsMax} de cuvinte la 7–8 (ADR-025)`,
  (a) => (a.sections[0]!.more = prose(1, 41)),
  `depășește ${B78.moreWordsMax} cuvinte`
);
rejects(
  "5 secțiuni, la orice bandă (ADR-027)",
  (a) => a.sections.splice(3, 0, section({ id: "apa", title: "Apa" }, "a1", "a2")),
  `rama are ${FRAME.length} secțiuni, articolul are 5`
);
rejects(
  "3 secțiuni, la orice bandă (ADR-027)",
  (a) => {
    a.age = 9;
    a.sections = [a.sections[0]!, a.sections[1]!, a.sections[3]!];
  },
  `rama are ${FRAME.length} secțiuni, articolul are 3`
);
rejects(
  `sub ${LIMITS.imagesPerSectionMin} imagini pe secțiune`,
  (a) => (a.sections[0]!.beats[1]!.images = []),
  "sub 2 imagini"
);
rejects(
  "beat cu ancoră inexistentă",
  (a) => a.sections[0]!.beats[0]!.images.push("naluca"),
  'ancora "naluca"'
);
rejects(
  "ilustrație nefolosită de niciun beat",
  (a) => a.illustrations.push({ anchor: "orfana", alt: "orfana" }),
  'ilustrația "orfana"'
);
rejects(
  "fără ilustrația-erou",
  (a) => (a.illustrations = a.illustrations.filter((i) => i.anchor !== "erou")),
  "erou"
);
rejects("id de secțiune duplicat", (a) => (a.sections[1]!.id = FRAME[0].id), "duplicat");
rejects("published invalid", (a) => (a.published = "azi"), "YYYY-MM-DD");

test("nicio regulă la nivel de propoziție: un beat cu o propoziție de 30 de cuvinte trece (decizia operatorului, 2026-09-04)", () => {
  const a = fixture();
  a.sections[1]!.beats[0]!.text = prose(1, 30);
  assert.deepEqual(validateArticle(a, T), []);
});

test("perioada validă trece: days pe o zi anume, fără months", () => {
  const a = fixture();
  delete a.months;
  a.days = ["12-01"];
  assert.deepEqual(validateArticle(a, T), []);
});

test("schema aditivă: beat cu «voce» validează; «voce» goală se respinge (ADR-013)", () => {
  const withVoice = fixture();
  withVoice.sections[1]!.beats[0]!.voce = "[excited] Stai să-ți zic!";
  assert.deepEqual(validateArticle(withVoice, T), []);
  const emptyVoice = fixture();
  emptyVoice.sections[1]!.beats[0]!.voce = "  ";
  assert.ok(validateArticle(emptyVoice, T).some((e) => e.includes("voce")));
});

test("ADR-025: slugul poartă unghiul — o cheie de taxonomie e respinsă, un unghi trece", () => {
  assert.ok(rejectSlug("martisor", T).some((e) => e.includes("etichetă")));
  assert.ok(rejectSlug("traditii", T).some((e) => e.includes("categorie")));
  assert.ok(rejectSlug("de-sarbatori", T).some((e) => e.includes("serie")));
  assert.deepEqual(rejectSlug("firul-alb-rosu", T), []);
  for (const entry of articles)
    assert.deepEqual(rejectSlug(entry.slug, taxonomy), [], `slugul "${entry.slug}" e o cheie`);
});

test("ADR-025: benzile derivă din age și fiecare are buget coerent", () => {
  assert.deepEqual([7, 8, 9, 11, 12, 14].map(bandOf), [
    "7-8",
    "7-8",
    "9-11",
    "9-11",
    "12-14",
    "12-14",
  ]);
  assert.deepEqual([6, 15, 7.5].map(bandOf), [null, null, null]);
  assert.equal(BANDS.length, 3);
  for (const band of BANDS) {
    const b = budgetFor(band);
    assert.ok(b.bodyWordsMin < b.bodyWordsMax && b.sectionWordsMin < b.sectionWordsMax);
  }
});

// --- „De sezon" (FEAT-009, decizia 9): perioada din JSON contra datei telefonului ---

test("inSeason: luna sau ziua de azi în perioada articolului; fără perioadă = niciodată", () => {
  const feb = new Date(2026, 1, 15);
  const jun = new Date(2026, 5, 1);
  const mar1 = new Date(2026, 2, 1);
  const mar2 = new Date(2026, 2, 2);
  assert.equal(inSeason({ months: [2, 3] }, feb), true);
  assert.equal(inSeason({ months: [2, 3] }, jun), false);
  assert.equal(inSeason({ days: ["03-01"] }, mar1), true);
  assert.equal(inSeason({ days: ["03-01"] }, mar2), false);
  assert.equal(inSeason({}, mar1), false);
  assert.equal(inSeason({ months: [6], days: ["03-01"] }, mar1), true);
});

test("SeasonPill e montată prin cardul ei pe index și în chips-urile articolului (reuse, nu redesen)", () => {
  for (const file of ["app/articole/page.tsx", "app/articole/components/article-shell.tsx"]) {
    const source = readFileSync(join(process.cwd(), file), "utf8");
    assert.ok(
      source.includes("SeasonPill") && source.includes("season-pill"),
      `${file} nu montează SeasonPill din app/articole/components/season-pill.tsx`
    );
  }
});

// --- Legea importatorilor registrului (ADR-019): generarea nu citește corpusul ---

const REGISTRY_IMPORT = /from\s+["'][^"']*articole\/articles["']/;
const LEGITIMATE_SCRIPTS = new Set(["scripts/generate-og.ts", "scripts/check-ui.ts"]);

/** Scripturile care importă registrul fără să fie servire la build (OG, check-ui) sau teste. */
function registryImporters(files: { path: string; source: string }[]): string[] {
  return files
    .filter((f) => REGISTRY_IMPORT.test(f.source))
    .filter((f) => !LEGITIMATE_SCRIPTS.has(f.path) && !/^scripts\/test-[^/]+\.tsx?$/.test(f.path))
    .map((f) => f.path);
}

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (/\.tsx?$/.test(entry)) yield full;
  }
}

test("ADR-019: fixtură — un generator care importă registrul e respins, OG-ul și testele nu", () => {
  const source = 'import { articles } from "../app/articole/articles";';
  const files = [
    { path: "scripts/generate-x.ts", source },
    { path: "scripts/generate-og.ts", source },
    { path: "scripts/test-x.ts", source },
    {
      path: "scripts/lib/pure.ts",
      source: 'import { hashId } from "../../app/jocuri/content/ids";',
    },
  ];
  assert.deepEqual(
    registryImporters(files),
    ["scripts/generate-x.ts"],
    "ADR-019 — un generator care citește registrul articolelor își face ieșirea intrare"
  );
});

test("ADR-019: niciun script de generare nu importă registrul articolelor (discul real)", () => {
  const root = process.cwd();
  const files = [...walk(join(root, "scripts"))].map((p) => ({
    path: relative(root, p),
    source: readFileSync(p, "utf8"),
  }));
  assert.deepEqual(
    registryImporters(files),
    [],
    "ADR-019 — mecanismele nu depind de conținutul generat: scriptul de mai sus citește corpusul; primește intrări explicite (slug, JSON dat, cerere)"
  );
});

test("fiecare articol publicat are cardul OG pe disc (oglinda purtătorilor de imagine)", () => {
  for (const entry of articles) {
    const og = join(process.cwd(), "public/assets/og", `${entry.slug}.png`);
    assert.ok(
      existsSync(og),
      `articolul "${entry.slug}": lipsește public/assets/og/${entry.slug}.png`
    );
  }
});

test("ordinea articolelor e deterministă: published desc, apoi slug asc", () => {
  assert.ok(
    compareArticles(
      { published: "2026-01-02", slug: "b" },
      { published: "2026-01-01", slug: "a" }
    ) < 0
  );
  assert.ok(
    compareArticles(
      { published: "2026-01-01", slug: "a" },
      { published: "2026-01-01", slug: "b" }
    ) < 0
  );
  const real = articles.map((a) => ({ published: a.data.published, slug: a.slug }));
  const resorted = [...real].sort(compareArticles).map((a) => a.slug);
  assert.deepEqual(
    articles.map((a) => a.slug),
    resorted,
    "registrul nu e în ordinea comparatorului"
  );
});

test("cu articole reale, deck-urile jocului există și id-urile sunt unice global", () => {
  const decks = questionDecks();
  if (articles.length === 0) {
    // Corpusul gol e stare legală (site-ul se poate goli prin ștergere);
    // golul se aserționează exact — un deck fără articole ar fi derivat de nicăieri.
    assert.equal(decks.length, 0, "corpus gol, dar există deck-uri derivate de nicăieri");
    return;
  }
  const total = decks.reduce((sum, d) => sum + d.items.length, 0);
  assert.ok(decks.length >= 1, "niciun deck derivat, deși există articole publicate");
  assert.ok(total >= 4, `așteptam ≥4 întrebări derivate, am găsit ${total}`);
  const ids = decks.flatMap((d) => d.items.map((i) => i.id));
  assert.equal(new Set(ids).size, ids.length, "id-uri de întrebări duplicate între articole");
});

test("deck-urile derivate pentru joc respectă invariantele întrebărilor", () => {
  // Cu zero articole lista e goală; cu articole reale, fiecare întrebare
  // derivată respectă aceleași reguli ca întrebările de roată.
  for (const deck of questionDecks()) {
    assert.ok(deck.label.trim() !== "");
    for (const item of deck.items) {
      assert.ok(item.question.length <= LIMITS.questionCharsMax);
      assert.ok(item.question.endsWith("?"));
      assert.ok(item.answer.trim() !== "");
      assert.ok(item.id.trim() !== "");
    }
  }
});

test("ADR-027: «voce» al ultimului beat fără replică e respinsă — audio-ul n-ar rosti-o", () => {
  const a = fixture();
  a.sections[3]!.beats[1]!.voce = `[curious] ${prose(4)}`;
  assert.ok(validateArticle(a, T).some((e) => e.includes("ultimul beat")));
});

test("ADR-025: registrul cheamă rejectSlug la build — identitatea slugului nu e doar a validatorului", () => {
  const source = readFileSync(join(__dirname, "..", "app", "articole", "articles.ts"), "utf8");
  const body = source.slice(source.indexOf("function loadArticle("));
  assert.ok(
    body.includes("rejectSlug(slug, taxonomy)"),
    "loadArticle trebuie să cheme rejectSlug(slug, taxonomy) (ADR-025)"
  );
});

test("ADR-027: legea numără cuvintele fără formulele ramei — raportul la fel", () => {
  const first = fixture().sections[0]!.beats[0]!.text;
  assert.equal(wordCount(first), 37, "prose(4) + pecetea = 37 cuvinte brute");
  assert.equal(countedWords(first), 32, "legea numără 32: pecetea nu intră în bugete");
});
