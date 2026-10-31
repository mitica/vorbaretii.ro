/**
 * Manivela Vorbăreți Acasă: scrie următorul lot de săptămâni în
 * `app/acasa/weeks.json`. Zero apeluri plătite — alege doar din fondul care are
 * deja voce pe disc. Lotul ajunge la copii abia la merge.
 *
 *   yarn generate-acasa-weeks --from 2026-11-02 [--weeks 13] [--seed <text>] [--dry-run]
 *
 * `--from` = o zi de luni; cu registru gol, oricare, altfel exact lunea de după
 * ultima săptămână. Seed-ul implicit e `--from`: aceleași intrări, același lot.
 * Tipărește textele alese (pentru ochii operatorului în PR) și cât mai ține fondul.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { resolveWeek } from "../app/acasa/items";
import { WEEK_KINDS, type Week } from "../app/acasa/registry";
import { registryProblems, type Voiced } from "./lib/acasa-law";
import { diskVoiced } from "./lib/acasa-disk";
import { planWeeks, poolOf, type PlanInput } from "./lib/acasa-plan";

const REGISTRY = join(process.cwd(), "app", "acasa", "weeks.json");

type Args = { from: string; count: number; seed: string; dryRun: boolean };

function parseArgs(argv: readonly string[]): Args {
  const value = (flag: string): string | undefined => {
    const at = argv.indexOf(flag);
    return at >= 0 ? argv[at + 1] : undefined;
  };
  const from = value("--from");
  if (!from) throw new Error("lipsește --from <luni, AAAA-LL-ZZ>");
  return {
    from,
    count: Number(value("--weeks") ?? 13),
    seed: value("--seed") ?? from,
    dryRun: argv.includes("--dry-run"),
  };
}

/** Registrul de azi, care trebuie să treacă legea înainte să-l continuăm. */
function readRegistry(voiced: Voiced): Week[] {
  const registry = JSON.parse(readFileSync(REGISTRY, "utf8")) as Week[];
  const problems = registryProblems(registry, voiced);
  if (problems.length > 0) {
    throw new Error(`registrul de azi nu trece legea:\n  ${problems.join("\n  ")}`);
  }
  return registry;
}

function printLot(lot: readonly Week[]): void {
  for (const week of lot.map(resolveWeek)) {
    console.log(`\n${week.monday} (${week.label})`);
    for (const item of week.items) {
      console.log(`  ${item.emoji} ${item.prompt}`);
      if (item.reveal) console.log(`     → ${item.reveal.text}`);
    }
  }
}

function printHorizon(input: PlanInput): void {
  const left = WEEK_KINDS.map((kind) => `${kind} ${poolOf(kind, input).length}`);
  const last = input.registry[input.registry.length - 1];
  console.log(
    `\nRegistrul se termină la ${last?.monday ?? "—"}. Rămân cu voce: ${left.join(", ")}.`
  );
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const voiced = diskVoiced();
  const registry = readRegistry(voiced);
  const input: PlanInput = {
    registry,
    from: args.from,
    count: args.count,
    seed: args.seed,
    voiced,
  };
  const lot = planWeeks(input);
  printLot(lot);
  const all = [...registry, ...lot];
  printHorizon({ ...input, registry: all });
  if (args.dryRun) {
    console.log("\n--dry-run: nimic scris.");
    return;
  }
  writeFileSync(REGISTRY, JSON.stringify(all, null, 2) + "\n");
  console.log(`\nscris ${REGISTRY} (${lot.length} săptămâni noi, ${all.length} în total)`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
