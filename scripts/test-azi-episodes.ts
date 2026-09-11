/**
 * Legea episodului Vorbărici (ADR-047): scriptul ritualului — segmentele în
 * ordinea aprobată, cu liniștile ca valori numite —, contractul de voce al
 * personajului (regula de aur, oglindită mecanic) și legea rostirilor de marcă
 * de pe disc (cele zece rânduri fixe, rostite o dată și comise).
 *
 * Cartea și scripturile rele se fabrică AICI: legile se văd roșii fără niciun
 * corpus real și fără niciun fișier pe disc. Rulează cu `yarn test`.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { RitualCard } from "../app/azi/card";
import {
  episodeScript,
  goldenRuleProblems,
  MIN_SILENCE_SECONDS,
  RITUAL_LINES,
  SILENCE,
  type Segment,
} from "../app/azi/episode";
import { hashId } from "../app/jocuri/content/ids";
import {
  BRAND_VOICE_DIR,
  EDGE_THRESHOLD_DB,
  FILE_BUDGET,
  UTTERANCE_MASTER,
  VOICED_GAMES,
  baseVoiceKey,
  voiceKey,
} from "../app/jocuri/voice/settings";
import { EPISODE_BITRATE, EPISODE_FORMAT, episodeFileName } from "./lib/azi-episode";
import { edgeProblems, formatProblems, measureClip } from "./lib/audio-quality";
import { EPISODE_MASTER, renderSegments } from "./lib/episode";
import { measureLoudness, runFfmpeg } from "./lib/loudness";
import { readKeyedDir, type VoiceDir } from "./lib/voice-law";
import { STINGS, STING_LOUDNESS } from "./video/config";
import { gainDb, type StingRole } from "./video/sting";

const CARD: RitualCard = {
  date: "joi, 11 septembrie",
  items: [
    {
      kind: "ghicitoare",
      emoji: "🔮",
      prompt: "Cine bate la geam și nu intră?",
      second: "Ghiciți amândoi. Cine zice primul?",
      answer: "ploaia",
    },
    {
      kind: "roata",
      emoji: "🎡",
      prompt: "Ce ai face cu o zi în plus?",
      second: "Întâi copilul. Apoi TU.",
      stress: "TU",
    },
    {
      kind: "framantare",
      emoji: "👅",
      prompt: "Șase sași în șase saci.",
      second: "De trei ori, repede.",
    },
  ],
};

type Silence = Extract<Segment, { kind: "silence" }>;

const silences = (segments: readonly Segment[]): Silence[] =>
  segments.filter((segment): segment is Silence => segment.kind === "silence");

/**
 * Legea liniștilor pe UN script oarecare — al ritualului sau fabricat: un episod
 * fără liniște nu e ritual, ci un monolog; o liniște prea scurtă nu apucă să
 * încapă răspunsul copilului.
 */
function scriptProblems(segments: readonly Segment[]): string[] {
  const quiet = silences(segments);
  const problems =
    quiet.length === 0
      ? ["ADR-047 — script fără nicio liniște: liniștea e ritualul, nu textul dintre ele"]
      : [];
  for (const segment of quiet)
    if (segment.seconds < MIN_SILENCE_SECONDS)
      problems.push(
        `ADR-047 — liniște de ${segment.seconds}s, sub minimul de ${MIN_SILENCE_SECONDS}s`
      );
  return problems;
}

