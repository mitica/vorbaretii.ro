/**
 * Nucleul PUR al calității vocii rostite (ADR-050): pragurile, clema de vârf și
 * cele trei predicate. Nimic de aici nu atinge discul sau ffmpeg — lustruirea și
 * măsurarea stau separat, ca legile să se vadă roșii pe măsurători fabricate,
 * exact ca `checkVoice` din `voice-law.ts`.
 *
 * Cele două funcții care CALCULEAZĂ întorc `null` când nu pot, în loc de
 * `string[]`: cine le cheamă știe numele fișierului, deci tot el compune mesajul.
 * Predicatele, care primesc deja totul, întorc problemele gata scrise.
 */

import { ENCODER_HEADROOM_DB, type MasterTarget } from "./loudness";

/**
 * Podeaua lui `ebur128`, nu `-Infinity` (măsurat 2026-09-11): două secunde de
 * tăcere digitală dau I = −70,0 LUFS, la fel un clip de 0,3 s, fiindcă sub 400 ms
 * nu se formează niciun bloc gated. Fără garda asta, un clip scurt ar primi zeci
 * de dB de câștig și ar ieși distorsionat.
 */
export const LOUDNESS_FLOOR = -70;

/** Ce se măsoară pe un fișier comis; `firstSample`/`lastSample` în dBFS. */
export type ClipMeasure = {
  lufs: number;
  truePeak: number;
  firstSample: number;
  lastSample: number;
  seconds: number;
  bitRate: number;
  sampleRate: number;
  channels: number;
};

export type AudioFormat = { bitRate: number; sampleRate: number; channels: number };
export type TrimOptions = { thresholdDb: number; keepSeconds: number; sampleRate: number };
export type TrimRange = { start: number; end: number };

/** Abaterea tolerată a bitrate-ului raportat: CBR-ul mp3 raportează cu câteva promile peste. */
const BIT_RATE_TOLERANCE = 0.02;

const amplitudeOf = (db: number): number => 32768 * 10 ** (db / 20);

/**
 * Capetele de tăiat: primul și ultimul eșantion peste prag, lărgite cu marja
 * păstrată. Comparația e pe MAGNITUDINEA eșantionului, nu pe vreo medie — un
 * prag de −50 dBFS taie exact ce e sub −50 dBFS, spre deosebire de
 * `silenceremove`, care la aceeași valoare mănâncă 150 ms dintr-un onset de
 * −45 dBFS (măsurat; de-aia tăierea e a noastră).
 *
 * `null` = niciun eșantion peste prag: nu există interval, iar asta se spune.
 */
export function trimPoints(
  samples: readonly number[],
  { thresholdDb, keepSeconds, sampleRate }: TrimOptions
): TrimRange | null {
  const limit = amplitudeOf(thresholdDb);
  let first = 0;
  while (first < samples.length && Math.abs(samples[first] as number) < limit) first++;
  if (first === samples.length) return null;
  let last = samples.length - 1;
  while (last > first && Math.abs(samples[last] as number) < limit) last--;
  const keep = Math.round(keepSeconds * sampleRate);
  return { start: Math.max(0, first - keep), end: Math.min(samples.length - 1, last + keep) };
}

/**
 * Câștigul LINIAR până la țintă, clemat de plafonul de vârf — niciun compresor,
 * niciun limitator. Plafonul efectiv lasă `ENCODER_HEADROOM_DB` codării mp3, care
 * depășește ușor la re-encodare. Când vârful are întâietate, fișierul rămâne SUB
 * țintă: `levelProblems` are ramura lui, explicită.
 */
export function gainFor(lufs: number, truePeak: number, target: MasterTarget): number | null {
  if (lufs <= LOUDNESS_FLOOR) return null;
  return Math.min(target.lufs - lufs, target.truePeak - ENCODER_HEADROOM_DB - truePeak);
}

/**
 * Capetele: TREAPTA de la graniță — primul și ultimul eșantion. Nicio măsură de
 * pantă: panta dintre două eșantioane vecine e forma de undă însăși, iar o lege
 * pe ea n-ar putea fi trecută de nicio lungime rezonabilă de estompare.
 */
