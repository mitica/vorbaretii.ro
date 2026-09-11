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