test("ADR-047: scriptul ritualului — 21 de segmente, în ordinea aprobată", () => {
  const script = episodeScript(CARD);
  const expected: Segment[] = [
    { kind: "sting", role: "intro" },
    { kind: "voice", text: RITUAL_LINES.greeting },
    { kind: "voice", text: RITUAL_LINES.riddleIntro },
    { kind: "voice", text: "Cine bate la geam și nu intră?", game: "ghicitori" },
    { kind: "silence", seconds: SILENCE.afterRiddle },
    { kind: "voice", text: RITUAL_LINES.askTogether },
    { kind: "silence", seconds: SILENCE.afterAskTogether },
    { kind: "voice", text: RITUAL_LINES.riddleAnswer },
    { kind: "voice", text: "ploaia", game: "ghicitori" },
    { kind: "voice", text: RITUAL_LINES.wheelIntro },
    { kind: "voice", text: "Ce ai face cu o zi în plus?", game: "roata-cuvintelor" },
    { kind: "voice", text: RITUAL_LINES.childFirst },
    { kind: "silence", seconds: SILENCE.forChild },
    { kind: "voice", text: RITUAL_LINES.adultNext },
    { kind: "silence", seconds: SILENCE.forAdult },
    { kind: "voice", text: RITUAL_LINES.twisterIntro },
    { kind: "voice", text: "Șase sași în șase saci.", game: "framantari-de-limba" },
    { kind: "silence", seconds: SILENCE.afterTwister },
    { kind: "voice", text: RITUAL_LINES.tangled },
    { kind: "voice", text: RITUAL_LINES.farewell },
    { kind: "sting", role: "outro" },
  ];
  assert.equal(script.length, 21, "episodul are 21 de segmente");
  assert.deepEqual(script, expected, "ordinea, liniștile și jocurile sunt cele aprobate");
  assert.deepEqual(
    silences(script).map((segment) => segment.seconds),
    [6, 4, 20, 20, 8],
    "liniștile ritualului, în ordine"
  );
});

test("ADR-047: un script fără nicio liniște e respins", () => {
  const mute: Segment[] = [
    { kind: "sting", role: "intro" },
    { kind: "voice", text: RITUAL_LINES.greeting },
    { kind: "sting", role: "outro" },
  ];
  const problems = scriptProblems(mute);
  assert.equal(problems.length, 1, "scriptul mut trebuie respins");
  assert.match(problems[0] ?? "", /ADR-047/);
  assert.deepEqual(scriptProblems(episodeScript(CARD)), [], "scriptul ritualului trece curat");
});

test("ADR-047: o liniște sub minim e respinsă", () => {
  const hurried: Segment[] = [
    { kind: "voice", text: RITUAL_LINES.childFirst },
    { kind: "silence", seconds: 3 },
  ];
  const problems = scriptProblems(hurried);
  assert.equal(problems.length, 1, "liniștea de 3 s trebuie respinsă");
  assert.match(problems[0] ?? "", /ADR-047/);
  assert.ok(MIN_SILENCE_SECONDS >= 4, "minimul de liniște e de cel puțin 4 s");
});

test("ADR-047: regula de aur — specia, acordul feminin, adresarea, țara, tagurile", () => {
  const forbidden = [
    "Mi-a înghețat o aripă la geam.",
    "Am văzut cu ochii mei, zic eu, gaița.",
    "Ciocul meu știe.",
    "Mi-am făcut cuib lângă voi.",
    "Sunt sigură că știi.",
    "Mie una îmi place.",
    "Dragi copii, ascultați aici.",
    "Sper că ți-a plăcut, așadar mergem mai departe.",
    "Alți nemți au alt cuvânt pentru asta.",
    "Întreabă-i pe colegii tăi.",
    "[bored] Și răspunsul e…",
  ];
  for (const line of forbidden) {
    const problems = goldenRuleProblems(line);
    assert.ok(problems.length > 0, `„${line}” trebuie respins`);
    assert.match(problems[0] ?? "", /ADR-047/, "mesajul citează ADR-047");
  }
  assert.match(
    goldenRuleProblems(forbidden[0] ?? "")[0] ?? "",
    /aripa/,
    "mesajul numește termenul"
  );
});

test("ADR-047: regula prinde cuvinte întregi, cu sau fără diacritice — nu bucăți de cuvânt", () => {
  assert.equal(goldenRuleProblems("O ciocolată caldă.").length, 0, "„cioc” în „ciocolată”");
  assert.equal(goldenRuleProblems("Mergem mai departe.").length, 0, "un rând curat");
  assert.ok(goldenRuleProblems("SUNT SIGURĂ.").length > 0, "diacriticele și majusculele nu scapă");
  assert.ok(goldenRuleProblems("Sunt sigura.").length > 0, "nici scrisul fără diacritice");
  assert.equal(goldenRuleProblems("[curious] Și răspunsul e…").length, 0, "tag canonic");
});