export function edgeProblems(clip: ClipMeasure, thresholdDb: number): string[] {
  const problems: string[] = [];
  if (clip.firstSample > thresholdDb)
    problems.push(
      `ADR-050 — începe pe o treaptă la cap: ${clip.firstSample.toFixed(1)} dBFS, plafonul e ${thresholdDb}`
    );
  if (clip.lastSample > thresholdDb)
    problems.push(
      `ADR-050 — se termină pe o treaptă la coadă: ${clip.lastSample.toFixed(1)} dBFS, plafonul e ${thresholdDb}`
    );
  return problems;
}

/**
 * Nivelul: fișierul e la țintă ±`tolerance`, SAU e sub ea fiindcă stă lipit de
 * plafonul de vârf. A doua ramură e scrisă, nu tăcută — altfel un fișier peaky
 * ar pica o lege pe care n-are cum s-o treacă.
 */
export function levelProblems(
  clip: ClipMeasure,
  target: MasterTarget,
  tolerance: number
): string[] {
  const problems: string[] = [];
  if (clip.truePeak > target.truePeak)
    problems.push(
      `ADR-050 — vârf real ${clip.truePeak.toFixed(1)} dBTP, peste plafonul de ${target.truePeak}`
    );
  if (clip.lufs > target.lufs + tolerance)
    problems.push(`ADR-050 — ${clip.lufs.toFixed(1)} LUFS, peste ținta de ${target.lufs}`);
  const peakLimited = clip.truePeak >= target.truePeak - ENCODER_HEADROOM_DB - tolerance;
  if (clip.lufs < target.lufs - tolerance && !peakLimited)
    problems.push(
      `ADR-050 — ${clip.lufs.toFixed(1)} LUFS, sub ținta de ${target.lufs}, fără ca vârful s-o ceară`
    );
  return problems;
}

/**
 * Formatul FIȘIERULUI SERVIT. Cheia vocii e doar un nume de director: o regresie
 * a generatorului la 64 kbps ar lăsa cheia neschimbată, deci o aserțiune pe
 * cererea lui ar trece verde peste ea.
 */
export function formatProblems(clip: ClipMeasure, want: AudioFormat): string[] {
  const problems: string[] = [];
  if (Math.abs(clip.bitRate - want.bitRate) > want.bitRate * BIT_RATE_TOLERANCE)
    problems.push(`ADR-050 — ${clip.bitRate} bps, se aștepta ${want.bitRate}`);
  if (clip.sampleRate !== want.sampleRate)
    problems.push(`ADR-050 — ${clip.sampleRate} Hz, se aștepta ${want.sampleRate}`);
  if (clip.channels !== want.channels)
    problems.push(`ADR-050 — ${clip.channels} canale, se așteptau ${want.channels}`);
  return problems;
}

/* ------------------------------------------ lustruirea si masurarea (ADR-050) */

/**
 * Partea care atinge ffmpeg. Lantul are EXACT doua generatii cu pierderi — 192 la
 * model, 128 la servire — cu un WAV fara pierderi intre ele. Niciun limitator si
 * niciun `silenceremove`: taierea o calculeaza `trimPoints`, iar ffmpeg primeste
 * indici exacti, deci semantica e a noastra, nu a unui filtru cu implicit care se
 * schimba intre versiuni.
 */

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { POLISH, UTTERANCE_MASTER, VOICE_SERVED_BITRATE } from "../../app/jocuri/voice/settings";
import { measureLoudness, measureTruePeak, runFfmpeg } from "./loudness";

const SAMPLE_RATE = 44_100;
const dbOf = (sample: number): number =>
  sample === 0 ? -99 : 20 * Math.log10(Math.abs(sample) / 32768);

/** ffmpeg care intoarce PCM-ul brut (mono 16 biti) pe stdout; stderr ramane al apelantului. */
function decode(file: string): Promise<Int16Array> {
  return new Promise((resolve, reject) => {
    const run = spawn("ffmpeg", [
      ...["-v", "error", "-i", file, "-f", "s16le"],
      ...["-acodec", "pcm_s16le", "-ac", "1", "-ar", String(SAMPLE_RATE), "-"],
    ]);
    const chunks: Buffer[] = [];
    run.stdout.on("data", (c: Buffer) => chunks.push(c));
    run.on("error", () =>
      reject(new Error("ffmpeg lipsește — instalează-l (brew install ffmpeg)"))
    );
    run.on("close", (code) => {
      if (code !== 0) return reject(new Error(`ffmpeg a eșuat pe ${file}`));
      const bytes = Buffer.concat(chunks);
      resolve(new Int16Array(bytes.buffer, bytes.byteOffset, bytes.length >> 1));
    });
  });
}

