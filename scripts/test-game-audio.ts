/**
 * Legea vocii jocurilor (ADR-043, succesoarea ADR-020): fiecare joc cu voce
 * poartă audio-ul textelor ei curente, într-o singură key de voce; orfanii nu
 * se servesc; fiecare fișier ține bugetul. NOU (ADR-043): rostirea fără
 * fișier e legală — element mut — pentru ORICE joc, nu doar curiozitățile.
 * Jocurile fără dir trec — vocea e opt-in per joc, ca audio-ul per articol.
 *
 * Nucleul e pur (`checkVoice`) și se vede roșu pe fixturi; apoi rulează pe
 * discul real. `availableUtterances` (mulțimea servită paginii la build) are
 * propriile fixturi, pe disc temporar.
 *
 * `canSpeakFor` (butonul Gaiței) e altă poveste: importă `context.tsx`, care
 * folosește tipuri DOM (`Audio`, `window`) fără să le RULEZE la import — dar
 * tipurile trebuie să existe pentru verificarea de tipuri a lui ts-node.
 * `lib="dom"` de mai jos aduce lib.dom.d.ts în tot programul (nu doar în
 * acest fișier); tsconfig.base.json (folosit de `yarn test`) nu-l are.
 */
/// <reference lib="dom" />

import assert from "node:assert/strict";
import test from "node:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  FILE_BUDGET,
  VOICE_DIR,
  VOICED_GAMES,
  audioPath,
  voiceKey,
} from "../app/jocuri/voice/settings";
import { gameUtterances } from "../app/jocuri/voice/utterances";
import { availableUtterances } from "../app/jocuri/voice/available";
import { hashId } from "../app/jocuri/content/ids";
import { canSpeakFor } from "../app/jocuri/voice/context";
import { readVoiceDir, checkVoice, type VoiceDir } from "./lib/voice-law";

const KEY = "key-current";
const A = hashId("Am un butoiaș cu două feluri de vin.");
const B = hashId("Oul");

function dir(files: { name: string; bytes?: number }[], keys = [KEY]): VoiceDir {
  return { keys, files: files.map((f) => ({ name: f.name, bytes: f.bytes ?? 30_000 })) };
}

test("ADR-043: set exact → verde; dir absent → verde (opt-in per joc)", () => {
  const ok = checkVoice({
    slug: "ghicitori",
    expected: [A, B],
    key: KEY,
    dir: dir([{ name: `${A}.mp3` }, { name: `${B}.mp3` }]),
  });
  assert.deepEqual(ok, []);
  assert.deepEqual(
    checkVoice({
      slug: "ghicitori",
      expected: [A],
      key: KEY,
      dir: null,
    }),
    []
  );
});

test("ADR-043: orphan → roșu; rostirea fără fișier e legală, pentru orice joc (element mut)", () => {
  const orphan = checkVoice({
    slug: "ghicitori",
    expected: [A],
    key: KEY,
    dir: dir([{ name: `${A}.mp3` }, { name: "zzz.mp3" }]),
  });
  assert.equal(orphan.length, 1);
  assert.match(orphan[0]!, /ADR-043/);
  assert.match(orphan[0]!, /orphan/);
  assert.match(orphan[0]!, /voce-jocuri ghicitori/);
  // ADR-043: un joc „normal" (nu doar curiozitățile) tolerează lipsa —
  // elementul rămâne mut, nu roșu.
  const missing = checkVoice({
    slug: "ghicitori",
    expected: [A, B],
    key: KEY,
    dir: dir([{ name: `${A}.mp3` }]),
  });
  assert.deepEqual(missing, []);
});

test("ADR-043: a doua key pe disc → roșu; fișier peste buget → roșu", () => {
  const oldKey = checkVoice({
    slug: "ghicitori",
    expected: [A],
    key: KEY,
    dir: dir([{ name: `${A}.mp3` }], [KEY, "key-veche"]),
  });
  assert.equal(oldKey.length, 1);
  assert.match(oldKey[0]!, /ADR-043/);
  assert.match(oldKey[0]!, /key-veche/);
  const heavy = checkVoice({
    slug: "ghicitori",
    expected: [A],
    key: KEY,
    dir: dir([{ name: `${A}.mp3`, bytes: FILE_BUDGET + 1 }]),
  });
  assert.equal(heavy.length, 1);
  assert.match(heavy[0]!, /ADR-043/);
  assert.match(heavy[0]!, /buget/);
});

