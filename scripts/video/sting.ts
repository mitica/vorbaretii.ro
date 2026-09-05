/**
 * Stingul de marcă (ADR-030), partea pură: cele trei prompturi dintre care alege
 * operatorul (o singură dată, la poartă) și corpul cererii de efecte sonore
 * ElevenLabs — durata e cea a filmului (`STING.seconds` la compoziție), nu
 * a fișierului. Generatorul (`generate-sting.ts`) doar le trimite.
 */

export const STING_PROMPTS = [
  "a short, bright two-note xylophone jingle with a tiny bird chirp at the end, playful, for a children's channel intro",
  "a cheerful jay bird call turning into a soft glockenspiel sparkle, 1.8 seconds",
  "a quick wooden flute trill followed by one warm marimba note, folk-flavoured, playful",
] as const;

type StingRequestBody = {
  text: string;
  duration_seconds: number;
  prompt_influence: number;
  output_format: string;
};

/** Cererea pentru un prompt: 1,8 s (durata intro-ului), influența promptului moderată, mp3 44,1 kHz. */
export function stingRequestBody(prompt: string): StingRequestBody {
  return {
    text: prompt,
    duration_seconds: 1.8,
    prompt_influence: 0.4,
    output_format: "mp3_44100_128",
  };
}
