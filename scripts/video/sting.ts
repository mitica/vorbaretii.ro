/**
 * Stingurile de marcă (ADR-030, reopen a5), partea pură: prompturile dintre care
 * alege operatorul — cel puțin două de întâmpinare (intro), cel puțin două de
 * încheiere (outro) — și corpul cererii de efecte sonore ElevenLabs. Sunetul e
 * semnătura muzicală a canalului cu gaița drept CARACTER (isteț, curios, un motiv
 * cu aer de fluierat) — nu zgomot de pasăre (operatorul, 2026-09-05: prima rundă
 * „n-are nimic cu pasărea", a doua, ciripit literal, „pare muzică pentru bebe");
 * prompturile spun SCOPUL și senzația, nu instrumente
 * și secunde („ElevenLabs e inteligent — spune-i ce vrei să obții"); durata e parametru al cererii, cea
 * din compoziție (`STINGS.<rol>.seconds`). Generatorul (`generate-sting.ts`)
 * doar le trimite.
 */

import type { TimeRange } from "./film";

export type StingRole = "intro" | "outro";

export const STING_PROMPTS: Record<StingRole, readonly string[]> = {
  intro: [
    "A short, warm musical signature opening a knowledge video for curious children, for a channel whose mascot is a clever, cheerful jay: a playful little melodic motif with a hint of a bird's whistle, bright and inviting, smart rather than babyish, not a nature recording.",
    "A friendly, quick musical hello for a children's educational channel hosted by a witty jay: a couple of light, whistled-feeling notes that make you smile, rising gently, clean and modern, never cutesy.",
    "A cheerful, curious sound logo for the start of a story-lesson for school-age kids, in the spirit of a clever jay mascot: melodic, whistle-like, warm and confident, with a smooth start.",
  ],
  outro: [
    "A short, warm musical sign-off closing a knowledge video for curious children, for a channel whose mascot is a clever, cheerful jay: a gentle melodic motif with a hint of a bird's whistle, settling and fading calmly, satisfied, smart rather than babyish.",
    "A friendly musical goodbye from a witty jay mascot at the end of a children's educational video: a few soft, whistled-feeling notes descending into a calm hush, clean and modern, never cutesy.",
    "A calm, content sound logo ending a story-lesson for school-age kids, in the spirit of a clever jay mascot: melodic, whistle-like, warm, easing into silence without an abrupt stop.",
  ],
};

type StingRequestBody = {
  text: string;
  duration_seconds: number;
  prompt_influence: number;
  output_format: string;
};

/** Cererea pentru un prompt: durata cerută de compoziție, influența promptului moderată, mp3 44,1 kHz. */
export function stingRequestBody(prompt: string, seconds: number): StingRequestBody {
  return {
    text: prompt,
    duration_seconds: seconds,
    prompt_influence: 0.4,
    output_format: "mp3_44100_128",
  };
}

/** Loudness-ul integrat („I: −26.0 LUFS”) din rezumatul filtrului ffmpeg `ebur128`; lipsa lui aruncă. */
export function parseLoudness(summary: string): number {
  const match = /^\s*I:\s*(-?[\d.]+)\s*LUFS/m.exec(summary);
  if (!match) throw new Error("rezumatul ebur128 n-are linia „I: … LUFS”");
  return Number(match[1]);
}

/** Câștigul (dB) care duce un loudness măsurat la țintă. */
export const gainDb = (measured: number, target: number): number => target - measured;

/** Fereastra previzualizării unui rol: salutul = începutul filmului, rămas-bunul = sfârșitul; un film mai scurt → tot. */
export function previewWindow(role: StingRole, filmSeconds: number, seconds: number): TimeRange {
  const span = Math.min(seconds, filmSeconds);
  return role === "intro"
    ? { start: 0, end: span }
    : { start: filmSeconds - span, end: filmSeconds };
}

/** Varianta `index` a unui rol, pe disc (assets/audio/brand). */
export const variantFile = (role: StingRole, index: number): string => `sting-${role}-${index}.mp3`;

/** Previzualizarea variantei, în out-video. */
export const previewName = (slug: string, role: StingRole, index: number): string =>
  `${slug}.sting-${role}-${index}.mp4`;