test("ADR-043: rostirile fiecărui joc cu voce sunt nevide, fără dubluri, fără text gol", () => {
  for (const slug of Object.keys(VOICED_GAMES)) {
    const utterances = gameUtterances(slug);
    if (slug === "curiozitati" && utterances.length === 0) continue; // corpus gol = stare legală
    assert.ok(utterances.length > 0, `ADR-043 — ${slug}: niciun text de rostit`);
    assert.equal(
      new Set(utterances).size,
      utterances.length,
      `ADR-043 — ${slug}: utterances duplicate`
    );
    for (const r of utterances)
      assert.ok(r.trim().length > 0, `ADR-043 — ${slug}: utterance goală`);
    const hashes = utterances.map(hashId);
    assert.equal(
      new Set(hashes).size,
      hashes.length,
      `ADR-043 — ${slug}: două rostiri cu același hash`
    );
  }
});

test("ADR-043: URL-ul servit și directorul de pe disc sunt același loc", () => {
  const url = audioPath("ghicitori", "Oul");
  assert.ok(
    url.startsWith("/assets/audio/jocuri/ghicitori/"),
    "ADR-043 — URL-ul nu e sub /assets/audio/jocuri"
  );
  assert.ok(
    VOICE_DIR.endsWith("public/assets/audio/jocuri"),
    "ADR-043 — directorul nu e sub public/assets/audio/jocuri"
  );
});

test("ADR-043: citirea discului vede cheile și fișierele cheii cerute", () => {
  const root = mkdtempSync(join(tmpdir(), "voce-"));
  const slug = "proba-disc";
  mkdirSync(join(root, VOICE_DIR, slug, "cheie-noua"), { recursive: true });
  mkdirSync(join(root, VOICE_DIR, slug, "cheie-veche"), { recursive: true });
  writeFileSync(join(root, VOICE_DIR, slug, "cheie-noua", `${A}.mp3`), Buffer.alloc(10));
  const before = process.cwd();
  process.chdir(root);
  try {
    assert.equal(readVoiceDir("altul"), null, "fără director = null");
    const dir = readVoiceDir(slug, "cheie-noua");
    assert.deepEqual(dir?.keys.sort(), ["cheie-noua", "cheie-veche"]);
    assert.deepEqual(dir?.files, [{ name: `${A}.mp3`, bytes: 10 }]);
  } finally {
    process.chdir(before);
    rmSync(root, { recursive: true, force: true });
  }
});

test("ADR-043: discul real — niciun joc cu voce n-are orfan sau key veche", () => {
  const problems: string[] = [];
  for (const slug of Object.keys(VOICED_GAMES)) {
    problems.push(
      ...checkVoice({
        slug,
        expected: gameUtterances(slug).map(hashId),
        key: voiceKey(slug),
        dir: readVoiceDir(slug, voiceKey(slug)),
      })
    );
  }
  assert.deepEqual(problems, []);
});

test("ADR-043: availableUtterances — fișierul de pe disc intră în mulțime, cel lipsă nu", () => {
  const root = mkdtempSync(join(tmpdir(), "voce-disponibile-"));
  const slug = "proba-disponibile";
  const keyDir = join(root, VOICE_DIR, slug, voiceKey(slug));
  mkdirSync(keyDir, { recursive: true });
  writeFileSync(join(keyDir, `${A}.mp3`), Buffer.alloc(10));
  const before = process.cwd();
  process.chdir(root);
  try {
    const available = availableUtterances(slug);
    assert.deepEqual([...available], [A]);
    assert.equal(available.has(B), false, "ADR-043 — rostirea fără fișier nu intră în mulțime");
  } finally {
    process.chdir(before);
    rmSync(root, { recursive: true, force: true });
  }
});

