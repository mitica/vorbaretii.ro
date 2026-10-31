/**
 * Legea Vorbăreți Acasă: registrul săptămânilor (`app/acasa/weeks.json`),
 * manivela care îl scrie pe loturi și linkul copiat pe grup.
 *
 * Registrele rele se fabrică AICI, din fondul real, cu vocea injectată: legea
 * se vede roșie fără niciun fișier pe disc. Registrul comis trece prin aceeași
 * lege, cu vocea de pe disc — mutul nu e acceptat pe /acasa, fiindcă pagina
 * promite vocea la fiecare element. Rulează cu `yarn test`.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hashId } from "../app/jocuri/content/ids";
import { VOICE_DIR, voiceKey } from "../app/jocuri/voice/settings";
import { ACASA, weekLink } from "../app/acasa/copy-week";
import { currentWeek, isMonday, mondayOf, nextMonday, weekLabel } from "../app/acasa/dates";
import { CORPUS, LOOK, currentUtterance, resolveWeek, utterancesOf } from "../app/acasa/items";
import { WEEK_KINDS, weeks, type Week, type WeekKind } from "../app/acasa/registry";
import { registryProblems, type Voiced } from "./lib/acasa-law";
import { diskVoiced } from "./lib/acasa-disk";
import { planWeeks, type PlanInput } from "./lib/acasa-plan";
import { walk } from "./lib/paths";

const allVoiced: Voiced = () => true;

/** Al `n`-lea element din fiecare corpus: o săptămână bună, fără disc. */
function weekAt(monday: string, n: number): Week {
  const pickId = (kind: WeekKind): string => (CORPUS[kind][n] as { id: string }).id;
  return {
    monday,
    riddle: pickId("riddle"),
    wheel: pickId("wheel"),
    twister: pickId("twister"),
    proverb: pickId("proverb"),
  };
}

const GOOD: Week[] = [weekAt("2026-11-02", 0), weekAt("2026-11-09", 1)];

/** Măcar o problemă, iar fiecare problemă numește ce cerem (săptămâna, id-ul). */
function assertRejected(registry: readonly unknown[], mentions: string[], voiced = allVoiced) {
  const problems = registryProblems(registry, voiced);
  assert.ok(problems.length > 0, `registrul trebuia respins: ${JSON.stringify(registry)}`);
  const all = problems.join("\n");
  for (const text of mentions) assert.ok(all.includes(text), `lipsește „${text}” din:\n${all}`);
}

/* ------------------------------------------------------------- calendarul */

test("calendarul: lunea, eticheta, lunea locală", () => {
  assert.equal(isMonday("2026-11-02"), true);
  assert.equal(isMonday("2026-11-03"), false);
  assert.equal(isMonday("2026-02-30"), false, "o dată care nu există nu e luni");
  assert.equal(isMonday("2026-11-2"), false);
  assert.equal(nextMonday("2026-12-28"), "2027-01-04");
  assert.equal(weekLabel("2026-11-02"), "2–8 noiembrie");
  assert.equal(weekLabel("2026-11-30"), "30 noiembrie – 6 decembrie");
  assert.equal(weekLabel("2026-12-28"), "28 decembrie – 3 ianuarie");
  assert.equal(mondayOf(new Date(2026, 10, 2)), "2026-11-02", "luni e lunea ei");
  assert.equal(mondayOf(new Date(2026, 10, 8, 23, 59)), "2026-11-02", "duminică noaptea");
  assert.equal(mondayOf(new Date(2026, 10, 9, 0, 1)), "2026-11-09", "luni dimineața");
});

test("săptămâna curentă: găsită; înainte de prima, fără link; după ultima, ultima trecută", () => {
  const list = [{ monday: "2026-11-02" }, { monday: "2026-11-09" }, { monday: "2026-11-16" }];
  assert.deepEqual(currentWeek(list, "2026-11-09"), { week: list[1], previous: list[0] });
  assert.deepEqual(currentWeek(list, "2026-10-26"), { week: null, previous: null });
  assert.deepEqual(currentWeek(list, "2026-12-07"), { week: null, previous: list[2] });
  assert.deepEqual(currentWeek([], "2026-11-09"), { week: null, previous: null });
});

