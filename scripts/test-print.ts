/**
 * Legea tiparului (ADR-046 în harness-ul privat, care înlocuiește ADR-044):
 * foile A4 ies din browser — `@media print` + `@page`, zero dependințe — și la
 * tipar NIMIC nu se sprijină pe un fundal colorat. Culoarea trăiește doar în
 * prim-plan: text, contururi, umpleri SVG. Motivul e mecanic: „background
 * graphics" e stins implicit în orice dialog de tipărire, deci un verso desenat
 * ca fundal iese coală albă pentru oricine apasă Tipărește fără să umble prin
 * opțiuni.
 *
 * Șapte legi, în ordinea din fișier: cartonașul de reguli · zarurile ·
 * suprafața de hârtie · foreground-only pe ea · `app/globals.css` ·
 * dependințele · geometria cu martori citiți. Rulează local:
 *
 *   yarn test
 *
 * Fără bibliotecă de teste: `node:test` vine cu Node și își rulează testele
 * direct în procesul curent când fișierul e executat cu ts-node.
 *
 * SUPRAFAȚA PĂZITĂ nu e „app/tipareste/**": e subarborele de tipar PLUS
 * modulele partajate care ajung prin el pe hârtie (mascota versoului, eticheta
 * gri a foilor) PLUS `app/globals.css`, care se aplică peste tot. Nu se
 * presupune, se calculează: se pleacă de la fișierele foilor și se merge pe
 * importuri; fiecare modul din afara subarborelui e clasificat în `OFF_TREE`,
 * cu motiv. Un import nou, neclasificat, pică legea 3 — așa suprafața nu se
 * lărgește pe furiș și scanul nu rămâne mai îngust decât ce păzește.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Module from "node:module";
import { dirname, join, relative } from "node:path";
import test from "node:test";

import pkg from "../package.json";
import { storyDice, wheelDecks } from "../app/jocuri/content";
import { RULES_CARD } from "../app/tipareste/rules";
import { walk } from "./lib/paths";

/** Fiecare mesaj de eșec al acestui fișier citează ADR-046 — asta e legea pe care o păzește. */
const ADR = "ADR-046";
const REPO_ROOT = join(__dirname, "..");
const PRINT_DIR = join(REPO_ROOT, "app/tipareste");
const GLOBALS_CSS = join(REPO_ROOT, "app/globals.css");

/**
 * `dice.ts`, ca tot restul lui `app/`, importă cuvintele zarurilor prin
 * aliasul `@/…` — rezolvat de webpack la build-ul Next.js, dar necunoscut
 * de ts-node, care nu citește `paths` din tsconfig. Niciun alt script din
 * `yarn test` n-a avut nevoie să-l traverseze până acum. Fără o dependință
 * nouă (o dependință nouă intră în albă-lista din legea 6, mai jos, și n-ar
 * mai fi lista de azi), rescriem local cererile `@/…` către rădăcina
 * repo-ului, înainte de a cere `DICE_CUBES` — exact ce ar face
 * `tsconfig-paths/register`, scris la mână, ca să nu-l adăugăm. Rescrierea
 * servește și mersul pe importuri din legea 3: `require.resolve` trece prin
 * ea, deci `@/app/…` se rezolvă la fișierul real fără nicio altă unealtă.
 */
type ResolveFilename = (...args: unknown[]) => string;
const moduleInternals = Module as unknown as { _resolveFilename: ResolveFilename };
const resolveFilename = moduleInternals._resolveFilename;
moduleInternals._resolveFilename = (...args: unknown[]): string => {
  const [request, ...rest] = args;
  const target =
    typeof request === "string" && request.startsWith("@/")
      ? join(REPO_ROOT, request.slice(2))
      : request;
  return resolveFilename(target, ...rest);
};

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DICE_CUBES } from "../app/tipareste/dice";
import CutGrid from "../app/tipareste/cut-grid";
import DiceNet from "../app/tipareste/dice-net";

// --- Legea 1: cartonașul de reguli, literă cu literă (rules.ts) -----------

test("cartonasul de reguli: textul e cel aprobat, litera cu litera (ADR-046)", () => {
  // Șirurile de mai jos sunt transcrise din rules.ts, nu derivate din el — o
  // schimbare a textului pică aici zgomotos, nu tăcut pe hârtie.
  assert.equal(
    RULES_CARD.heading,
    "Pentru omul mare",
    `${ADR}: titlul cartonasului de reguli s-a schimbat`
  );
  assert.equal(
    RULES_CARD.text,
    "Trage o carte. Răspunde tu primul. Apoi el. Nu corectezi nimic — nici acordurile, nici accentul. Când s-a plictisit, ai oprit la timp.",
    `${ADR}: textul cartonasului de reguli s-a schimbat`
  );
  assert.equal(
    RULES_CARD.mark,
    "vorbaretii.ro",
    `${ADR}: marca de pe cartonasul de reguli s-a schimbat`
  );
});

// --- Legea 2: zarurile — trei cuburi, șase cuvinte, fără dubluri ----------

