/**
 * Stingurile de marcă (ADR-030, reopen a5), partea pură: prompturile dintre care
 * alege operatorul — două de întâmpinare (intro), două de încheiere (outro) —
 * și corpul cererii de efecte sonore ElevenLabs. Prompturile spun SCOPUL și
 * senzația, nu instrumente și secunde (operatorul, 2026-09-05: „ElevenLabs e
 * inteligent — spune-i ce vrei să obții"); durata e parametru al cererii, cea
 * din compoziție (`STINGS.<rol>.seconds`). Generatorul (`generate-sting.ts`)
 * doar le trimite.
 */

export type StingRole = "intro" | "outro";

export const STING_PROMPTS: Record<StingRole, readonly [string, string]> = {
  intro: [
    "A gentle, warm welcome sound for the opening of a children's storytelling video: soft, friendly and inviting, like a smile, rising a little and settling — never sharp, never startling.",
    "A soft, pleasant greeting for the start of a kids' story video, calm and quietly cheerful, as if a friendly little bird had just landed nearby to tell a tale; it begins smoothly, with no sudden hit.",
  ],
  outro: [
    "A calm, tender closing sound for the end of a children's story video: settling, warm and a little sleepy, like a goodnight, fading out gently into silence.",
    "A soft, satisfying farewell for the ending of a kids' educational film: reassuring and complete, quietly happy, easing away without any abrupt stop.",
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
