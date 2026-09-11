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
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  FILE_BUDGET,
  POLISH,
  UTTERANCE_MASTER,
  VOICE_DIR,
  VOICED_GAMES,
  audioPath,
  polishDigest,
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

test("ADR-050: cheia vocii poarta sursa, bitrate-ul servit si digestul lustruirii", () => {
  const key = voiceKey("ghicitori");
  assert.match(key, /_src192_/, "ADR-050 — cheia nu spune din ce sursa s-a generat");
  assert.match(key, /_out128k_/, "ADR-050 — cheia nu spune la ce bitrate s-a servit");
  assert.ok(
    key.endsWith(`_p${polishDigest(POLISH, UTTERANCE_MASTER)}`),
    "ADR-050 — cheia nu poarta digestul lustruirii"
  );

  // FIECARE parametru care schimba artefactul trebuie sa schimbe cheia — altfel
  // o valoare scoasa din amprenta ar lasa pe disc fisiere vechi care trec legea
  // noua. Se probeaza pe TOATE campurile, nu pe doua alese pe sprinceana.
  const reference = polishDigest(POLISH, UTTERANCE_MASTER);
  for (const field of Object.keys(POLISH) as (keyof typeof POLISH)[]) {
    assert.notEqual(
      polishDigest({ ...POLISH, [field]: POLISH[field] + 1 }, UTTERANCE_MASTER),
      reference,
      `ADR-050 — «${field}» nu intra in amprenta lustruirii`
    );
  }
  for (const field of Object.keys(UTTERANCE_MASTER) as (keyof typeof UTTERANCE_MASTER)[]) {
    assert.notEqual(
      polishDigest(POLISH, { ...UTTERANCE_MASTER, [field]: UTTERANCE_MASTER[field] + 1 }),
      reference,
      `ADR-050 — «${field}» nu intra in amprenta nivelului`
    );
  }
});

test("ADR-050: settings.ts ramane PUR — il importa clientul", () => {
  const source = readFileSync(join(VOICE, "settings.ts"), "utf8");
  assert.ok(
    !/from "node:|require\(/.test(source),
    "ADR-050 — settings.ts a capatat o dependinta de Node; clientul il importa"
  );
  assert.ok(
    !source.includes("AUDIO_OUTPUT_FORMAT"),
    "ADR-050 — formatul vocii jocurilor si-a luat casa; constanta veche nu se mai importa"
  );
});

/* ------------------------------ lustruirea, pe fisiere sintetizate (ADR-050) */

// Fixturile se GENEREAZA aici, cu ffmpeg: legea merge cu corpus gol (N6) si nu
// depinde de niciun fisier comis.
import { measureClip, polish, scanClips } from "./lib/audio-quality";
import { UTTERANCE_MASTER as TARGET_LEVEL } from "../app/jocuri/voice/settings";
import { runFfmpeg } from "./lib/loudness";

type ClipShape = { db: number; lead?: number; hz?: number };
/**
 * Un ton taiat pe varful undei la AMANDOUA capetele — exact cele doua defecte
 * masurate pe corpusul real. 441 Hz la 44,1 kHz = fix 100 esantioane pe perioada,
 * iar esantioanele 25 si 17725 cad pe sfertul de perioada, adica pe maxim:
 * fixtura e determinista, nu norocoasa. `lead` prepune tacere, pentru taiere.
 */
function brokenClip(dir: string, name: string, { db, lead = 0, hz = 441 }: ClipShape): string {
  const file = join(dir, name);
  const delay = lead > 0 ? `,adelay=${Math.round(lead * 1000)}:all=1` : "";
  runFfmpeg([
    ...["-f", "lavfi", "-i", `aevalsrc=0.5*sin(2*PI*${hz}*t):d=0.5:s=44100`],
    ...["-af", `atrim=start_sample=25:end_sample=17726,asetpts=N/SR/TB,volume=${db}dB${delay}`],
    ...["-ac", "1", "-ar", "44100", file],
  ]);
  return file;
}

