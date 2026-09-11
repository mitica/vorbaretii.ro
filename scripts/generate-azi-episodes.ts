/**
 * Manivela episoadelor Vorbărici (ADR-047): un lot de zile, de la o ștampilă
 * încoace. Cartea fiecărei zile devine script, scriptul își adună feliile comise
 * — stingurile de marcă, punțile fixe ale ritualului, rostirile jocurilor — și
 * ffmpeg le lipește într-un episod.
 *
 *   yarn generate-azi-episodes --from <AAAA-LL-ZZ> --days <n>
 *
 * NICIUN apel API: tot ce se rostește e deja pe disc. O zi căreia îi lipsește o
 * rostire se SARE — și se spune ce lipsește și cu ce comandă se repară —, iar
 * rularea se încheie cu eroare: azi fondul de voce acoperă puține zile cu toate
 * cele patru rostiri, deci un lot mare sare majoritatea, iar un lot pe jumătate
 * care ar părea reușit e minciuna cea mai scumpă de aici.
 */
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { RITUAL, dateFromStamp } from "../app/azi/naming";
import {
  EPISODE_BITRATE,
  episodeFileName,
  episodePlan,
  missingInputs,
  repairCommand,
  type EpisodePlan,
  type MissingInput,
} from "./lib/azi-episode";
import { EPISODE_MASTER, renderSegments } from "./lib/episode";

const STAMP = /^\d{4}-\d{2}-\d{2}$/;
const USAGE = "folosire: yarn generate-azi-episodes --from <AAAA-LL-ZZ> --days <n>";

function parseArgs(): { from: string; days: number } {
  const args = process.argv.slice(2);
  // `indexOf` întoarce −1 pentru un steag absent, iar `args[0]` de-acolo ar citi
  // valoarea CELUILALT steag: lipsa se numește lipsă, nu se citește pe alături.
  const valueOf = (flag: string): string => {
    const at = args.indexOf(flag);
    return at < 0 ? "" : (args[at + 1] ?? "");
  };
  const from = valueOf("--from");
  const days = Number(valueOf("--days"));
  if (!STAMP.test(from)) throw new Error(`„${from}” nu e o ștampilă de zi — ${USAGE}`);
  if (!Number.isInteger(days) || days < 1)
    throw new Error(`„--days” cere un întreg ≥ 1 — ${USAGE}`);
  return { from, days };
}

/**
 * Ziua de peste `offset` zile, în calendar LOCAL. `setDate` face saltul peste
 * capătul lunii, iar getterii sunt tot cei locali: `dateFromStamp` construiește
 * data cu câmpuri locale, deci citită în UTC ar ieși cu o zi mai puțin în orice
 * fus pozitiv — adică altă carte pentru aceeași ștampilă (ADR-041).
 */
function stampAfter(from: string, offset: number): string {
  const date = dateFromStamp(from);
  date.setDate(date.getDate() + offset);
  const pad = (part: number): string => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Directorul zilei, redus la exact episodul cerut. Se mătură ÎNAINTE de scriere:
 * un episod rămas de la o voce veche ar face două fișiere într-o zi, iar
 * `readEpisodes` oprește build-ul pe loc — feed-ul n-ar ști pe care să-l servească.
 */
function sweepDay(dir: string, keep: string): void {
  for (const name of readdirSync(dir))
    if (name !== keep) {
      unlinkSync(join(dir, name));
      console.log(`  șters (episod vechi): ${name}`);
    }
}

/** Episodul zilei: măturat, apoi lipit dacă lipsește. Doar ffmpeg — nicio voce nu se cere aici. */
function writeDay(date: string, plan: EpisodePlan): void {
  const file = episodeFileName(plan.script, plan.inputs);
  const dir = join(process.cwd(), "public", RITUAL.audio, date);
  mkdirSync(dir, { recursive: true });
  sweepDay(dir, file);
  const out = join(dir, file);
  if (existsSync(out)) {
    console.log(`${date}: refolosit ${file}`);
    return;
  }
  renderSegments({
    segments: plan.script,
    inputs: plan.inputs,
    out,
    master: EPISODE_MASTER,
    bitRate: EPISODE_BITRATE,
  });
  console.log(`${date}: scris ${file} (${Math.round(statSync(out).size / 1024)}KB)`);
}

/** Raportul unei zile sărite: ce rostire lipsește, din ce joc, și comanda care o aduce. */
function reportSkipped(date: string, missing: readonly MissingInput[]): void {
  console.log(`${date}: SĂRIT — ${missing.length} rostiri lipsesc de pe disc:`);
  for (const item of missing)
    console.log(`  „${item.text}” (${item.game ?? "punte fixă"}) → ${repairCommand(item)}`);
}

function main(): void {
  const { from, days } = parseArgs();
  console.log(`episoade: ${days} zile, de la ${from}`);
  const skipped: string[] = [];
  for (let offset = 0; offset < days; offset++) {
    const date = stampAfter(from, offset);
    const plan = episodePlan(date, process.cwd());
    const missing = missingInputs(plan, existsSync);
    if (missing.length === 0) writeDay(date, plan);
    else {
      reportSkipped(date, missing);
      skipped.push(date);
    }
  }
  console.log(`generate ${days - skipped.length}, sărite ${skipped.length}`);
  if (skipped.length > 0)
    throw new Error(`ADR-047 — ${skipped.length} zile fără episod: ${skipped.join(", ")}`);
}

try {
  main();
} catch (error: unknown) {
  console.error(String(error));
  process.exit(1);
}