test("ADR-047: cele zece rânduri fixe trec regula de aur, fără nicio problemă", () => {
  const lines = Object.values(RITUAL_LINES);
  assert.equal(lines.length, 10, "ritualul are zece rânduri fixe");
  for (const line of lines) {
    assert.ok(line.trim().length > 0, "un rând fix gol");
    assert.deepEqual(goldenRuleProblems(line), [], `rândul „${line}” încalcă regula de aur`);
  }
});

test("ADR-047: o carte fără cele trei elemente nu produce un episod mut — se oprește", () => {
  const first = CARD.items[0];
  assert.ok(first);
  assert.throws(() => episodeScript({ date: CARD.date, items: [first] }), /ADR-047/);
  assert.throws(
    () =>
      episodeScript({
        date: CARD.date,
        items: [{ ...first, answer: undefined }, ...CARD.items.slice(1)],
      }),
    /ADR-047/,
    "o ghicitoare fără răspuns n-are ce rosti"
  );
});

test("ADR-047: planseul nu respinge cuvinte comune care se confunda dupa normalizare", () => {
  // Normalizat, „pană” devine „pana” — adica exact „până”, cel mai comun cuvant
  // din limba; iar „singură” devine „singura”, articolul. Termenii astia se cauta
  // CU diacritice, altfel legea ar opri orice rand viitor care spune „până mâine”.
  for (const innocent of [
    "Mai trec pe la geam până mâine.",
    "E singura dată când spun asta.",
    "Stai până termin.",
  ])
    assert.deepEqual(goldenRuleProblems(innocent), [], `respins pe nedrept: „${innocent}”`);

  for (const guilty of ["Am pierdut o pană.", "Am fost singură la geam."]) {
    const problems = goldenRuleProblems(guilty);
    assert.equal(problems.length, 1, `ar fi trebuit respins: „${guilty}”`);
    assert.match(problems[0] as string, /ADR-047/);
  }
});

/* ------------------------------- rostirile de marcă ale ritualului (ADR-047) */

// Cele zece rânduri fixe se rostesc O DATĂ și se comit ca asset: de-aia legea lor
// e a FIȘIERELOR de pe disc, nu a textelor. Nucleul e pur — primește o listare de
// director și întoarce problemele —, deci se vede roșu pe listări fabricate, fără
// niciun mp3 comis (N6).

/** Comanda care repară orice problemă de mai jos; un singur text, în fiecare mesaj. */
const BRAND_FIX = "rulează yarn generate-azi-voice";

/**
 * Legea rostirilor de marcă: orfanul și cheia veche sunt roșii, lipsa NU.
 * Un rând fix fără fișier îl oprește pe generatorul de episoade, care are nevoie
 * de el ca să compună ziua; dacă ar fi roșie și AICI, un corpus negenerat ar
 * bloca orice landing, inclusiv pe cele fără nicio legătură cu vocea.
 */
function brandProblems(dir: VoiceDir | null, key: string, expected: ReadonlySet<string>): string[] {
  if (!dir) return [];
  const problems = dir.keys
    .filter((found) => found !== key)
    .map((found) => `ADR-047 — cheie de voce veche pe disc „${found}”: ${BRAND_FIX}`);
  for (const file of dir.files) {
    if (!expected.has(file.name))
      problems.push(`ADR-047 — rostire de marcă orfană „${file.name}”: ${BRAND_FIX}`);
    if (file.bytes > FILE_BUDGET)
      problems.push(
        `ADR-047 — „${file.name}” peste bugetul de ${FILE_BUDGET / 1024}KB: ${BRAND_FIX}`
      );
  }
  return problems;
}

/** Numele fișierelor celor zece rânduri fixe — cheia lor de identitate e textul. */
const brandFiles = (): Set<string> =>
  new Set(Object.values(RITUAL_LINES).map((line) => `${hashId(line)}.mp3`));

/** Rădăcina rostirilor de marcă în directorul de lucru curent (repo real sau temporar). */
const brandRoot = (): string => join(process.cwd(), BRAND_VOICE_DIR);