test("ADR-043: availableUtterances — joc fără director → mulțime goală", () => {
  const root = mkdtempSync(join(tmpdir(), "voce-disponibile-"));
  const before = process.cwd();
  process.chdir(root);
  try {
    assert.deepEqual([...availableUtterances("altul")], []);
  } finally {
    process.chdir(before);
    rmSync(root, { recursive: true, force: true });
  }
});

/* -------------------------------------- canSpeak (proba prin execuție) */

// `renderToStaticMarkup` nu rulează `useEffect`; rostirea curentă rămâne
// `null` pe server, deci ramura „poate vorbi" a butonului n-are cum să se
// vadă printr-un randare SSR în șir de caractere. Un harness DOM real e o
// decizie separată, cu dependențe noi — nu aici. `canSpeakFor` e nucleul PUR
// al legii (ADR-043): se probă prin execuție directă, ca `checkVoice` mai
// sus; cablarea lui până la buton se probă mai jos, prin sursă.
test("ADR-043: canSpeakFor — legea butonului, probată prin execuție", () => {
  const utterance = "Oul";
  const hash = hashId(utterance);
  assert.equal(
    canSpeakFor(new Set([hash]), utterance),
    true,
    "ADR-043 — hash prezent în mulțime, butonul ar trebui să poată vorbi"
  );
  assert.equal(
    canSpeakFor(new Set(["altceva"]), utterance),
    false,
    "ADR-043 — hash absent din mulțime, butonul nu poate vorbi"
  );
  assert.equal(
    canSpeakFor(new Set(), utterance),
    false,
    "ADR-043 — mulțime goală, butonul nu poate vorbi"
  );
  assert.equal(
    canSpeakFor(new Set([hash]), null),
    false,
    "ADR-043 — fără rostire curentă, butonul nu poate vorbi"
  );
});

/* ------------------------------------------- prezența (aserțiuni pe sursă) */

const COMPONENTS = join(process.cwd(), "app/jocuri/components");
const VOICE = join(process.cwd(), "app/jocuri/voice");
const VOICED = [
  "riddles-game",
  "wheel-game",
  "story-questions-game",
  "proverbs-game",
  "tongue-twisters-game",
  "categories-game",
  "taboo-game",
  "sell-it-game",
];
const VOICELESS = [
  "anagrams-game",
  "hidden-word-game",
  "emoji-rebus-game",
  "memory-game",
  "story-dice-game",
];

