/**
 * Episodul Vorbărici ca SCRIPT (ADR-047): ce se rostește, în ce ordine, cu câtă
 * liniște între. O descriere pură a episodului — fără `node:`, fără disc — ca s-o
 * poată citi și pagina, și scriptul care fabrică audio-ul, fără să tragă după ea
 * ffmpeg.
 *
 * Liniștile sunt valori NUMITE, nu numere risipite prin generator: ele sunt
 * ritualul (copilul răspunde cu voce tare în ele), deci se văd, se măsoară și se
 * schimbă într-un singur loc.
 *
 * Aici stă și contractul de voce al personajului. E scris în SITE, nu în repo-ul
 * de proces, fiindcă legea trebuie să ruleze în lanțul site-ului, iar site-ul
 * n-are voie să citească fișiere de-acolo.
 */

import { EMOTION_TAGS } from "../articole/content/spoken";
import type { RitualCard, RitualItem } from "./card";

/** Un segment al episodului: sting de marcă, o rostire, sau liniște curată. */
export type Segment =
  | { kind: "sting"; role: "intro" | "outro" }
  | { kind: "voice"; text: string; game?: string }
  | { kind: "silence"; seconds: number };

/**
 * Liniștile ritualului, în secunde. Cele două de douăzeci sunt vorbirea
 * ascultătorilor: întâi copilul, apoi omul mare de lângă el — acolo se întâmplă
 * episodul, restul e doar ce le ține de urât.
 */
export const SILENCE = {
  afterRiddle: 6,
  afterAskTogether: 4,
  forChild: 20,
  forAdult: 20,
  afterTwister: 8,
} as const;

/** Sub patru secunde nu e liniște de răspuns, e o pauză de respirație: nimeni n-apucă să zică nimic. */
export const MIN_SILENCE_SECONDS = 4;

/**
 * Cele zece rânduri fixe ale ritualului — operă aprobată la poartă: se transcriu,
 * nu se rescriu. Sunt aceleași în fiecare zi, fiindcă repetiția e exact ce
 * recunoaște un copil de șapte ani.
 */
export const RITUAL_LINES = {
  greeting: "Bună! Ai cinci minute? Bun, ajung.",
  riddleIntro: "Începem cu o ghicitoare. Ascultă bine.",
  askTogether:
    "Dacă e cineva lângă tine, întreabă-l și pe el ce crede. N-am nicio grabă — am șapte sute de ani.",
  riddleAnswer: "[curious] Și răspunsul e…",
  wheelIntro: "Acum vorbești tu. Întrebarea de azi:",
  childFirst: "Întâi copilul.",
  adultNext: "Apoi tu — omul mare de lângă el.",
  twisterIntro: "Și la sfârșit, proba de limbă. Zi-o cu mine, de trei ori, repede:",
  tangled: "Te-ai încurcat, știu. Și eu.",
  farewell:
    "Mai trec pe la geam. Adu pe cineva cu tine — se joacă mai bine în doi. …da' asta ți-o povestesc altă dată.",
} as const;

/**
 * Din ce joc vine rostirea zilei — o singură casă pentru harta asta. Cheile sunt
 * citate ca să rămână VALORI: numele jocurilor sunt slug-uri de rută, nu
 * identificatori.
 */
const GAME_OF: Record<RitualItem["kind"], string> = {
  "ghicitoare": "ghicitori",
  "roata": "roata-cuvintelor",
  "framantare": "framantari-de-limba",
};

/** Rostire de marcă: rândul fix al personajului, care nu vine din niciun joc — de-aia n-are „game”. */
const say = (text: string): Segment => ({ kind: "voice", text });

/** Rostirea ZILEI: poartă jocul din care vine, ca vocea să se poată alege per joc. */
const fromGame = (source: RitualItem["kind"], text: string): Segment => ({
  kind: "voice",
  text,
  game: GAME_OF[source],
});

const quiet = (seconds: number): Segment => ({ kind: "silence", seconds });

/** Elementul cerut sau oprire: un episod căruia îi lipsește un element ar fi o zi ciuntită, nu un episod. */
function itemOf(card: RitualCard, kind: RitualItem["kind"]): RitualItem {
  const item = card.items.find((candidate) => candidate.kind === kind);
  if (!item)
    throw new Error(
      `ADR-047 — cartea zilei „${card.date}” n-are element „${kind}”: fără el, episodul nu se compune`
    );
  return item;
}

/** Răspunsul ghicitorii sau oprire: după „Și răspunsul e…” TREBUIE să urmeze ceva. */
function answerOf(item: RitualItem): string {
  if (!item.answer)
    throw new Error(
      `ADR-047 — ghicitoarea „${item.prompt}” n-are răspuns: „${RITUAL_LINES.riddleAnswer}” n-ar avea ce rosti`
    );
  return item.answer;
}