const BRAND_KEY = "cheie-curenta";
const GREETING = `${hashId(RITUAL_LINES.greeting)}.mp3`;

function brandDir(files: { name: string; bytes?: number }[], keys = [BRAND_KEY]): VoiceDir {
  return { keys, files: files.map((f) => ({ name: f.name, bytes: f.bytes ?? 30_000 })) };
}

test("ADR-047: corpusul de marcă gol — sau lipsă cu totul — trece verde", () => {
  const expected = brandFiles();
  assert.deepEqual(brandProblems(null, BRAND_KEY, expected), [], "niciun director = verde");
  assert.deepEqual(brandProblems(brandDir([]), BRAND_KEY, expected), [], "director gol = verde");
  assert.deepEqual(
    brandProblems(brandDir([{ name: GREETING }]), BRAND_KEY, expected),
    [],
    "ADR-047 — nouă rânduri fixe lipsă nu au voie să blocheze un landing"
  );
});

test("ADR-047: un fișier orfan în directorul de marcă pică legea, cu comanda în mesaj", () => {
  const problems = brandProblems(
    brandDir([{ name: GREETING }, { name: "zzz.mp3" }]),
    BRAND_KEY,
    brandFiles()
  );
  assert.equal(problems.length, 1, "exact orfanul e problema");
  assert.match(problems[0] ?? "", /ADR-047/, "mesajul citează decizia");
  assert.match(problems[0] ?? "", /zzz\.mp3/, "mesajul numește fișierul");
  assert.match(problems[0] ?? "", /yarn generate-azi-voice/, "mesajul spune ce se rulează");
});

test("ADR-047: o cheie de voce veche pe disc pică legea — episodul ar suna din două guri", () => {
  const problems = brandProblems(
    brandDir([{ name: GREETING }], [BRAND_KEY, "cheie-veche"]),
    BRAND_KEY,
    brandFiles()
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0] ?? "", /ADR-047/);
  assert.match(problems[0] ?? "", /cheie-veche/, "mesajul numește cheia rămasă");
  assert.match(problems[0] ?? "", /yarn generate-azi-voice/);
});

test("ADR-047: o rostire de marcă peste buget pică legea", () => {
  const problems = brandProblems(
    brandDir([{ name: GREETING, bytes: FILE_BUDGET + 1 }]),
    BRAND_KEY,
    brandFiles()
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0] ?? "", /ADR-047/);
  assert.match(problems[0] ?? "", /buget/);
  assert.deepEqual(
    brandProblems(brandDir([{ name: GREETING, bytes: FILE_BUDGET }]), BRAND_KEY, brandFiles()),
    [],
    "exact la buget încă trece"
  );
});

test("ADR-047: legea citește discul pe calea contractului — director de marcă, cheia de bază", () => {
  // Calea e CONTRACT, nu detaliu: sub ea se comit punțile, iar episodul le caută
  // acolo. Un director mutat ar lăsa legea și generatorul de acord între ele și
  // în dezacord cu ce se servește — de-aia litera stă scrisă aici.
  assert.equal(BRAND_VOICE_DIR, "public/assets/audio/brand/vorbarici");
  const root = mkdtempSync(join(tmpdir(), "marca-"));
  const dir = join(root, BRAND_VOICE_DIR, baseVoiceKey());
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, GREETING), Buffer.alloc(10));
  writeFileSync(join(dir, "zzz.mp3"), Buffer.alloc(10));
  const before = process.cwd();
  process.chdir(root);
  try {
    const problems = brandProblems(
      readKeyedDir(brandRoot(), baseVoiceKey()),
      baseVoiceKey(),
      brandFiles()
    );
    assert.equal(problems.length, 1, "orfanul de pe discul real se vede");
    assert.match(problems[0] ?? "", /zzz\.mp3/);
  } finally {
    process.chdir(before);
    rmSync(root, { recursive: true, force: true });
  }
});

test("ADR-047: discul real — nicio rostire de marcă orfană, nicio cheie veche, niciun fișier gras", () => {
  assert.deepEqual(
    brandProblems(readKeyedDir(brandRoot(), baseVoiceKey()), baseVoiceKey(), brandFiles()),
    []
  );
});