test("zarurile: trei cuburi, sase cuvinte fara dubluri, toate existente in storyDice (ADR-046)", () => {
  assert.equal(
    DICE_CUBES.length,
    3,
    `${ADR}: pachetul de tipar are ${DICE_CUBES.length} cuburi, nu 3`
  );
  for (const cube of DICE_CUBES) {
    const words = cube.faces.map((face) => face.word);
    assert.equal(words.length, 6, `${ADR}: cubul "${cube.label}" are ${words.length} fete, nu 6`);
    assert.equal(
      new Set(words).size,
      words.length,
      `${ADR}: cubul "${cube.label}" are cuvinte duplicate: ${words.join(", ")}`
    );
    for (const word of words) {
      const found = storyDice.some((entry) => entry.word === word);
      assert.ok(
        found,
        `${ADR}: cubul "${cube.label}" cere cuvantul "${word}", care nu mai exista in storyDice`
      );
    }
  }
});

// --- Ce se caută: tiparele care sparg legea foreground-only ---------------

/**
 * Clasele Tailwind admise pe hârtie: „transparent" (nu vopsește nimic) și
 * „alb" (culoarea hârtiei — la tipar cu „background graphics" stins nu se
 * pierde nimic, fiindcă hârtia e deja albă). Orice alt „bg-" — o culoare, un
 * gradient, un blend, o valoare arbitrară („bg-[...]"), o decupare
 * („bg-clip-text") — pică, pe hârtia trimisă fără fundaluri, drept spațiu gol.
 */
const ALLOWED_BG = new Set(["bg-transparent", "bg-white"]);

/**
 * O clasă „bg-" poate veni cu un lanț de variante înainte (`print:`, `sm:`,
 * `group-hover:` …) — regula se uită după clasa Tailwind, nu după variantă,
 * deci taie variantele și ține doar coada („bg-…"), inclusiv valorile
 * arbitrare („bg-[#fff]") și modificatorul de opacitate („bg-white/50").
 * `(?<![\w-])` cere un început de token: „bg-" în mijlocul unui alt nume
 * (o cale de fișier, de pildă) nu se prinde în regulă.
 */