function probe(file: string): { bitRate: number; sampleRate: number; channels: number } {
  const out = runFfmpeg(["-i", file, "-f", "null", "-"]);
  const line = /Audio: [^\n]*/.exec(out)?.[0] ?? "";
  return {
    bitRate: Number(/(\d+) kb\/s/.exec(line)?.[1] ?? 0) * 1000,
    sampleRate: Number(/(\d+) Hz/.exec(line)?.[1] ?? 0),
    channels: /\bmono\b/.test(line) ? 1 : 2,
  };
}

/** Tot ce masuram pe un fisier: nivel, varf, capete, durata, format. */
export async function measureClip(file: string): Promise<ClipMeasure> {
  const samples = await decode(file);
  const format = probe(file);
  return {
    lufs: measureLoudness(file),
    truePeak: measureTruePeak(file),
    firstSample: samples.length > 0 ? dbOf(samples[0] as number) : -99,
    lastSample: samples.length > 0 ? dbOf(samples[samples.length - 1] as number) : -99,
    seconds: samples.length / SAMPLE_RATE,
    ...format,
  };
}

/** Masoara o multime de fisiere cu `concurrency` procese deodata. */
export async function scanClips(
  paths: readonly string[],
  concurrency: number
): Promise<Map<string, ClipMeasure>> {
  const measured = new Map<string, ClipMeasure>();
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < paths.length) {
      const path = paths[next++] as string;
      measured.set(path, await measureClip(path));
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, paths.length) }, worker));
  return measured;
}

/**
 * Sursa → fisierul servit, cu o singura encodare. Pasul A taie exact, taie
 * infrasunetele si estompeaza capetele intr-un WAV; masuram pe el; pasul B aplica
 * un castig LINIAR si encodeaza. Temporarele stau intr-un director sters la final:
 * langa fisierul bun nu ajunge nimic, fiindca manivela face `git add` pe director.
 */
export async function polish(source: string, out: string): Promise<void> {
  const work = mkdtempSync(join(tmpdir(), "vorbaretii-polish-"));
  try {
    const trimmed = join(work, "taiat.wav");
    const samples = await decode(source);
    const range = trimPoints(Array.from(samples), {
      thresholdDb: POLISH.trimThresholdDb,
      keepSeconds: POLISH.keepSeconds,
      sampleRate: SAMPLE_RATE,
    });
    if (!range)
      throw new Error(`ADR-050 — ${source}: niciun eșantion peste prag, nimic de lustruit`);
    const seconds = (range.end - range.start + 1) / SAMPLE_RATE;
    const fadeOut = Math.max(0, seconds - POLISH.fadeOutSeconds).toFixed(4);
    runFfmpeg([
      ...[
        "-i",
        source,
        "-af",
        `atrim=start_sample=${range.start}:end_sample=${range.end},asetpts=N/SR/TB,` +
          `highpass=f=${POLISH.highpassHz},` +
          `afade=t=in:st=0:d=${POLISH.fadeInSeconds},` +
          `afade=t=out:st=${fadeOut}:d=${POLISH.fadeOutSeconds}`,
      ],
      ...["-ac", "1", "-ar", String(SAMPLE_RATE), trimmed],
    ]);
    const gain = gainFor(measureLoudness(trimmed), measureTruePeak(trimmed), UTTERANCE_MASTER);
    if (gain === null)
      throw new Error(`ADR-050 — ${source}: prea scurt sau tăcut ca să poată fi măsurat`);
    runFfmpeg([
      ...["-i", trimmed, "-af", `volume=${gain.toFixed(2)}dB`],
      ...["-ac", "1", "-ar", String(SAMPLE_RATE)],
      ...["-c:a", "libmp3lame", "-b:a", VOICE_SERVED_BITRATE, out],
    ]);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}