test("ADR-047: generatorul scrie unde citește legea — același director, aceeași cheie", () => {
  const source = readFileSync(join(process.cwd(), "scripts/generate-azi-voice.ts"), "utf8");
  assert.ok(
    source.includes("BRAND_VOICE_DIR"),
    "ADR-047 — generatorul nu compune calea din BRAND_VOICE_DIR"
  );
  assert.ok(
    source.includes("baseVoiceKey()"),
    "ADR-047 — generatorul nu scrie în cheia de bază a vocii"
  );
});

/**
 * Valoarea de AZI a cheii, fixată: sub ea stau cele 366 de rostiri ale jocurilor
 * și cele zece de marcă. O re-acordare deliberată a vocii înseamnă regenerarea
 * corpusului ȘI schimbarea literalului de aici — niciodată invers, fiindcă o
 * cheie mișcată din greșeală mătură de pe disc tot ce s-a rostit până acum.
 */
const VOICE_KEY_TODAY = "eleven_v3_src192_out128k_s0.5_b0.75_sp1_p12emye9";

test("ADR-047: cheia de bază e prefixul cheii fiecărui joc, iar valoarea de azi n-a mișcat", () => {
  assert.equal(baseVoiceKey(), VOICE_KEY_TODAY, "ADR-047 — cheia de bază s-a schimbat");
  for (const slug of Object.keys(VOICED_GAMES)) {
    assert.ok(
      voiceKey(slug).startsWith(baseVoiceKey()),
      `ADR-047 — ${slug}: cheia jocului nu începe cu cheia de bază`
    );
    assert.equal(
      voiceKey(slug),
      VOICE_KEY_TODAY,
      `ADR-047 — ${slug}: cheia s-a schimbat, iar rostirile comise ar fi măturate`
    );
  }
});

/* -------------------- lipitura si identitatea episodului zilei (ADR-047) */

/**
 * Episodul se lipește din felii: stinguri de marcă, rostiri comise, liniști
 * fabricate. Legile de mai jos măsoară FIȘIERUL RANDAT, nu graful — iar feliile
 * se sintetizează cu ffmpeg, deci nicio lege de aici nu depinde de corpusul de pe
 * disc (N6: mecanismul merge cu corpus gol).
 */

const RATE = 44_100;
/** 441 Hz = o perioadă de exact 100 de eșantioane: tăierile cad pe VÂRFUL undei, nu la întâmplare. */
const TONE_HZ = 441;
const PERIOD = RATE / TONE_HZ;
/** Rostirea fixturii: multiplu de perioadă, ca și capătul ei să cadă pe vârf. */
const VOICE_SAMPLES = 22_000;
const VOICE_SECONDS = VOICE_SAMPLES / RATE;
/**
 * Un cadru mp3 (26 ms). Ferestrele se strâng cu atât la fiecare capăt: acolo stau
 * estompările feliei vecine (8 și 15 ms, deci amândouă încap în el) și smearing-ul
 * encodării peste granița cadrului. Măsurat pe fixtură, liniștea e la −99 dBFS
 * înăuntru și −84 pe fereastra întreagă; marja nu e a legii, e a derivei: un
 * decodor care mută lipitura cu câteva eșantioane ar prinde altfel coada rampei.
 */
const MP3_FRAME = 1152;
/** Sub atât e liniște adevărată, nu „aproape tăcut”. */
const SILENT_DB = -60;

const dbOf = (sample: number): number =>
  sample === 0 ? -99 : 20 * Math.log10(Math.abs(sample) / 32768);

type Tone = { samples: number; lufs: number };

/**
 * O felie ruptă deliberat: un ton tăiat pe vârful undei la ambele capete (tiparul
 * lui `brokenClip` din legea jocurilor), adusă la nivelul cerut. Exact ce
 * primește episodul când un sting se taie la secunda din compoziție.
 */