/** Episodul zilei, segment cu segment: sting, rostiri, liniști, sting. Pur — cartea intră, scriptul iese. */
export function episodeScript(card: RitualCard): Segment[] {
  const riddle = itemOf(card, "ghicitoare");
  const wheel = itemOf(card, "roata");
  const twister = itemOf(card, "framantare");
  return [
    { kind: "sting", role: "intro" },
    say(RITUAL_LINES.greeting),
    say(RITUAL_LINES.riddleIntro),
    fromGame("ghicitoare", riddle.prompt),
    quiet(SILENCE.afterRiddle),
    say(RITUAL_LINES.askTogether),
    quiet(SILENCE.afterAskTogether),
    say(RITUAL_LINES.riddleAnswer),
    fromGame("ghicitoare", answerOf(riddle)),
    say(RITUAL_LINES.wheelIntro),
    fromGame("roata", wheel.prompt),
    say(RITUAL_LINES.childFirst),
    quiet(SILENCE.forChild),
    say(RITUAL_LINES.adultNext),
    quiet(SILENCE.forAdult),
    say(RITUAL_LINES.twisterIntro),
    fromGame("framantare", twister.prompt),
    quiet(SILENCE.afterTwister),
    say(RITUAL_LINES.tangled),
    say(RITUAL_LINES.farewell),
    { kind: "sting", role: "outro" },
  ];
}

type Forbidden = {
  reason: string;
  /** Căutați pe textul NORMALIZAT: prind „ARIPĂ”, „aripa” și „Aripă” deopotrivă. */
  terms: readonly string[];
  /**
   * Căutați pe textul doar cu litere mici, CU diacritice. Aici stau termenii al
   * căror sens depinde de ele: normalizat, „pană” devine „pana”, adică exact
   * „până” — cel mai comun cuvânt din limbă —, iar „singură” devine „singura”,
   * articolul. Un planșeu care respinge „până mâine” n-ar mai fi un planșeu, ar
   * fi o piedică.
   */
  exact?: readonly string[];
};

/**
 * Oglinda mecanică a regulii de aur, pe categorii. Se aplică DOAR rândurilor fixe
 * ale personajului — constantele canalului (numele lui ca gazdă de podcast) sunt
 * suprafață de brand și rămân în afara ei.
 *
 * Lista e un PLANȘEU, nu plafonul: regula de aur e mai largă decât orice listă de
 * cuvinte, iar un rând care trece de aici nu e prin asta bun. Ce scapă se adaugă
 * când e văzut.
 *
 * Termenii se scriu fără diacritice și cu litere mici: comparația e pe textul
 * normalizat. Se compun în regexuri pe granițe de cuvânt, deci un termen poate
 * purta și o coadă („gait\w*” prinde orice formă a numelui).
 */
const FORBIDDEN: readonly Forbidden[] = [
  {
    reason: "specie: personajul nu-și numește niciodată corpul de pasăre",
    terms: [
      "pasare",
      "pasari",
      "pasarea",
      "gait\\w*",
      "cioc",
      "ciocul",
      "aripa",
      "aripi",
      "pene",
      "cuib",
      "zbor",
      "zburat",
    ],
    exact: ["pană"],
  },
  {
    reason: "acord feminin la persoana întâi: vocea nu-și declară genul",
    terms: ["sigura", "vazuta", "bucuroasa", "mirata", "mie una"],
    exact: ["singură"],
  },
  {
    reason: "adresare de scenă și morală: vorbește cu UN copil, nu ține lecție unei săli",
    terms: ["dragi copii", "sper ca ti-a placut", "am invatat ca", "asadar", "voi, cei din"],
  },
  {
    reason: "țară: nu compară popoare și nu presupune unde e ascultătorul",
    terms: ["nemti", "germani", "spanioli", "italieni", "englezi", "colegii tai"],
  },
];

/** Litere mici, diacriticele scoase: „SIGURĂ” și „sigura” sunt același cuvânt pentru lege. */
const plain = (text: string): string =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

/** Termenii prinși, fiecare cu motivul categoriei lui; se citează bucata găsită, nu fragmentul de regex. */
function termProblems(normalized: string, lowered: string): string[] {
  const problems: string[] = [];
  const hits = (haystack: string, terms: readonly string[], reason: string): void => {
    for (const term of terms) {
      // Granițe Unicode, nu `\b`: în JS, „ă” nu e caracter de cuvânt, deci
      // `\bpană\b` nu prinde niciodată „pană”.
      const edges = "[\\p{L}\\p{N}]";
      const hit = new RegExp(`(?<!${edges})${term}(?!${edges})`, "u").exec(haystack);
      if (hit) problems.push(`ADR-047 — „${hit[0]}”: ${reason}`);
    }
  };
  for (const group of FORBIDDEN) {
    hits(normalized, group.terms, group.reason);
    hits(lowered, group.exact ?? [], group.reason);
  }
  return problems;
}

const BRACKETED = /\[[^\]]*\]/g;

/** Tagurile din afara listei canonice: parantezele drepte sunt rezervate lor, iar un tag inventat pleacă necontrolat la sinteză. */
function tagProblems(text: string): string[] {
  const known: readonly string[] = EMOTION_TAGS;
  return [...text.matchAll(BRACKETED)]
    .map((hit) => hit[0])
    .filter((tag) => !known.includes(tag))
    .map((tag) => `ADR-047 — tag „${tag}” în afara listei canonice de emoții`);
}

/** Problemele unui rând fix față de regula de aur; listă goală = trece (dar vezi PLANȘEUL de mai sus). */
export function goldenRuleProblems(text: string): string[] {
  return [...termProblems(plain(text), text.toLowerCase()), ...tagProblems(text)];
}
