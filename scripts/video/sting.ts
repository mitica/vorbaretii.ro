/**
 * Stingurile de marcă (ADR-030, reopen a5), partea pură: prompturile dintre care
 * alege operatorul — cel puțin două de întâmpinare (intro), cel puțin două de
 * încheiere (outro) — și corpul cererii de efecte sonore ElevenLabs. Sunetul e AL
 * PĂSĂRII (salutul și rămas-bunul gaiței — operatorul, 2026-09-05: prima rundă
 * „n-are nimic cu pasărea"); prompturile spun SCOPUL și senzația, nu instrumente
 * și secunde („ElevenLabs e inteligent — spune-i ce vrei să obții"); durata e parametru al cererii, cea
 * din compoziție (`STINGS.<rol>.seconds`). Generatorul (`generate-sting.ts`)
 * doar le trimite.
 */

export type StingRole = "intro" | "outro";

export const STING_PROMPTS: Record<StingRole, readonly string[]> = {
  intro: [
    "A small friendly bird greeting children at the very start of a story: one warm, melodic hello chirp, soft and bright, inviting, with a smile in it.",
    "A cheerful cartoon jay saying hello in bird-song to the children who just arrived, playful and musical, light and welcoming, never harsh.",
    "A little bird's cheerful greeting song opening a story for young children: sweet chirps that turn into a warm, gentle musical hello.",
  ],
  outro: [
    "A small friendly bird saying goodbye to children at the end of a story: a soft, tender, slightly sleepy chirp that settles down and fades, like a goodnight.",
    "A cheerful cartoon jay's calm farewell in bird-song as the story ends: quiet, warm, content, drifting away into silence.",
    "A little bird's goodnight song closing a story for young children: a few sweet, drowsy chirps easing into a gentle, peaceful hush.",
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