function toneClip(dir: string, name: string, { samples, lufs }: Tone): string {
  const raw = join(dir, `raw-${name}`);
  const seconds = ((samples + PERIOD) / RATE).toFixed(3);
  const cut = `atrim=start_sample=${PERIOD / 4}:end_sample=${PERIOD / 4 + samples}`;
  runFfmpeg([
    ...["-f", "lavfi", "-i", `aevalsrc=0.5*sin(2*PI*${TONE_HZ}*t):d=${seconds}:s=${RATE}`],
    ...["-af", `${cut},asetpts=N/SR/TB`],
    ...["-ac", "1", "-ar", String(RATE), raw],
  ]);
  const file = join(dir, name);
  runFfmpeg([
    ...["-i", raw, "-af", `volume=${gainDb(measureLoudness(raw), lufs).toFixed(2)}dB`],
    ...["-ac", "1", "-ar", String(RATE), file],
  ]);
  return file;
}

/** Felia de sting: cel puțin cât cere compoziția — restul îl taie `fixedTrim`, tot pe vârf de undă. */
const stingSamples = (role: StingRole): number =>
  Math.ceil((STINGS[role].seconds * RATE) / PERIOD) * PERIOD + PERIOD;

/**
 * Scriptul fixturii: două stinguri, două rostiri, două liniști. Liniștile sunt
 * scurte fiindcă proba e a CUSĂTURILOR, nu a ritmului ritualului (ăla are legea
 * lui, pe `MIN_SILENCE_SECONDS`).
 */
const FIXTURE_SCRIPT: Segment[] = [
  { kind: "sting", role: "intro" },
  { kind: "voice", text: "Bună! Ai cinci minute?" },
  { kind: "silence", seconds: 1 },
  { kind: "voice", text: "Ascultă bine." },
  { kind: "silence", seconds: 0.8 },
  { kind: "sting", role: "outro" },
];

/** Durata unui segment, din SCRIPT: stingul e fixat de compoziție, liniștea se declară, rostirea e felia. */
function segmentSeconds(segment: Segment): number {
  if (segment.kind === "sting") return STINGS[segment.role].seconds;
  if (segment.kind === "silence") return segment.seconds;
  return VOICE_SECONDS;
}

/** Momentele cusăturilor, calculate din script (capătul episodului nu e cusătură — are legea lui). */
function seamTimes(script: readonly Segment[]): number[] {
  const times: number[] = [];
  let at = 0;
  for (const segment of script) {
    at += segmentSeconds(segment);
    times.push(at);
  }
  return times.slice(0, -1);
}

/**
 * TREAPTA de la fiecare cusătură — eșantionul de la graniță, nu panta de lângă
 * el: panta dintre două eșantioane vecine e forma de undă însăși (același
 * raționament ca la `edgeProblems`, ADR-050).
 */
function seamProblems(samples: Int16Array, script: readonly Segment[]): string[] {
  return seamTimes(script)
    .map((at) => ({ at, db: dbOf(samples[Math.round(at * RATE)] ?? 0) }))
    .filter(({ db }) => db > EDGE_THRESHOLD_DB)
    .map(
      ({ at, db }) =>
        `ADR-047 — cusătura de la ${at.toFixed(3)}s pocnește: ${db.toFixed(1)} dBFS, ` +
        `plafonul e ${EDGE_THRESHOLD_DB}`
    );
}

/** Vârful (dBFS) dintr-o fereastră de eșantioane. */
function peakDb(samples: Int16Array, from: number, to: number): number {
  let peak = 0;
  for (let i = Math.max(0, from); i < Math.min(samples.length, to); i++)
    peak = Math.max(peak, Math.abs(samples[i] as number));
  return dbOf(peak);
}

/** Fiecare liniște e liniște pe TOATĂ durata ei: în ea răspunde copilul, nu suflă banda. */
function silenceProblems(samples: Int16Array, script: readonly Segment[]): string[] {
  const problems: string[] = [];
  let at = 0;
  for (const segment of script) {
    const start = Math.round(at * RATE);
    at += segmentSeconds(segment);
    if (segment.kind !== "silence") continue;
    const db = peakDb(samples, start + MP3_FRAME, Math.round(at * RATE) - MP3_FRAME);
    if (db > SILENT_DB)
      problems.push(
        `ADR-047 — liniștea de la ${(start / RATE).toFixed(3)}s nu e tăcută: ` +
          `${db.toFixed(1)} dBFS, plafonul e ${SILENT_DB}`
      );
  }
  return problems;
}