/* ----------------------------------------------------------- legea registrului */

test("legea: registrul gol e valid; un registru bun trece", () => {
  assert.deepEqual(registryProblems([], allVoiced), []);
  assert.deepEqual(registryProblems(GOOD, allVoiced), []);
});

test("legea: o zi care nu e luni e respinsă", () => {
  assertRejected([weekAt("2026-11-03", 0)], ["2026-11-03"]);
});

test("legea: o gaură sau o ordine greșită e respinsă", () => {
  assertRejected([weekAt("2026-11-02", 0), weekAt("2026-11-16", 1)], ["2026-11-16"]);
  assertRejected([weekAt("2026-11-09", 0), weekAt("2026-11-02", 1)], ["2026-11-02"]);
});

test("legea: un id repetat în registru e respins, pe fiecare tip, cu săptămâna și id-ul", () => {
  const first = GOOD[0] as Week;
  for (const kind of WEEK_KINDS) {
    const repeat = { ...weekAt("2026-11-09", 1), [kind]: first[kind] };
    assertRejected([first, repeat], ["2026-11-09", first[kind], kind]);
  }
});

test("legea: un id care nu e în fond e respins, cu săptămâna și id-ul", () => {
  assertRejected([{ ...weekAt("2026-11-02", 0), riddle: "nuexista" }], ["2026-11-02", "nuexista"]);
});

test("legea: exact câte unul din cele patru tipuri", () => {
  const { proverb, ...missing } = weekAt("2026-11-02", 0);
  assert.ok(proverb);
  assertRejected([missing], ["2026-11-02", "proverb"]);
  assertRejected([{ ...weekAt("2026-11-02", 0), tabu: "x" }], ["2026-11-02", "tabu"]);
  assertRejected([{ ...weekAt("2026-11-02", 0), wheel: 7 }], ["2026-11-02", "wheel"]);
});

test("legea: textul principal fără voce e respins, pe fiecare tip, cu săptămâna și id-ul", () => {
  const week = weekAt("2026-11-02", 0);
  for (const kind of WEEK_KINDS) {
    const prompt = (CORPUS[kind][0] as { prompt: string }).prompt;
    const mutePrompt: Voiced = (_slug, text) => text !== prompt;
    assertRejected([week], ["2026-11-02", week[kind], kind], mutePrompt);
  }
});

test("legea: o rostire lipsă (înțelesul proverbului) e respinsă, cu săptămâna și id-ul", () => {
  const week = weekAt("2026-11-02", 0);
  const meaning = (CORPUS.proverb[0] as { reveal: string }).reveal;
  const muteMeaning: Voiced = (_slug, text) => text !== meaning;
  assertRejected([week], ["2026-11-02", week.proverb], muteMeaning);
  const answer = (CORPUS.riddle[0] as { reveal: string }).reveal;
  const muteAnswer: Voiced = (_slug, text) => text !== answer;
  assertRejected([week], ["2026-11-02", week.riddle], muteAnswer);
});

test("legea: registrul comis trece, cu vocea de pe disc", () => {
  assert.deepEqual(registryProblems(weeks, diskVoiced()), []);
});

/* ---------------------------------------------------------------- manivela */

const PLAN: PlanInput = {
  registry: [],
  from: "2026-11-02",
  count: 4,
  seed: "2026-11-02",
  voiced: allVoiced,
};

test("manivela: refuză o zi care nu e luni", () => {
  assert.throws(() => planWeeks({ ...PLAN, from: "2026-11-03" }), /2026-11-03.*luni/);
});

