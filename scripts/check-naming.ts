/**
 * Legea numelor (ADR-021 în harness-ul privat): numele de fișiere, foldere și
 * identificatorii — declarații, parametri, proprietăți — sunt în ENGLEZĂ; româna
 * rămâne în valori (conținut, texte afișate, comentarii). Verificare EURISTICĂ,
 * dar mecanică: diacritice sau cuvinte românești din lista de mai jos, în nume
 * de fișier/folder ori în cod cu șirurile și comentariile scoase. Lista nu e
 * limba română întreagă — un cuvânt care scapă se adaugă aici când e văzut.
 *
 *   yarn naming            (rulat de `yarn lint`)
 *
 * Codul adoptat își poartă încălcările vechi în `scripts/naming-baseline.json`
 * (rules/quality: baseline-ul doar scade — o intrare care nu mai încalcă
 * nimic trebuie ștearsă din baseline).
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SCANNED_DIRS = ["app", "lib", "scripts"];
/** Segmentele de rută sub app/ sunt URL-uri (valori), nu identificatori. */
const ROUTE_DIRS = new Set(["jocuri", "articole", "ads"]);
const CODE = /\.(ts|tsx|mjs|js)$/;
const DIACRITICS = /[ăâîșțĂÂÎȘȚ]/;
const ROMANIAN = new Set(
  `setari setare rostire rostiri rostit rostita voce lege legea cheie cheia chei fisier fisiere
   fisierul buget viteza apel matura doar tot genereaza verifica citeste sintetizeaza argumente
   optiuni porneste spune reactie disponibile disponibil curent curenta curente mascota gaita stare
   stari liniste salut vorbeste bucurie gandeste aripa aripi cioc ochi pleoape sprancene pupila
   lucire creasta laba corp burta petec mustata narator personaj ghicitori ghicitoare proverbe
   anagrame memorie zaruri categorii framantari ascuns vinde altfel roata curiozitati felie felii
   integrala aliniere sterge articol articole intrebare intrebari intrebarea raspuns raspunsuri
   raspunsul imagine imagini titlu sursa surse poveste proba nume numar lista pagina sectiune
   continut baza sufix parti parte fond unde detaliu deschis inchis repaus scris citit gol goala
   plin plina vechi veche nou noua primul prima ultimul ultima urmator urmatoarea acelasi aceeasi
   fara pentru dupa inainte directorul jocul jocului textul`
    .split(/\s+/)
    .filter(Boolean)
);
const DECLARATION = /\b(?:const|let|var|function|type|interface|class|enum)\s+([A-Za-z_$][\w$]*)/g;
/** Chei de proprietate și parametri: `nume:` / `(nume,` / `{ nume }` — pe codul fără șiruri. */
const KEY = /(?<![\w$.])([A-Za-z_$][\w$]*)\s*(?=:(?!:))/g;
const PARAM = /(?<=[(,{]\s*)([A-Za-z_$][\w$]*)(?=\s*[,)}=:])/g;

function tokens(name: string): string[] {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^A-Za-zăâîșțĂÂÎȘȚ]+/)
    .filter(Boolean)
    .map((t) => t.toLowerCase());
}

function offending(name: string): string | null {
  if (DIACRITICS.test(name)) return "diacritice";
  const hit = tokens(name).find((t) => ROMANIAN.has(t));
  return hit ? `„${hit}”` : null;
}

/** Scoate șirurile, template-urile și comentariile — valorile nu sunt identificatori. */
function stripLiterals(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:\\])\/\/.*$/gm, "$1")
    .replace(/`(?:\\[\s\S]|[^`\\])*`/g, "``")
    .replace(/"(?:\\.|[^"\\\n])*"/g, '""')
    .replace(/'(?:\\.|[^'\\\n])*'/g, "''");
}

function* files(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* files(full);
    else yield full;
  }
}

function targets(): string[] {
  const rootFiles = readdirSync(ROOT)
    .filter((f) => CODE.test(f) && statSync(join(ROOT, f)).isFile())
    .map((f) => join(ROOT, f));
  return [...rootFiles, ...SCANNED_DIRS.flatMap((dir) => [...files(join(ROOT, dir))])];
}

function checkPath(file: string, problems: Map<string, string[]>): void {
  const rel = relative(ROOT, file);
  const parts = rel.split("/");
  for (const [i, part] of parts.entries()) {
    if (i === 1 && parts[0] === "app" && ROUTE_DIRS.has(part)) continue;
    const bad = offending(part.replace(/\.[^.]+$/, ""));
    if (bad) problems.set(rel, [...(problems.get(rel) ?? []), `numele „${part}”: ${bad}`]);
  }
}

function checkCode(file: string, problems: Map<string, string[]>): void {
  if (!CODE.test(file)) return;
  const rel = relative(ROOT, file);
  const code = stripLiterals(readFileSync(file, "utf8"));
  const seen = new Set<string>();
  for (const regex of [DECLARATION, KEY, PARAM])
    for (const match of code.matchAll(regex)) {
      const name = match[1]!;
      const bad = offending(name);
      if (!bad || seen.has(name)) continue;
      seen.add(name);
      problems.set(rel, [...(problems.get(rel) ?? []), `identificatorul „${name}”: ${bad}`]);
    }
}

function main(): void {
  const baseline = new Set(
    JSON.parse(readFileSync(join(ROOT, "scripts/naming-baseline.json"), "utf8")) as string[]
  );
  const problems = new Map<string, string[]>();
  for (const file of targets()) {
    checkPath(file, problems);
    checkCode(file, problems);
  }
  const fresh = [...problems].filter(([rel]) => !baseline.has(rel));
  const stale = [...baseline].filter((rel) => !problems.has(rel));
  for (const [rel, list] of fresh) console.error(`ADR-021 — ${rel}\n  ${list.join("\n  ")}`);
  for (const rel of stale)
    console.error(
      `ADR-021 — baseline învechit: „${rel}” nu mai încalcă nimic — șterge-l din naming-baseline.json`
    );
  if (fresh.length > 0 || stale.length > 0) {
    console.error(
      `\nADR-021: numele de fișiere, foldere și identificatori sunt în engleză; româna stă în valori.`
    );
    process.exit(1);
  }
  console.log(`naming: curat (${baseline.size} fișiere în baseline)`);
}

main();