/** Eșantioanele fișierului randat: legile se uită la undă, nu la medii. */
function samplesOf(file: string, work: string): Int16Array {
  const pcm = join(work, "pcm.raw");
  runFfmpeg([
    ...["-i", file, "-f", "s16le", "-acodec", "pcm_s16le"],
    ...["-ac", "1", "-ar", String(RATE), pcm],
  ]);
  const bytes = readFileSync(pcm);
  return new Int16Array(bytes.buffer, bytes.byteOffset, bytes.length >> 1);
}

/** Feliile fixturii, în ordinea segmentelor: stingurile la nivelul lor comis, rostirile la al lor. */
function fixtureInputs(work: string): string[] {
  const sting = (role: StingRole): string =>
    toneClip(work, `sting-${role}.wav`, { samples: stingSamples(role), lufs: STING_LOUDNESS.lufs });
  const voice = (name: string): string =>
    toneClip(work, name, { samples: VOICE_SAMPLES, lufs: UTTERANCE_MASTER.lufs });
  return [sting("intro"), voice("voce-1.wav"), voice("voce-2.wav"), sting("outro")];
}

/** Fereastra „curată” a unui segment: fără estompări și fără cadrul mp3 de la capete. */
function insideOf(script: readonly Segment[], index: number): [number, number] {
  const before = script.slice(0, index).reduce((sum, segment) => sum + segmentSeconds(segment), 0);
  const start = Math.round(before * RATE);
  const end = Math.round((before + segmentSeconds(script[index] as Segment)) * RATE);
  return [start + MP3_FRAME, end - MP3_FRAME];
}

/** Episodul fixturii, randat din feliile date. */
function renderFixture(work: string, script: readonly Segment[], inputs: string[]): string {
  const out = join(work, "episod.mp3");
  renderSegments({
    segments: script,
    inputs,
    out,
    master: EPISODE_MASTER,
    bitRate: EPISODE_BITRATE,
  });
  return out;
}