const BG_CLASS = /(?<![\w-])(?:[a-zA-Z][\w-]*:)*(bg-[\w./[\]#%(),:-]*)/g;

/**
 * Utilitara de PROPRIETATE arbitrară a lui Tailwind: `[background:#eee]`,
 * `print:[background-color:#f3f4f6]` — prima unealtă la care ajunge cineva
 * când nu există utilitară gata făcută (`dice-net.tsx` chiar așa desenează
 * plierea: `print:[border-top-style:dashed]`). Paranteza trebuie să înceapă un
 * token — `text-[11.5pt]` sau `print:[&>span]:h-[26mm]` nu sunt proprietăți
 * arbitrare, deci lookbehind-ul taie orice paranteză lipită de o utilitară sau
 * de un selector.
 */
const ARBITRARY_PROPERTY = /(?<![\w\-\]])\[([a-zA-Z][\w-]*)\s*:/g;
/** Proprietățile CSS care vopsesc un fundal, sub orice prefix de vendor. */
const BACKGROUND_PROPERTY = /^(-[a-z]+-)?background/i;

/**
 * Stilul inline — `style={{ background }}`, `style={{ backgroundColor }}`,
 * `style={{ backgroundImage }}` — ocolește complet clasele Tailwind. Căutăm
 * CUVÂNTUL, oriunde în cod (comentariile sunt deja scoase): pe suprafața asta
 * „background" n-are nicio întrebuințare legitimă, iar un fals pozitiv costă o
 * redenumire, pe când un fals negativ costă o coală albă. De-aia sonda asta
 * prinde și proprietatea arbitrară, a doua oară — două mesaje pe aceeași
 * linie, nu un raport curat cu o gaură în el.
 */
const INLINE_BACKGROUND = /\b(background(?:[A-Z][A-Za-z]*)?)\b/g;

/**
 * Cerneala invizibilă: text alb sau transparent. Alb pe alb și transparent nu
 * se văd pe hârtie decât peste un fundal — adică exact lucrul pe care legea îl
 * interzice. `bg-clip-text` (fundalul devine cerneala textului) se prinde deja
 * în `BG_CLASS`.
 */
const INVISIBLE_INK = /(?<![\w-])(?:[a-zA-Z][\w-]*:)*(text-transparent|text-white)(?![\w-])/g;

/** Cele două forme ale proprietății CSS: cu liniuțe, sau camelCase în `style={{ }}`. */
const PRINT_COLOR_ADJUST = /print-?color-?adjust/i;

/**
 * Scutirea declarată, pentru ziua în care cineva îmbracă previzualizarea de
 * ecran: un comentariu `fundal-de-ecran: <motiv>` pe linia vinovată. Ca să
 * țină, aceeași linie trebuie să poarte și `print:hidden` — altfel nimeni nu
 * poate verifica, nici măcar cu ochiul, că fundalul chiar nu ajunge pe hârtie.
 * Explicită și de găsit cu grep, nu excepție tăcută; `print-color-adjust` nu
 * intră niciodată sub ea.
 */
const ESCAPE_NAME = "fundal-de-ecran";
const SCREEN_ESCAPE = /fundal-de-ecran:\s*(\S[^*\n]*)/;
/** Un motiv sub atâtea semne nu e motiv, e o formalitate. */
const MIN_REASON = 10;

type Probe = { re: RegExp; verdict: (hit: string) => string | null };

const CLASS_PROBES: Probe[] = [
  { re: BG_CLASS, verdict: (cls) => (ALLOWED_BG.has(cls) ? null : `clasa de fundal „${cls}"`) },
  {
    re: ARBITRARY_PROPERTY,
    verdict: (prop) =>
      BACKGROUND_PROPERTY.test(prop) ? `proprietatea arbitrară „[${prop}: …]"` : null,
  },
  { re: INLINE_BACKGROUND, verdict: (prop) => `fundal scris de mână: „${prop}"` },
  { re: INVISIBLE_INK, verdict: (cls) => `cerneala invizibilă „${cls}"` },
];

/** Motivele pentru care un text sparge legea, sub un set de sonde; lista goală = text curat. */
function hits(line: string, probes: Probe[]): string[] {
  const found: string[] = [];
  for (const probe of probes) {
    for (const match of line.matchAll(probe.re)) {
      const why = probe.verdict(match[1] as string);
      if (why) found.push(why);
    }
  }
  return found;
}

/** Comentariile scot din calcul mențiunile documentare, nu clasele reale — la fel ca în check-naming.ts. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, " "))
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

// --- Legea 5 (unealta ei, folosită și de legea 4): app/globals.css --------

/**
 * Regulile CSS „de frunză": selectorul plus corpul lor. Corpul nu poate ține
 * acolade, deci `@layer utilities { … }` sau `@media print { … }` nu se prind
 * ca regulă — se prind regulile dinăuntru, exact ce vrem.
 */
const CSS_RULE = /([^{}]+)\{([^{}]*)\}/g;
/** O declarație de fundal; proprietatea trebuie să înceapă un token, ca `--background-…` să nu se prindă. */
const CSS_BACKGROUND = /(?:^|[;{\s])(-[a-z]+-)?background[a-z-]*\s*:/i;
/** Cerneală transparentă declarată în CSS. */
const CSS_TRANSPARENT_INK = /(?:^|[;{\s])color\s*:\s*transparent/i;
/** Clasele Tailwind aduse în CSS prin `@apply` — trec prin aceleași sonde ca markup-ul. */
const CSS_APPLY = /@apply([^;}]*)/g;
/** Numele de clasă dintr-un selector. */
const CSS_CLASS = /\.([A-Za-z_][\w-]*)/g;
/** At-rule-urile care descriu HÂRTIA. */
const CSS_PRINT_AT_RULE = /@(page|media)([^{]*)\{/g;

/** Motivele pentru care o regulă CSS vopsește; lista goală = regulă curată. */
function cssPaintReasons(body: string): string[] {
  const reasons: string[] = [];
  if (CSS_BACKGROUND.test(body)) reasons.push("o declarație de background");
  if (CSS_TRANSPARENT_INK.test(body)) reasons.push("cerneală transparentă (color: transparent)");
  for (const apply of body.matchAll(CSS_APPLY)) {
    reasons.push(...hits(apply[1] as string, CLASS_PROBES));
  }
  return reasons;
}

/**
 * Clasele definite în `app/globals.css` care VOPSESC — legitime pe ecran
 * (`.text-effect` e eticheta de marcă a casei), interzise pe hârtie: un
 * `bg-clip-text text-transparent` ajuns pe o coală se tipărește text invizibil.
 * De aceea globalele nu se scanează ca un fișier de hârtie — restul site-ului
 * are voie să vopsească — ci se citesc de aici: ce vopsesc ele devine tipar
 * căutat pe suprafața de hârtie.
 */
function screenInkClasses(css: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const rule of css.matchAll(CSS_RULE)) {
    const reasons = cssPaintReasons(rule[2] as string);
    if (reasons.length === 0) continue;
    for (const cls of (rule[1] as string).matchAll(CSS_CLASS)) {
      found.set(cls[1] as string, reasons.join("; "));
    }
  }
  return found;
}

/** Blocul cu acolade echilibrate care începe la `open`. */
function blockAt(css: string, open: number): string {
  let depth = 0;
  for (let index = open; index < css.length; index += 1) {
    if (css[index] === "{") depth += 1;
    else if (css[index] === "}") {
      depth -= 1;
      if (depth === 0) return css.slice(open + 1, index);
    }
  }
  return css.slice(open + 1);
}

/** Regulile care descriu hârtia: `@page` și orice `@media` care pomenește `print`. */
function printScopedRules(css: string): { head: string; body: string }[] {
  const rules: { head: string; body: string }[] = [];
  for (const at of css.matchAll(CSS_PRINT_AT_RULE)) {
    const head = `@${at[1]}${at[2]}`.trim();
    const open = (at.index ?? 0) + at[0].length - 1;
    if (at[1] === "page" || /\bprint\b/.test(at[2] as string)) {
      rules.push({ head, body: blockAt(css, open) });
    }
  }
  return rules;
}

/** Globalele, fără comentarii: fișierul își pomenește regulile în proză, iar proza nu e CSS. */
function readCss(): string {
  return stripComments(readFileSync(GLOBALS_CSS, "utf8"));
}

const SCREEN_INK = screenInkClasses(readCss());

/** Sondele complete: tiparele fixe plus clasele care vopsesc, citite din globals.css. */
const PROBES: Probe[] = [...CLASS_PROBES, ...inkProbe()];

function inkProbe(): Probe[] {
  const names = [...SCREEN_INK.keys()].filter((name) => /^[\w-]+$/.test(name));
  if (names.length === 0) return [];
  return [
    {
      re: new RegExp(`(?<![\\w-])(${names.join("|")})(?![\\w-])`, "g"),
      verdict: (cls) => `clasa „${cls}", care vopsește în app/globals.css (${SCREEN_INK.get(cls)})`,
    },
  ];
}

// --- Legea 3: suprafața de hârtie — ce se scanează și de ce ---------------

/**
 * Modulele din AFARA lui `app/tipareste/**` la care ajung foile. Fiecare e
 * clasificat aici, cu motiv; nimic nu se clasifică singur.
 *
 * - `paper`  — ajunge pe hârtie: se scanează integral și se merge mai departe
 *              pe importurile lui.
 * - `screen` — randat DOAR în `print:hidden` (comenzile paginii): nu ajunge pe
 *              hârtie, nu se scanează, dar rămâne scris aici de ce.
 * - `split`  — modul partajat din care hârtia ia doar câteva nume: se scanează
 *              DECLARAȚIILE numelor de pe hârtie, restul rămâne chrome de
 *              ecran. Un modul „split" n-are voie cu importuri locale — o
 *              declarație care deleagă altundeva ar scăpa feliei.
 */
type Split = { mode: "split"; paper: string[]; screen: string[]; why: string };
type Surface = { mode: "paper" | "screen"; why: string } | Split;

const OFF_TREE: Record<string, Surface> = {
  "app/components/mascot/mascot.tsx": {
    mode: "paper",
    why: "versoul cartonașelor: `BackCard` din print-pack.tsx tipărește mascota",
  },
  "app/components/mascot/mascot-svg.ts": {
    mode: "paper",
    why: "sursa desenului mascotei — umplerile ei SVG sunt cerneală de prim-plan",
  },
  "app/components/ui.ts": {
    mode: "split",
    paper: ["eyebrowMuted"],
    screen: ["eyebrow", "btn"],
    why: "eticheta gri e antetul foilor, eticheta zarului și titlul cartonașului de reguli; antetul paginii și butonul de tipar stau în print:hidden",
  },
  "app/jocuri/components/tabs.tsx": {
    mode: "screen",
    why: "taburile setului de întrebări — comenzi de ecran, în print:hidden (print-pack.tsx)",
  },
  "app/jocuri/content.ts": {
    mode: "paper",
    why: "ușa unică spre cuvintele jocurilor: întrebările roții și cuvintele zarurilor ajung pe hârtie",
  },
  "app/jocuri/content/": {
    mode: "paper",
    why: "conținutul din spatele ușii — text, fără clase; scanat ca să rămână așa",
  },
};

/** Cheia din tabel: calea exactă a fișierului, sau un prefix de director (terminat cu „/"). */
function offTreeEntry(rel: string): Surface | undefined {
  const exact = OFF_TREE[rel];
  if (exact) return exact;
  const prefix = Object.keys(OFF_TREE).find((key) => key.endsWith("/") && rel.startsWith(key));
  return prefix ? OFF_TREE[prefix] : undefined;
}

/** Textul unei bucăți de suprafață: codul fără comentarii, plus sursa brută, pe linii aliniate. */
type PaperText = { label: string; startLine: number; code: string[]; raw: string[] };
type Survey = { texts: PaperText[]; problems: string[] };

type LocalImport = { spec: string; names: string[] };

const IMPORT_CLAUSE = /(?:^|\n)\s*(?:import|export)\s+([\s\S]*?)\s*from\s*"([^"]+)"/g;
const BARE_IMPORT = /(?:^|\n)\s*import\s*"([^"]+)"/g;