test("manivela: refuză un --from care nu continuă registrul", () => {
  assert.throws(() => planWeeks({ ...PLAN, registry: GOOD, from: "2026-11-23" }), /2026-11-16/);
  assert.throws(() => planWeeks({ ...PLAN, registry: GOOD, from: "2026-11-02" }), /2026-11-16/);
  assert.equal(planWeeks({ ...PLAN, registry: GOOD, from: "2026-11-16" }).length, 4);
});

test("manivela: determinism — aceleași intrări, același lot; alt seed, alt lot", () => {
  const first = planWeeks(PLAN);
  assert.deepEqual(planWeeks({ ...PLAN }), first);
  assert.notDeepEqual(planWeeks({ ...PLAN, seed: "altceva" }), first);
  assert.deepEqual(
    first.map((week) => week.monday),
    ["2026-11-02", "2026-11-09", "2026-11-16", "2026-11-23"]
  );
});

test("manivela: lotul respectă legea, fără repetare față de registru", () => {
  const lot = planWeeks({ ...PLAN, registry: GOOD, from: "2026-11-16", count: 10 });
  assert.deepEqual(registryProblems([...GOOD, ...lot], allVoiced), []);
});

test("manivela: alege doar elemente cu voce", () => {
  const mute = new Set(CORPUS.riddle.slice(0, 80).map((entry) => entry.reveal));
  const voiced: Voiced = (_slug, text) => !mute.has(text);
  const lot = planWeeks({ ...PLAN, count: 10, voiced });
  const allowed = new Set(CORPUS.riddle.slice(80).map((entry) => entry.id));
  for (const week of lot) assert.ok(allowed.has(week.riddle), `ghicitoare mută: ${week.riddle}`);
});

test("manivela: fond insuficient → oprire cu mesaj pe tip, nu repetare", () => {
  const twoProverbs = new Set(
    CORPUS.proverb.slice(0, 2).flatMap((entry) => [entry.prompt, entry.reveal])
  );
  const voiced: Voiced = (slug, text) => slug !== LOOK.proverb.slug || twoProverbs.has(text);
  assert.throws(() => planWeeks({ ...PLAN, count: 3, voiced }), /proverb: rămân 2.*3/);
  const greedy = { ...PLAN, count: CORPUS.proverb.length + 1 };
  assert.throws(() => planWeeks(greedy), new RegExp(`proverb: rămân ${CORPUS.proverb.length}`));
});

/** Rădăcina repo-ului, prinsă înainte ca manivela să ruleze în rădăcini fabricate. */
const REPO_DIR = process.cwd();

/** Rădăcină fabricată: registrul gol și câte un mp3 (gol) pentru fiecare rostire a fondului. */
function fabricateRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "acasa-"));
  mkdirSync(join(root, "app", "acasa"), { recursive: true });
  writeFileSync(join(root, "app", "acasa", "weeks.json"), "[]\n");
  for (const kind of WEEK_KINDS) {
    const { slug } = LOOK[kind];
    const dir = join(root, VOICE_DIR, slug, voiceKey(slug));
    mkdirSync(dir, { recursive: true });
    for (const entry of CORPUS[kind]) {
      for (const text of utterancesOf(entry)) writeFileSync(join(dir, `${hashId(text)}.mp3`), "");
    }
  }
  return root;
}

function runCrank(root: string, args: string[]): { status: number; output: string } {
  const run = spawnSync(
    join(REPO_DIR, "node_modules/.bin/ts-node"),
    [
      "--project",
      join(REPO_DIR, "tsconfig.base.json"),
      join(REPO_DIR, "scripts/generate-acasa-weeks.ts"),
      ...args,
    ],
    { cwd: root, encoding: "utf8" }
  );
  return { status: run.status ?? -1, output: `${run.stdout ?? ""}${run.stderr ?? ""}` };
}