test("ADR-050: polish aduce fisierul la tinta, cu capete curate si formatul servit", async () => {
  const work = mkdtempSync(join(tmpdir(), "lustruire-"));
  try {
    const source = brokenClip(work, "sursa.wav", { db: -20 });
    const before = await measureClip(source);
    assert.ok(before.firstSample > -40, "fixtura chiar incepe pe varful undei");
    assert.ok(before.lastSample > -40, "fixtura chiar se termina pe varful undei");
    assert.ok(before.lufs < TARGET_LEVEL.lufs - 3, "fixtura chiar e pe langa tinta");

    const out = join(work, "lustruit.mp3");
    await polish(source, out);
    const after = await measureClip(out);

    assert.ok(
      Math.abs(after.lufs - TARGET_LEVEL.lufs) <= 1,
      `ADR-050 — ${after.lufs.toFixed(1)} LUFS, tinta e ${TARGET_LEVEL.lufs}`
    );
    assert.ok(after.truePeak <= TARGET_LEVEL.truePeak, "varful ramane sub plafon");
    assert.ok(
      after.firstSample < -40 && after.lastSample < -40,
      "ADR-050 — capetele raman treapta"
    );
    assert.equal(after.sampleRate, 44_100);
    assert.equal(after.channels, 1);
    assert.ok(Math.abs(after.bitRate - 128_000) < 128_000 * 0.02, "bitrate-ul servit e 128k");

    assert.deepEqual(
      readdirSync(work).filter((f) => f.endsWith(".wav") && f !== "sursa.wav"),
      [],
      "ADR-050 — niciun temporar langa fisierul bun"
    );
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});

test("ADR-050: polish taie tacerea de la cap, pastrand marja", async () => {
  const work = mkdtempSync(join(tmpdir(), "lustruire-taiere-"));
  try {
    const source = brokenClip(work, "cu-tacere.wav", { db: -20, lead: 0.5 });
    const out = join(work, "taiat.mp3");
    await polish(source, out);
    const [before, after] = [await measureClip(source), await measureClip(out)];
    const cut = before.seconds - after.seconds;
    assert.ok(cut > 0.35, `ADR-050 — tacerea de la cap n-a fost taiata (${cut.toFixed(3)}s)`);
    assert.ok(cut < 0.5, `ADR-050 — s-a taiat peste marja pastrata (${cut.toFixed(3)}s)`);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});

test("ADR-050: un clip numai din infrasunete e respins, nu scris tacut", async () => {
  // 5 Hz, mult sub pragul high-pass-ului: dupa filtrare nu mai ramane semnal masurabil,
  // deci `gainFor` intoarce problema si lustruirea SE OPRESTE. Proba trece prin
  // amandoua: high-pass-ul chiar ruleaza, iar garda podelei chiar prinde.
  const work = mkdtempSync(join(tmpdir(), "infrasunete-"));
  try {
    const source = brokenClip(work, "duduit.wav", { db: -20, hz: 5 });
    await assert.rejects(
      () => polish(source, join(work, "iese.mp3")),
      /ADR-050/,
      "ADR-050 — un clip fara semnal audibil nu are voie sa fie scris in tacere"
    );
    assert.ok(
      !readdirSync(work).includes("iese.mp3"),
      "ADR-050 — fisierul nu se scrie cand lustruirea se opreste"
    );
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});

test("ADR-050: scanClips masoara in paralel si intoarce cate o masuratoare per cale", async () => {
  const work = mkdtempSync(join(tmpdir(), "scanare-"));
  try {
    const files = [0, 1, 2, 3].map((i) => brokenClip(work, `c${i}.wav`, { db: -20 }));
    const measured = await scanClips(files, 4);
    assert.equal(measured.size, files.length);
    for (const f of files) assert.ok(measured.get(f), `lipseste masuratoarea pentru ${f}`);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});

/* ------------------------- legea calitatii peste discul real (ADR-050) */

// Purele de mai sus nu pazesc nimic pana nu se plimba peste fisierele comise.
// Se masoara TOT, cu 8 procese deodata: 0,84 s pentru 122 de fisiere, ~3,5 s la
// 504. Fara esantionare si fara manifest — un al doilea adevar care poate minti.
import { clipProblems } from "./lib/audio-quality";
import { EDGE_THRESHOLD_DB, LEVEL_TOLERANCE_LU, SERVED_FORMAT } from "../app/jocuri/voice/settings";

const CLIP_CONTRACT = {
  target: TARGET_LEVEL,
  tolerance: LEVEL_TOLERANCE_LU,
  edgeThresholdDb: EDGE_THRESHOLD_DB,
  format: SERVED_FORMAT,
};

/** Caile tuturor rostirilor comise, pe toate jocurile cu voce, in cheia curenta. */
function committedUtterances(): string[] {
  const paths: string[] = [];
  for (const slug of Object.keys(VOICED_GAMES)) {
    const key = voiceKey(slug);
    const dir = readVoiceDir(slug, key);
    if (!dir) continue;
    for (const f of dir.files)
      if (f.name.endsWith(".mp3")) paths.push(join(process.cwd(), VOICE_DIR, slug, key, f.name));
  }
  return paths;
}

async function qualityProblems(): Promise<string[]> {
  const paths = committedUtterances();
  const measured = await scanClips(paths, 8);
  return paths.flatMap((p) => clipProblems(measured.get(p) as ClipMeasure, CLIP_CONTRACT));
}

test("ADR-050: o rostire proasta pusa pe disc pica legea; una buna trece", async () => {
  const root = mkdtempSync(join(tmpdir(), "calitate-disc-"));
  const slug = Object.keys(VOICED_GAMES)[0] as string;
  const dir = join(root, VOICE_DIR, slug, voiceKey(slug));
  mkdirSync(dir, { recursive: true });
  const staging = mkdtempSync(join(tmpdir(), "calitate-sursa-"));
  const before = process.cwd();
  try {
    // Una lustruita cum trebuie, una lasata cu defectele reale (prea slaba, capete rupte).
    await polish(brokenClip(staging, "buna.wav", { db: -20 }), join(dir, "aaa.mp3"));
    runFfmpeg([
      ...["-i", brokenClip(staging, "rea.wav", { db: -20 })],
      ...["-ac", "1", "-ar", "44100", "-c:a", "libmp3lame", "-b:a", "128k", join(dir, "bbb.mp3")],
    ]);

    process.chdir(root);
    const problems = await qualityProblems();
    assert.ok(problems.length > 0, "ADR-050 — rostirea cu defecte n-a picat legea");
    assert.ok(
      problems.every((p) => p.includes("ADR-050")),
      "fiecare problema isi citeaza decizia"
    );
    // Fisierul bun nu produce niciun motiv: legea nu e un alarmist.
    unlinkSync(join(dir, "bbb.mp3"));
    assert.deepEqual(await qualityProblems(), [], "ADR-050 — rostirea lustruita trece curat");
  } finally {
    process.chdir(before);
    rmSync(root, { recursive: true, force: true });
    rmSync(staging, { recursive: true, force: true });
  }
});

test("ADR-050: discul real — fiecare rostire comisa tine nivelul, capetele si formatul", async () => {
  // Corpus gol = verde vacuu (N6): jocul fara director trece, ca la ADR-043.
  assert.deepEqual(await qualityProblems(), []);
});