/** Numele cerute de o clauză de import: `{ a, b as c }`, implicitul, sau `*`. */
function parseNames(clause: string): string[] {
  const trimmed = clause.replace(/\btype\b/g, " ").trim();
  const braces = /\{([^}]*)\}/.exec(trimmed);
  const names = braces
    ? (braces[1] as string).split(",").map((name) => (name.split(/\s+as\s+/)[0] as string).trim())
    : [];
  const head = (trimmed.split("{")[0] as string).replace(/,\s*$/, "").trim();
  if (head.startsWith("*")) names.push("*");
  else if (head.length > 0) names.push("default");
  return names.filter((name) => name.length > 0);
}

/** Importurile din proiect (relative sau `@/…`) ale unui fișier, cu numele cerute. */
function localImports(code: string): LocalImport[] {
  const found: LocalImport[] = [];
  for (const clause of code.matchAll(IMPORT_CLAUSE)) {
    found.push({ spec: clause[2] as string, names: parseNames(clause[1] as string) });
  }
  for (const bare of code.matchAll(BARE_IMPORT)) {
    found.push({ spec: bare[1] as string, names: [] });
  }
  return found.filter((imp) => imp.spec.startsWith(".") || imp.spec.startsWith("@/"));
}

/** Fișierul real din spatele unui import — prin aceeași rescriere `@/…` de mai sus. */
function resolveLocal(file: string, spec: string): string | null {
  try {
    return require.resolve(spec, { paths: [dirname(file)] });
  } catch {
    return null;
  }
}