test("manivela, ca proces: același seed → același weeks.json, formatat; refuzurile", () => {
  const root = fabricateRoot();
  try {
    crankChecks(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

/** Proba manivelei într-o rădăcină fabricată: lotul, determinismul, refuzurile, formatul. */
function crankChecks(root: string): void {
  const registry = join(root, "app", "acasa", "weeks.json");
  const lot = ["--from", "2026-11-02", "--weeks", "4"];
  const first = runCrank(root, lot);
  assert.equal(first.status, 0, first.output);
  const written = readFileSync(registry, "utf8");
  writeFileSync(registry, "[]\n");
  assert.equal(runCrank(root, lot).status, 0);
  assert.equal(readFileSync(registry, "utf8"), written, "a doua rulare a dat alt registru");
  const parsed = JSON.parse(written) as Week[];
  assert.deepEqual(registryProblems(parsed, allVoiced), []);
  assert.equal(parsed.length, 4);
  for (const week of parsed) assert.ok(first.output.includes(week.monday), "textele tipărite");

  const dry = runCrank(root, ["--from", "2026-11-30", "--weeks", "2", "--dry-run"]);
  assert.equal(dry.status, 0, dry.output);
  assert.equal(readFileSync(registry, "utf8"), written, "--dry-run n-are voie să scrie");

  const gap = runCrank(root, ["--from", "2026-12-07"]);
  assert.notEqual(gap.status, 0);
  assert.match(gap.output, /nu continuă registrul.*2026-11-30/);
  const tuesday = runCrank(root, ["--from", "2026-12-01"]);
  assert.notEqual(tuesday.status, 0);
  assert.match(tuesday.output, /nu e o zi de luni/);
  assert.equal(readFileSync(registry, "utf8"), written, "un refuz n-are voie să scrie");

  const prettier = spawnSync(
    join(REPO_DIR, "node_modules/.bin/prettier"),
    ["--config", join(REPO_DIR, ".prettierrc"), "--check", registry],
    { encoding: "utf8" }
  );
  assert.equal(
    prettier.status,
    0,
    `weeks.json nu trece prettier: ${prettier.stdout}${prettier.stderr}`
  );
}

/* ------------------------------------------------------------- linkul copiat */

test("linkul copiat: exact URL-ul săptămânii afișate, nimic altceva", () => {
  assert.equal(weekLink("2026-11-02"), "vorbaretii.ro/acasa/2026-11-02");
  for (const week of weeks)
    assert.equal(weekLink(week.monday), `vorbaretii.ro/acasa/${week.monday}`);
});

test("ordinea celor patru: ghicitoare, roată, frământare, proverb", () => {
  assert.deepEqual(
    resolveWeek(weekAt("2026-11-02", 0)).items.map((item) => item.emoji),
    ["🔮", "🎡", "👅", "🧩"]
  );
});

test("vocea citește ce e pe tablă acum: textul, apoi doar răspunsul / înțelesul", () => {
  const items = resolveWeek(weekAt("2026-11-02", 0)).items;
  for (const item of items) {
    assert.equal(currentUtterance(item, false), item.prompt, `${item.kind}, nedezvăluit`);
    const after = item.reveal ? item.reveal.text : item.prompt;
    assert.equal(currentUtterance(item, true), after, `${item.kind}, dezvăluit`);
  }
});

test("nimic salvat: app/acasa nu atinge localStorage / sessionStorage", () => {
  for (const file of walk(join(process.cwd(), "app", "acasa"))) {
    const source = readFileSync(file, "utf8");
    assert.ok(
      !/localStorage|sessionStorage/.test(source),
      `${file} pomenește stocarea browserului`
    );
  }
});

test("vocabularul: nimic de școală în app/acasa", () => {
  const forbidden = /lecți|practic|tem[ăa] |curs|exers|de lucrat|de făcut/i;
  for (const file of walk(join(process.cwd(), "app", "acasa"))) {
    const source = readFileSync(file, "utf8");
    assert.ok(!forbidden.test(source), `${file}: ${forbidden.exec(source)?.[0]}`);
  }
  assert.ok(!forbidden.test(Object.values(ACASA).join(" ")));
});