test("ADR-047: episodul randat are capetele curate, cusăturile mute și liniștile tăcute", async () => {
  const work = mkdtempSync(join(tmpdir(), "episod-"));
  try {
    const inputs = fixtureInputs(work);
    const broken = await measureClip(inputs[1] as string);
    assert.ok(broken.firstSample > EDGE_THRESHOLD_DB, "fixtura chiar începe pe vârful undei");
    assert.ok(broken.lastSample > EDGE_THRESHOLD_DB, "fixtura chiar se termină pe vârful undei");

    const out = renderFixture(work, FIXTURE_SCRIPT, inputs);
    const clip = await measureClip(out);
    const samples = samplesOf(out, work);

    // Toate problemele într-o listă, nu trei aserțiuni: prima picată le-ar ascunde
    // pe celelalte, iar un graf fără estompare rupe deodată și capetele, și cusăturile.
    assert.deepEqual(
      [
        ...edgeProblems(clip, EDGE_THRESHOLD_DB),
        ...seamProblems(samples, FIXTURE_SCRIPT),
        ...silenceProblems(samples, FIXTURE_SCRIPT),
      ],
      [],
      "capetele, cusăturile și liniștile episodului"
    );
    assert.deepEqual(formatProblems(clip, EPISODE_FORMAT), [], "formatul episodului");
    assert.ok(
      Math.abs(clip.lufs - EPISODE_MASTER.lufs) <= 1,
      `ADR-047 — episodul măsoară ${clip.lufs.toFixed(1)} LUFS, ținta e ${EPISODE_MASTER.lufs}`
    );
    assert.ok(clip.truePeak <= EPISODE_MASTER.truePeak, "vârful episodului rămâne sub plafon");

    // O listă de intrări nepotrivită ar muta fiecare felie cu un loc: episodul ar
    // ieși din alt sunet, fără ca nimic să scârțâie. Se oprește pe nume, nu pe ffmpeg.
    assert.throws(
      () =>
        renderSegments({
          segments: FIXTURE_SCRIPT,
          inputs: inputs.slice(1),
          out,
          master: EPISODE_MASTER,
          bitRate: EPISODE_BITRATE,
        }),
      /ADR-047/,
      "ADR-047 — câte felii, atâtea căi"
    );
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});

test("ADR-047: o „liniște” umplută cu zgomot pică legea liniștii", () => {
  const work = mkdtempSync(join(tmpdir(), "episod-zgomot-"));
  try {
    const [intro, first, second, outro] = fixtureInputs(work);
    // Aceeași durată, dar sunet în locul liniștii: legea se probează pe ce trebuie
    // să prindă — altfel ar fi verde degeaba, fiindcă `anullsrc` n-are cum să sune.
    const noise = toneClip(work, "zgomot.wav", { samples: RATE, lufs: UTTERANCE_MASTER.lufs - 20 });
    const filled: Segment[] = FIXTURE_SCRIPT.map((segment) =>
      segment.kind === "silence" && segment.seconds === 1
        ? { kind: "voice", text: "zgomot" }
        : segment
    );
    const out = renderFixture(work, filled, [
      intro as string,
      first as string,
      noise,
      second as string,
      outro as string,
    ]);
    const problems = silenceProblems(samplesOf(out, work), FIXTURE_SCRIPT);
    assert.equal(problems.length, 1, "exact liniștea umplută e problema");
    assert.match(problems[0] ?? "", /ADR-047/);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});

test("ADR-047: stingul nu dispare sub rostiri — câștigul vine din cele două niveluri comise", () => {
  const work = mkdtempSync(join(tmpdir(), "episod-sting-"));
  try {
    const out = renderFixture(work, FIXTURE_SCRIPT, fixtureInputs(work));
    const samples = samplesOf(out, work);
    const sting = peakDb(samples, ...insideOf(FIXTURE_SCRIPT, 0));
    const voice = peakDb(samples, ...insideOf(FIXTURE_SCRIPT, 1));
    assert.ok(
      Math.abs(sting - voice) <= 1,
      `ADR-047 — stingul stă la ${sting.toFixed(1)} dBFS, rostirea la ${voice.toFixed(1)} dBFS: ` +
        `lipsește câștigul derivat din STING_LOUDNESS și UTTERANCE_MASTER`
    );
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});

/* ------------------------------- identitatea episodului zilei (ADR-047) */

/** O intrare per segment cu fișier, cu bytes distincți — numele trebuie să depindă de ei. */
function identityInputs(work: string, script: readonly Segment[]): string[] {
  return script
    .filter((segment) => segment.kind !== "silence")
    .map((_, index) => {
      const file = join(work, `in-${index}.bin`);
      writeFileSync(file, Buffer.from(`felia ${index}`));
      return file;
    });
}

test("ADR-047: identitatea episodului — pauza schimbată sau un byte schimbat dau alt nume", () => {
  const work = mkdtempSync(join(tmpdir(), "episod-nume-"));
  try {
    const script = episodeScript(CARD);
    const inputs = identityInputs(work, script);
    const name = episodeFileName(script, inputs);
    assert.match(name, /^[a-z0-9]+\.episode\.mp3$/, "numele e hash-ul plus sufixul episodului");
    assert.equal(episodeFileName(script, inputs), name, "nimic schimbat = același nume");

    const longer: Segment[] = script.map((segment) =>
      segment.kind === "silence" && segment.seconds === SILENCE.forChild
        ? { kind: "silence", seconds: SILENCE.forChild + 1 }
        : segment
    );
    assert.notEqual(
      episodeFileName(longer, inputs),
      name,
      "ADR-047 — o pauză schimbată ar lăsa același nume peste alt episod"
    );

    const swapped = [...script];
    [swapped[1], swapped[2]] = [swapped[2] as Segment, swapped[1] as Segment];
    assert.notEqual(
      episodeFileName(swapped, inputs),
      name,
      "ADR-047 — ordinea rostirilor nu intră în nume"
    );

    writeFileSync(inputs[3] as string, Buffer.from("felia 3, voce re-acordată"));
    assert.notEqual(
      episodeFileName(script, inputs),
      name,
      "ADR-047 — o voce re-acordată ar lăsa același nume peste alt sunet"
    );
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});