function readPaperText(file: string, label: string): PaperText {
  const raw = readFileSync(file, "utf8");
  return { label, startLine: 1, code: stripComments(raw).split("\n"), raw: raw.split("\n") };
}

/** Declarațiile exportate ale unui modul, fiecare cu liniile ei. */
function sliceExports(text: PaperText): Map<string, PaperText> {
  const code = text.code.join("\n");
  const heads = [
    ...code.matchAll(
      /^export\s+(?:default\s+)?(?:async\s+)?(?:const|let|var|function|class|type|interface)\s+([A-Za-z_$][\w$]*)/gm
    ),
  ];
  const slices = new Map<string, PaperText>();
  heads.forEach((head, index) => {
    const start = head.index ?? 0;
    const startLine = code.slice(0, start).split("\n").length;
    const lines = code.slice(start, heads[index + 1]?.index ?? code.length).split("\n");
    slices.set(head[1] as string, {
      label: `${text.label}#${head[1]}`,
      startLine,
      code: lines,
      raw: text.raw.slice(startLine - 1, startLine - 1 + lines.length),
    });
  });
  return slices;
}

/** Feliile de pe hârtie ale unui modul „split" — și tot ce nu se mai potrivește în tabel. */
function splitSurface(text: PaperText, entry: Split, asked: Set<string>): Survey {
  const problems: string[] = [];
  const texts: PaperText[] = [];
  if (localImports(text.code.join("\n")).length > 0) {
    problems.push(
      `${ADR}: ${text.label} e clasificat „split", dar are importuri locale — o declarație care deleagă altundeva ar scăpa feliei; reclasifică-l „paper" sau mută numele de pe hârtie`
    );
  }
  const classified = new Set([...entry.paper, ...entry.screen]);
  for (const name of asked) {
    if (classified.has(name)) continue;
    problems.push(
      `${ADR}: hârtia importă „${name}" din ${text.label}, dar tabelul OFF_TREE nu-l clasifică — pune-l în „paper" (ajunge pe coală) sau în „screen" (randat doar în print:hidden)`
    );
  }
  for (const name of classified) {
    if (asked.has(name)) continue;
    problems.push(
      `${ADR}: ${text.label} clasifică „${name}", dar hârtia nu-l mai importă — scoate-l din OFF_TREE, ca tabelul să rămână adevărat`
    );
  }
  const slices = sliceExports(text);
  for (const name of entry.paper) {
    const slice = slices.get(name);
    if (slice) texts.push(slice);
    else
      problems.push(
        `${ADR}: nu găsesc declarația „${name}" în ${text.label} — felia de hârtie nu se poate scana`
      );
  }
  return { texts, problems };
}

/**
 * Suprafața de hârtie, mers pe importuri: fișierele lui `app/tipareste/**` și,
 * din ele mai departe, tot ce e clasificat „paper" sau „split" în OFF_TREE.
 *
 * Sămânța sunt fișierele `.ts`/`.tsx` ale subarborelui; orice altceva intră
 * doar dacă o foaie chiar îl importă — un `.css` pus lângă foi și importat de
 * ele se citește tot ca text, prin aceleași sonde, fiindcă ajunge pe aceeași
 * coală. Ce nu se rezolvă la un fișier real se raportează, nu se sare peste.
 */
function surveyPaper(): Survey {
  const texts: PaperText[] = [];
  const problems: string[] = [];
  const asked = new Map<string, Set<string>>();
  const splits: { text: PaperText; entry: Split }[] = [];
  const seen = new Set<string>();
  const queue = [...walk(PRINT_DIR, (name) => /\.tsx?$/.test(name))];

  const follow = (file: string, text: PaperText) => {
    for (const imp of localImports(text.code.join("\n"))) {
      const target = resolveLocal(file, imp.spec);
      if (!target) {
        problems.push(
          `${ADR}: ${text.label} importă „${imp.spec}", care nu se rezolvă la un fișier — suprafața de hârtie nu se poate calcula peste el`
        );
        continue;
      }
      const rel = relative(REPO_ROOT, target);
      const names = asked.get(rel) ?? new Set<string>();
      imp.names.forEach((name) => names.add(name));
      asked.set(rel, names);
      queue.push(target);
    }
  };

  const visit = (file: string) => {
    const rel = relative(REPO_ROOT, file);
    const text = readPaperText(file, rel);
    if (!relative(PRINT_DIR, file).startsWith("..")) {
      texts.push(text);
      follow(file, text);
      return;
    }
    const entry = offTreeEntry(rel);
    if (!entry) {
      problems.push(
        `${ADR}: ${rel} intră pe suprafața de tipar din app/tipareste/**, dar nu e clasificat în OFF_TREE — scrie dacă ajunge pe hârtie („paper"/„split") sau rămâne pe ecran („screen"), cu motiv`
      );
      return;
    }
    if (entry.mode === "split") splits.push({ text, entry });
    if (entry.mode !== "paper") return;
    texts.push(text);
    follow(file, text);
  };

  while (queue.length > 0) {
    const file = queue.pop() as string;
    if (seen.has(file)) continue;
    seen.add(file);
    visit(file);
  }
  for (const split of splits) {
    const surface = splitSurface(split.text, split.entry, asked.get(split.text.label) ?? new Set());
    texts.push(...surface.texts);
    problems.push(...surface.problems);
  }
  return { texts, problems };
}

