/**
 * Testele contractului de articol: un articol valid trece, fiecare
 * constrângere respinge (văzută ROȘIE întâi, contra unui validator gol).
 * Rulează cu `yarn test`, alături de test-games.ts.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { validateArticle, LIMITS, type Article } from "../app/articole/content/schema";
import { articles, compareArticles, questionDecks } from "../app/articole/articles";
import { taxonomy, type Taxonomy } from "../app/articole/taxonomy";

const T: Taxonomy = {
  categories: { istorie: "Istorie" },
  tags: { domnitori: "Domnitori", "evul-mediu": "Evul Mediu" },
  seriesTitles: { domnitorii: "Domnitorii" },
};

/** n cuvinte de umplutură — bugetele se numără, nu se mimează. */
const words = (n: number) => Array.from({ length: n }, (_, i) => `vorbă${i}`).join(" ");

function section(id: string, anchorA: string, anchorB: string) {
  return {
    id,
    title: `Secțiunea ${id}.`,
    beats: [
      { text: words(60), images: [anchorA] },
      { text: words(58), images: [anchorB] },
    ],
    more: words(40),
    questions: [{ question: `Ce spune secțiunea ${id} despre Vlad?`, answer: "un fapt scurt" }],
  };
}

function fixture(): Article {
  return {
    title: "Articol de probă",
    category: "istorie",
    tags: ["domnitori", "evul-mediu"],
    summary: "Un rezumat de probă.",
    age: 8,
    published: "2026-09-02",
    series: "domnitorii",
    sections: [section("unu", "a1", "a2"), section("doi", "b1", "b2"), section("trei", "c1", "c2")],
    illustrations: [
      { anchor: "erou", alt: "eroul" },
      { anchor: "a1", alt: "a1" },
      { anchor: "a2", alt: "a2" },
      { anchor: "b1", alt: "b1" },
      { anchor: "b2", alt: "b2" },
      { anchor: "c1", alt: "c1" },
      { anchor: "c2", alt: "c2" },
    ],
    sources: [
      { url: "https://ro.wikipedia.org/wiki/Vlad_Țepeș", lang: "ro" },
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
  (a) => (a.sections[0]!.questions[0]!.question = "Cine a fost Vlad? De ce?"),
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
  `beat peste ${LIMITS.beatWordsMax} de cuvinte`,
  (a) => (a.sections[0]!.beats[0]!.text = words(80)),
  `${LIMITS.beatWordsMax} cuvinte`
);
rejects(
  "secțiune sub bugetul de cuvinte",
  (a) => {
    a.sections[2]!.beats[0]!.text = words(10);
    a.sections[2]!.beats[1]!.text = words(10);
  },
  'secțiunea "trei" are'
);
rejects(
  "corpul sub bugetul total",
  (a) => {
    for (const s of a.sections) {
      s.beats[0]!.text = words(35);
      s.beats[1]!.text = words(30);
    }
  },
  "corpul are"
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
rejects("id de secțiune duplicat", (a) => (a.sections[1]!.id = "unu"), "duplicat");
rejects(
  `sub ${LIMITS.sectionsMin} secțiuni`,
  (a) => (a.sections = []),
  `sub ${LIMITS.sectionsMin} secțiuni`
);
rejects("published invalid", (a) => (a.published = "azi"), "YYYY-MM-DD");
rejects(
  "„mai mult” peste buget",
  (a) => (a.sections[0]!.more = words(120)),
  `${LIMITS.moreWordsMax} cuvinte`
);

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