test("ADR-043: nimic la încărcare — elementul audio se creează la prima atingere, fără preload/autoPlay", () => {
  const context = readFileSync(join(VOICE, "context.tsx"), "utf8");
  const button = readFileSync(join(VOICE, "mascot-voice.tsx"), "utf8");
  for (const source of [context, button]) {
    assert.ok(!/autoPlay|preload/.test(source), "ADR-043 — preload/autoPlay în componentele vocii");
  }
  assert.equal(
    context.match(/new Audio\(/g)?.length,
    1,
    "ADR-043 — exact un `new Audio(`, în deblocare"
  );
  const unlock = context.slice(
    context.indexOf("const unlock"),
    context.indexOf("useEffect(() => {\n    window.addEventListener")
  );
  assert.ok(unlock.includes("new Audio("), "ADR-043 — `new Audio(` trăiește în `unlock`");
  assert.ok(
    context.includes('"pointerdown", unlock, { once: true'),
    "ADR-043 — deblocarea e legată de prima atingere"
  );
  assert.ok(
    context.includes("loadJson<unknown>(SETTING_KEY, true)"),
    "ADR-043 — vocea e pornită implicit, setarea în memoria locală"
  );
  assert.ok(
    context.includes('typeof stored === "boolean"'),
    "ADR-043 — setarea citită din memoria locală se coerce, nu se crede pe cuvânt"
  );
});

test("ADR-043: butonul e cablat la legea testată — canSpeak vine din canSpeakFor, nu dintr-o condiție paralelă", () => {
  const context = readFileSync(join(VOICE, "context.tsx"), "utf8");
  const button = readFileSync(join(VOICE, "mascot-voice.tsx"), "utf8");
  assert.ok(
    button.includes("disabled={!voice.canSpeak}"),
    "ADR-043 — butonul nu se dezactivează pe canSpeak"
  );
  const readyIdx = context.indexOf("const ready = canSpeakFor(available, utterance);");
  const canSpeakIdx = context.indexOf("canSpeak: url !== null,");
  assert.ok(readyIdx >= 0, "ADR-043 — `ready` nu vine din canSpeakFor(available, utterance)");
  assert.ok(canSpeakIdx >= 0, "ADR-043 — `canSpeak: url !== null` nu s-a găsit în sursă");
  assert.ok(readyIdx < canSpeakIdx, "ADR-043 — canSpeak nu e cablat DUPĂ canSpeakFor, în sursă");
  const wiring = context.slice(readyIdx, canSpeakIdx);
  assert.ok(
    wiring.includes("const url = ready && utterance"),
    "ADR-043 — `url` nu depinde de `ready` (canSpeakFor)"
  );
});

test("ADR-043: cele 8 jocuri cu voce raportează rostirea; cele 5 fără voce nu ating vocea", () => {
  for (const name of VOICED) {
    const source = readFileSync(join(COMPONENTS, `${name}.tsx`), "utf8");
    assert.ok(
      source.includes('from "../voice/context"') && source.includes("useUtterance("),
      `ADR-043 — ${name} nu raportează rostirea curentă`
    );
  }
  for (const name of VOICELESS) {
    const source = readFileSync(join(COMPONENTS, `${name}.tsx`), "utf8");
    assert.ok(
      !source.includes("../voice/"),
      `ADR-043 — ${name} n-are voce în design, dar atinge vocea`
    );
  }
});

/* ------------------------------------ nucleul pur al calitatii audio (ADR-050) */

// Tot ce decide lustruirea se vede rosu AICI, fara niciun fisier audio: pragurile,
// clema de varf, podeaua lui `ebur128`. ffmpeg intra abia la legea de pe disc.
import {
  LOUDNESS_FLOOR,
  edgeProblems,
  formatProblems,
  gainFor,
  levelProblems,
  trimPoints,
  type ClipMeasure,
} from "./lib/audio-quality";

const SAMPLE_RATE = 44100;
/** Esantioane de amplitudine constanta, la un nivel dat in dBFS. */
function tone(seconds: number, db: number): number[] {
  const amplitude = db <= -99 ? 0 : Math.round(32768 * 10 ** (db / 20));
  return Array.from({ length: Math.round(seconds * SAMPLE_RATE) }, (_, i) =>
    i % 2 === 0 ? amplitude : -amplitude
  );
}
const TRIM = { thresholdDb: -50, keepSeconds: 0.05, sampleRate: SAMPLE_RATE };
const TARGET = { lufs: -24, truePeak: -1 };
const measure = (over: Partial<ClipMeasure> = {}): ClipMeasure => ({
  lufs: -24,
  truePeak: -6,
  firstSample: -70,
  lastSample: -70,
  seconds: 3,
  bitRate: 128_000,
  sampleRate: SAMPLE_RATE,
  channels: 1,
  ...over,
});

test("ADR-050: trimPoints nu mananca un onset moale; taie tacerea digitala la marja pastrata", () => {
  // 200 ms la -45 dBFS inaintea vorbirii: pragul e -50, deci NIMIC nu e liniste.
  const soft = [...tone(0.2, -45), ...tone(1, -12)];
  const kept = trimPoints(soft, TRIM);
  assert.deepEqual(
    kept,
    { start: 0, end: soft.length - 1 },
    "ADR-050 — un «s» soptit la -45 dBFS nu e liniste si nu se taie"
  );

  // 500 ms de tacere digitala: se taie pana la marja pastrata, nu mai mult.
  const padded = [...tone(0.5, -99), ...tone(1, -12)];
  const trimmed = trimPoints(padded, TRIM);
  assert.equal(trimmed?.start, Math.round((0.5 - 0.05) * SAMPLE_RATE), "pastreaza exact 50 ms");
  assert.equal(trimmed?.end, padded.length - 1, "coada fara liniste ramane intreaga");

  // Clip integral sub prag: nu exista interval, si asta se SPUNE, nu se taie in gol.
  assert.equal(trimPoints(tone(1, -99), TRIM), null, "ADR-050 — clip tacut = niciun interval");
});

test("ADR-050: gainFor e liniar, clemat de varf, si refuza podeaua lui ebur128", () => {
  // Fisier normal: castigul e exact distanta pana la tinta.
  assert.equal(gainFor(-30, -12, TARGET), 6, "ADR-050 — castig liniar pana la tinta");

  // PLR 23 dB: plafonul de varf are intaietate, deci fisierul ramane SUB tinta.
  // Plafonul efectiv e tinta minus marja de encodare (-1 - 0.5 = -1.5 dBTP).
  assert.equal(gainFor(-30, -7, TARGET), 5.5, "ADR-050 — clema de varf bate tinta de nivel");

  // Podeaua lui ebur128 e -70, nu -Infinity: fara garda, un clip scurt ar primi +46 dB.
  assert.equal(
    gainFor(LOUDNESS_FLOOR, -70, TARGET),
    null,
    "ADR-050 — nemasurabil, nu castig absurd"
  );
  assert.equal(gainFor(-75, -70, TARGET), null, "sub podea e tot nemasurabil");
});

test("ADR-050: edgeProblems masoara TREAPTA de la granita, nu panta de langa ea", () => {
  assert.deepEqual(edgeProblems(measure(), -40), [], "capete estompate = curat");

  const tail = edgeProblems(measure({ lastSample: -17.4 }), -40);
  assert.equal(tail.length, 1);
  assert.match(tail[0]!, /ADR-050/);
  assert.match(tail[0]!, /coad/i);

  const head = edgeProblems(measure({ firstSample: -12 }), -40);
  assert.equal(head.length, 1);
  assert.match(head[0]!, /cap/i);
});

test("ADR-050: levelProblems — la tinta, SAU sub ea fiindca varful a avut intaietate", () => {
  assert.deepEqual(levelProblems(measure({ lufs: -24.5 }), TARGET, 1), [], "in toleranta = curat");

  const quiet = levelProblems(measure({ lufs: -30 }), TARGET, 1);
  assert.equal(quiet.length, 1, "prea slab si cu varf jos = problema");
  assert.match(quiet[0]!, /ADR-050/);

  const loud = levelProblems(measure({ lufs: -20 }), TARGET, 1);
  assert.equal(loud.length, 1, "peste tinta nu are ramura a doua");

  const peaking = levelProblems(measure({ truePeak: -0.2 }), TARGET, 1);
  assert.equal(peaking.length, 1, "varful peste plafon e problema oricat de bun ar fi nivelul");

  // Ramura a doua, EXPLICITA: fisierul e sub tinta fiindca sta lipit de plafonul de varf.
  assert.deepEqual(
    levelProblems(measure({ lufs: -29, truePeak: -1.2 }), TARGET, 1),
    [],
    "ADR-050 — clemat de varf, acceptat pe ramura a doua"
  );
});

test("ADR-050: formatProblems masoara FISIERUL SERVIT, nu cererea generatorului", () => {
  const want = { bitRate: 128_000, sampleRate: SAMPLE_RATE, channels: 1 };
  assert.deepEqual(formatProblems(measure(), want), []);

  const regressed = formatProblems(measure({ bitRate: 64_000 }), want);
  assert.equal(regressed.length, 1, "o regresie la 64 kbps lasa cheia neschimbata — o prinde asta");
  assert.match(regressed[0]!, /ADR-050/);

  assert.equal(formatProblems(measure({ channels: 2 }), want).length, 1);
  assert.equal(formatProblems(measure({ sampleRate: 22_050 }), want).length, 1);
  // CBR-ul mp3 raporteaza cu abatere de cateva promile — toleranta, nu egalitate.
  assert.deepEqual(formatProblems(measure({ bitRate: 128_400 }), want), []);
});