const PAPER = surveyPaper();

test("suprafata de hartie: fiecare modul la care ajung foile e clasificat (ADR-046)", () => {
  assert.equal(PAPER.problems.length, 0, PAPER.problems.join("\n"));
});

// --- Legea 4: foreground-only pe toată suprafața de hârtie ----------------

/**
 * Ce acceptă sondele, scris o dată. Riscul aici e falsul NEGATIV, nu falsul
 * pozitiv: un fals pozitiv costă o redenumire în sesiunea care scrie codul, un
 * fals negativ costă o coală albă la celălalt capăt, în casa unui părinte care
 * a apăsat Tipărește. De-aia regulile sunt largi și mesajele explică.
 *
 * - Clasa Tailwind se recunoaște după COADĂ, sub orice lanț de variante
 *   (`print:`, `sm:`, `group-hover:`), cu valori arbitrare și opacitate cu tot.
 * - Proprietatea arbitrară (`[background: …]`) se caută separat: e altă
 *   sintaxă, nu altă clasă — și e prima unealtă la îndemână când utilitara nu
 *   există.
 * - „background", ca simplu cuvânt în cod, e vinovat: pe suprafața asta n-are
 *   întrebuințare legitimă, deci stilul inline, obiectele de stil și CSS-ul
 *   scris de mână intră toate pe ușa asta, fără să le enumerăm formele.
 * - Ce rămâne dincolo de sonde, deliberat: o clasă compusă la rulare
 *   („bg-" + variabilă) și un fundal ascuns într-un modul clasificat „screen".
 *   Prima cere un analizor de sintaxă — adică o dependință nouă, exact ce
 *   interzice legea 6; a doua se sprijină pe motivul scris în OFF_TREE, care
 *   se citește la fiecare import nou. Alegeri, nu scăpări.
 */

/** Scutirea de pe o linie: sau e completă (marcaj + print:hidden + motiv), sau e ea însăși o problemă. */
function escapeProblems(where: string, raw: string): string[] {
  const problems: string[] = [];
  const reason = SCREEN_ESCAPE.exec(raw)?.[1]?.trim() ?? "";
  if (!raw.includes("print:hidden")) {
    problems.push(
      `${ADR}: ${where} — scutirea „${ESCAPE_NAME}" cere „print:hidden" pe ACEEAȘI linie; altfel nimeni nu poate verifica, nici cu ochiul, că fundalul nu ajunge pe coală`
    );
  }
  if (reason.length < MIN_REASON) {
    problems.push(
      `${ADR}: ${where} — scutirea „${ESCAPE_NAME}" cere un motiv scris pe aceeași linie („${ESCAPE_NAME}: de ce e doar de ecran")`
    );
  }
  return problems;
}

function scanPaperText(text: PaperText): string[] {
  const problems: string[] = [];
  if (PRINT_COLOR_ADJUST.test(text.code.join("\n"))) {
    problems.push(
      `${ADR}: ${text.label} setează print-color-adjust — legea e foreground-only, nu repornirea fundalurilor; scutirea „${ESCAPE_NAME}" nu acoperă asta`
    );
  }
  text.code.forEach((line, index) => {
    const where = `${text.label}:${text.startLine + index}`;
    const raw = text.raw[index] ?? "";
    if (raw.includes(ESCAPE_NAME)) problems.push(...escapeProblems(where, raw));
    else problems.push(...hits(line, PROBES).map((why) => `${ADR}: ${where} — ${why}`));
  });
  return problems;
}

test("foreground-only: nimic de pe hartie nu se sprijina pe fundal colorat (ADR-046)", () => {
  const problems = PAPER.texts.flatMap((text) => scanPaperText(text));
  assert.equal(problems.length, 0, problems.join("\n"));
});

// --- Legea 5: app/globals.css — regulile hârtiei nu vopsesc ---------------

test("globals.css: @page si @media print nu vopsesc nimic (ADR-046)", () => {
  const problems = printScopedRules(readCss()).flatMap((rule) =>
    cssPaintReasons(rule.body).map(
      (why) => `${ADR}: app/globals.css — „${rule.head}" vopsește: ${why}`
    )
  );
  assert.equal(problems.length, 0, problems.join("\n"));
});

