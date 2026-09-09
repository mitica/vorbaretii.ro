/**
 * Legea tiparului (ADR-044 în harness-ul privat): foile A4 ies din browser —
 * `@media print` + `@page`, zero dependințe — și la tipar nimic nu se
 * sprijină pe un fundal colorat, fiindcă „background graphics" e stins
 * implicit în orice dialog de tipărire. Patru verificări asupra pachetului
 * de tipărit din `app/tipareste/`. Rulează local:
 *
 *   yarn test
 *
 * Fără bibliotecă de teste: `node:test` vine cu Node și își rulează testele
 * direct în procesul curent când fișierul e executat cu ts-node.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Module from "node:module";
import { join, relative } from "node:path";
import test from "node:test";

import pkg from "../package.json";
import { storyDice } from "../app/jocuri/content";
import { RULES_CARD } from "../app/tipareste/rules";
import { walk } from "./lib/paths";

/** Fiecare mesaj de eșec al acestui fișier citează ADR-044 — asta e legea pe care o păzește. */
const ADR = "ADR-044";
const REPO_ROOT = join(__dirname, "..");
const PRINT_DIR = join(REPO_ROOT, "app/tipareste");

/**
 * `dice.ts`, ca tot restul lui `app/`, importă cuvintele zarurilor prin
 * aliasul `@/…` — rezolvat de webpack la build-ul Next.js, dar necunoscut
 * de ts-node, care nu citește `paths` din tsconfig. Niciun alt script din
 * `yarn test` n-a avut nevoie să-l traverseze până acum. Fără o dependință
 * nouă (o dependință nouă intră în allowlist-ul din legea 4, mai jos, și n-ar
 * mai fi lista de azi), rescriem local cererile `@/…` către rădăcina
 * repo-ului, înainte de a cere `DICE_CUBES` — exact ce ar face
 * `tsconfig-paths/register`, scris la mână, ca să nu-l adăugăm.
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

import { DICE_CUBES } from "../app/tipareste/dice";

// --- Legea 1: cartonașul de reguli, literă cu literă (rules.ts) -----------

test("cartonasul de reguli: textul e cel aprobat, litera cu litera (ADR-044)", () => {
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

test("zarurile: trei cuburi, sase cuvinte fara dubluri, toate existente in storyDice (ADR-044)", () => {
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

// --- Legea 3: foreground-only — nimic nu se sprijină pe fundal colorat ----

/**
 * Clasele Tailwind admise sub app/tipareste/**: „transparent" (nu vopsește
 * nimic) și „alb" (culoarea hârtiei — la tipar cu „background graphics"
 * stins nu se pierde nimic, fiindcă hârtia e deja albă). Orice alt „bg-" —
 * o culoare, un gradient, un blend, o valoare arbitrară („bg-[...]") — pică,
 * pe hârtia trimisă fără fundaluri, drept spațiu gol.
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

/** Comentariile scot din calcul mențiunile documentare, nu clasele reale — la fel ca în check-naming.ts. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

/** Cele două forme ale proprietății CSS: cu liniuțe, sau camelCase în `style={{ }}`. */
const PRINT_COLOR_ADJUST = /print-?color-?adjust/i;

function backgroundViolations(file: string, source: string): string[] {
  const code = stripComments(source);
  const problems: string[] = [];
  for (const match of code.matchAll(BG_CLASS)) {
    const cls = match[1] as string;
    if (!ALLOWED_BG.has(cls)) {
      problems.push(`${ADR}: ${file} foloseste clasa de fundal "${cls}"`);
    }
  }
  if (PRINT_COLOR_ADJUST.test(code)) {
    problems.push(
      `${ADR}: ${file} seteaza print-color-adjust — regula e foreground-only, nu repornirea fundalurilor`
    );
  }
  return problems;
}

test("foreground-only: niciun fisier din app/tipareste/** nu se sprijina pe fundal colorat (ADR-044)", () => {
  const problems: string[] = [];
  for (const file of walk(PRINT_DIR, (name) => /\.tsx?$/.test(name))) {
    const rel = relative(REPO_ROOT, file);
    problems.push(...backgroundViolations(rel, readFileSync(file, "utf8")));
  }
  assert.equal(problems.length, 0, problems.join("\n"));
});

// --- Legea 4: zero dependințe de PDF — albă-listă, nu neagră-listă --------

/**
 * Lista de azi, transcrisă din package.json — albă-listă, nu neagră-listă:
 * o neagră-listă de nume ("pdf", "puppeteer", "jspdf") ratează orice pachet
 * la care nimeni nu s-a gândit ("html-pdf-node" și tot restul). Un pachet nou
 * — de PDF sau de orice altceva — pică testul; se adaugă aici deliberat,
 * o dată cu package.json, nu doar acolo.
 */
const ALLOWED_DEPENDENCIES = ["classnames", "dotenv", "next", "react", "react-dom"];
const ALLOWED_DEV_DEPENDENCIES = [
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
];

test("dependinte: setul e exact cel de azi — fara PDF, fara nimic nou pe furis (ADR-044)", () => {
  assert.deepEqual(
    Object.keys(pkg.dependencies).sort(),
    [...ALLOWED_DEPENDENCIES].sort(),
    `${ADR}: dependencies nu mai e alba-lista de azi — actualizeaza ALLOWED_DEPENDENCIES deliberat`
  );
  assert.deepEqual(
    Object.keys(pkg.devDependencies).sort(),
    [...ALLOWED_DEV_DEPENDENCIES].sort(),
    `${ADR}: devDependencies nu mai e alba-lista de azi — actualizeaza ALLOWED_DEV_DEPENDENCIES deliberat`
  );
});
