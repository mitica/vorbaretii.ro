/**
 * Legea numelor (ADR-021 în harness-ul privat): numele de fișiere, foldere și
 * identificatorii sunt în ENGLEZĂ; româna rămâne în valori (conținut, texte
 * afișate, comentarii). Verificare euristică, dar mecanică: diacritice sau
 * cuvinte românești în nume de fișier/folder ori în declarații.
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
const SCANNED = ["app", "lib", "scripts"];
/** Segmentele de rută sub app/ sunt URL-uri (valori), nu identificatori. */
const ROUTE_DIRS = new Set(["jocuri", "articole", "ads"]);
const DIACRITICS = /[ăâîșțĂÂÎȘȚ]/;
const ROMANIAN = new Set(
  `setari setare rostire rostiri voce lege legea cheie cheia chei fisier fisiere buget viteza
   apel matura doar tot genereaza verifica citeste sintetizeaza argumente optiuni porneste
   spune reactie disponibile curent curenta mascota gaita stare stari liniste salut vorbeste
   bucurie gandeste aripa aripi cioc ochi pleoape sprancene pupila lucire creasta laba corp
   burta petec mustata narator personaj ghicitori ghicitoare proverbe anagrame memorie zaruri
   categorii framantari ascuns vinde altfel roata curiozitati felie felii integrala aliniere
   sterge articol articole intrebare intrebari raspuns raspunsuri imagine imagini titlu
   sursa surse poveste proba nume numar lista pagina sectiune continut`
    .split(/\s+/)
    .filter(Boolean)
);
const DECLARATION = /\b(?:const|let|var|function|type|interface|class|enum)\s+([A-Za-z_$][\w$]*)/g;

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

function* files(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* files(full);
    else yield full;
  }
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

function checkDeclarations(file: string, problems: Map<string, string[]>): void {
  if (!/\.(ts|tsx|mjs|js)$/.test(file)) return;
  const rel = relative(ROOT, file);
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(DECLARATION)) {
    const bad = offending(match[1]!);
    if (bad)
      problems.set(rel, [...(problems.get(rel) ?? []), `identificatorul „${match[1]}”: ${bad}`]);
  }
}

function main(): void {
  const baseline = new Set(
    JSON.parse(readFileSync(join(ROOT, "scripts/naming-baseline.json"), "utf8")) as string[]
  );
  const problems = new Map<string, string[]>();
  for (const dir of SCANNED)
    for (const file of files(join(ROOT, dir))) {
      checkPath(file, problems);
      checkDeclarations(file, problems);
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