// --- Legea 6: zero dependințe de PDF — albă-listă, nu neagră-listă --------

/**
 * Lista de azi, transcrisă din package.json — albă-listă, nu neagră-listă:
 * o neagră-listă de nume ("pdf", "puppeteer", "jspdf") ratează orice pachet
 * la care nimeni nu s-a gândit ("html-pdf-node" și tot restul). Un pachet nou
 * — de PDF sau de orice altceva — pică testul; se adaugă aici deliberat,
 * o dată cu package.json, nu doar acolo.
 *
 * Toate ușile prin care intră un pachet, nu doar cele două umblate:
 * `yarn add --optional html-pdf-node` scrie în `optionalDependencies`, iar o
 * versiune împinsă cu forța intră prin `resolutions` — amândouă instalează
 * cod, deci amândouă sunt albe-liste goale până când cineva le deschide
 * deliberat.
 */
const ALLOWED_PACKAGES: Record<string, string[]> = {
  dependencies: ["classnames", "dotenv", "next", "react", "react-dom"],
  devDependencies: [
    "@napi-rs/canvas",
    "@types/node",
    "@types/react",
    "@types/react-dom",
    "@typescript-eslint/eslint-plugin",
    "@typescript-eslint/parser",
    "autoprefixer",
    "eslint",
    "eslint-config-next",
    "eslint-plugin-eslint-comments",
    "jscpd",
    "knip",
    "playwright",
    "postcss",
    "prettier",
    "sharp",
    "tailwindcss",
    "ts-node",
    "typescript",
  ],
  optionalDependencies: [],
  peerDependencies: [],
  resolutions: [],
};

/** Orice câmp de package.json care aduce cod trebuie să fie unul dintre cele de sus. */
const INSTALLS_PACKAGES = /dependencies|resolutions|overrides/i;

test("dependinte: toate usile prin care intra un pachet sunt albe-liste (ADR-046)", () => {
  const manifest = pkg as unknown as Record<string, Record<string, string> | undefined>;
  for (const [field, allowed] of Object.entries(ALLOWED_PACKAGES)) {
    assert.deepEqual(
      Object.keys(manifest[field] ?? {}).sort(),
      [...allowed].sort(),
      `${ADR}: ${field} nu mai e alba-lista de azi — actualizeaza ALLOWED_PACKAGES deliberat`
    );
  }
  const unknown = Object.keys(pkg).filter(
    (field) => INSTALLS_PACKAGES.test(field) && !(field in ALLOWED_PACKAGES)
  );
  assert.deepEqual(
    unknown,
    [],
    `${ADR}: package.json are camp(uri) de pachete pe care legea nu le stie: ${unknown.join(", ")} — adauga-le in ALLOWED_PACKAGES, cu lista lor`
  );
});

// --- Legea 7: geometria are martori, iar martorii se citesc ---------------

type Side = "top" | "right" | "bottom" | "left";
type Edge = "cut" | "fold";

const SIDES: Side[] = ["top", "right", "bottom", "left"];

/** Semnul după care se recunoaște, în markup-ul randat, ce e fiecare margine. */
const EDGE_MARK: Record<Side, Record<Edge, string>> = {
  top: { cut: "print:border-t-black", fold: "print:[border-top-style:dashed]" },
  right: { cut: "print:border-r-black", fold: "print:[border-right-style:dashed]" },
  bottom: { cut: "print:border-b-black", fold: "print:[border-bottom-style:dashed]" },
  left: { cut: "print:border-l-black", fold: "print:[border-left-style:dashed]" },
};

/**
 * Desfășurata aprobată, transcrisă — nu derivată din `dice-net.tsx`, ca o
 * schimbare acolo să pice AICI, nu tăcut pe hârtie. Crucea latină: coloana din
 * mijloc de sus în jos, apoi aripa stângă și aripa dreaptă.
 */
const NET: { edges: Record<Side, Edge>; flaps: Side[] }[] = [
  { edges: { top: "cut", right: "cut", bottom: "fold", left: "cut" }, flaps: ["top"] },
  { edges: { top: "fold", right: "fold", bottom: "fold", left: "fold" }, flaps: [] },
  { edges: { top: "fold", right: "cut", bottom: "fold", left: "cut" }, flaps: [] },
  { edges: { top: "fold", right: "cut", bottom: "cut", left: "cut" }, flaps: [] },
  {
    edges: { top: "cut", right: "fold", bottom: "cut", left: "cut" },
    flaps: ["top", "bottom", "left"],
  },
  {
    edges: { top: "cut", right: "cut", bottom: "cut", left: "fold" },
    flaps: ["top", "bottom", "right"],
  },
];

/** Cubul are 12 muchii, desfășurata leagă 5 prin plieri, deci rămân 7 rosturi de lipit. */
const FLAPS_PER_NET = 7;
/** Cele 5 plieri, desenate din amândouă părțile, dau 10 margini punctate. */
const FOLD_EDGES = 10;
/** 12 cartonașe pe foaie: 3 coloane × 4 rânduri. */
const CARDS_PER_SHEET = 12;
/** Versoul, oglindit pe rânduri de câte 3 — spatele cartonașului N sub fața lui. */
const MIRRORED_ORDER = [3, 2, 1, 6, 5, 4, 9, 8, 7, 12, 11, 10];

/** Clasa purtată chiar de eticheta care începe segmentul (nu de copiii ei). */
function ownClass(segment: string): string {
  return /^"[^"]*"\s*class="([^"]*)"/.exec(segment)?.[1] ?? "";
}

function checkNetFace(segment: string, index: number, where: string): void {
  const shape = NET[index] as (typeof NET)[number];
  const cls = ownClass(segment);
  for (const side of SIDES) {
    const want = shape.edges[side];
    const other: Edge = want === "cut" ? "fold" : "cut";
    assert.ok(
      cls.includes(EDGE_MARK[side][want]),
      `${ADR}: ${where}, fața ${index + 1} — latura „${side}" ar trebui „${want}", marcajul lipsește`
    );
    assert.ok(
      !cls.includes(EDGE_MARK[side][other]),
      `${ADR}: ${where}, fața ${index + 1} — latura „${side}" poartă și marcajul „${other}"`
    );
  }
  const flaps = [...segment.matchAll(/data-flap="(\w+)"/g)].map((flap) => flap[1]);
  assert.deepEqual(
    flaps,
    shape.flaps,
    `${ADR}: ${where}, fața ${index + 1} — clapele randate nu sunt cele din macheta aprobată`
  );
}

test("desfasurata zarului: tabelul taiat/pliat si cele sapte clape, citite din markup (ADR-046)", () => {
  for (const cube of DICE_CUBES) {
    const markup = renderToStaticMarkup(createElement(DiceNet, { cube }));
    const where = `desfășurata „${cube.label}"`;
    assert.ok(
      markup.includes(`data-net="${cube.label}"`),
      `${ADR}: ${where} n-are martorul data-net`
    );
    const faces = markup.split("data-face=").slice(1);
    assert.equal(
      faces.length,
      NET.length,
      `${ADR}: ${where} are ${faces.length} fețe, nu ${NET.length}`
    );
    faces.forEach((segment, index) => checkNetFace(segment, index, where));
    assert.deepEqual(
      faces.map((segment) => /^"([^"]*)"/.exec(segment)?.[1]),
      cube.faces.map((face) => face.word),
      `${ADR}: ${where} — cuvintele randate nu mai sunt cele din dice.ts, în ordinea desfășuratei`
    );
    assert.equal(
      [...markup.matchAll(/data-flap=/g)].length,
      FLAPS_PER_NET,
      `${ADR}: ${where} n-are ${FLAPS_PER_NET} clape — cubul are 12 muchii, 5 se pliază, deci rămân 7 de lipit; cu mai puține, zarul pliat se deschide pe masă`
    );
    assert.equal(
      SIDES.flatMap((side) => faces.filter((s) => ownClass(s).includes(EDGE_MARK[side].fold)))
        .length,
      FOLD_EDGES,
      `${ADR}: ${where} n-are ${FOLD_EDGES} margini punctate — cele 5 plieri se desenează din amândouă părțile`
    );
  }
});

/**
 * Oglinda se probează pe `CutGrid` direct, nu pe foaia de verso din
 * `print-pack.tsx`: modulul acela cheamă `window.print()`, iar tsconfig-ul
 * scripturilor n-are DOM, deci nu se poate randa aici. Ce se măsoară e regula
 * („rândul se citește invers"), nu cablarea ei.
 */

/** Numerele din set, în ordinea în care ies pe hârtie. */
function cardOrder(markup: string): number[] {
  return [...markup.matchAll(/data-card="(\d+)"/g)].map((card) => Number(card[1]));
}

test("grila de taiat: 12 cartonase pe 3 coloane, versoul oglindit (ADR-046)", () => {
  for (const deck of wheelDecks) {
    assert.equal(
      deck.prompts.length,
      CARDS_PER_SHEET,
      `${ADR}: setul „${deck.label}" are ${deck.prompts.length} întrebări, nu ${CARDS_PER_SHEET} — foaia e 3 coloane × 4 rânduri`
    );
  }
  const cards = (wheelDecks[0] as (typeof wheelDecks)[number]).prompts;
  const front = renderToStaticMarkup(createElement(CutGrid, { cards }));
  assert.ok(front.includes("print:grid-cols-3"), `${ADR}: grila de tăiat n-are 3 coloane la tipar`);
  assert.deepEqual(
    cardOrder(front),
    cards.map((_, index) => index + 1),
    `${ADR}: fața foii nu mai iese în ordinea setului`
  );
  assert.deepEqual(
    cardOrder(renderToStaticMarkup(createElement(CutGrid, { cards, mirror: true }))),
    MIRRORED_ORDER,
    `${ADR}: versoul nu mai e oglindit pe coloane — spatele cartonașului N n-ar mai ieși sub fața lui; azi toate spatele sunt identice, deci nimic altceva nu vede regresia`
  );
});
