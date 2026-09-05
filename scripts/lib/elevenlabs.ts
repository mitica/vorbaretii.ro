/**
 * Apelul ElevenLabs, o singură casă pentru toate generatoarele (articole —
 * ADR-014; jocuri — ADR-020): cheia și vocea din .env, antetele, eroarea cu
 * status + text. Fiecare generator își alege endpoint-ul și își citește
 * răspunsul (JSON cu aliniere, sau mp3 brut).
 */
import "dotenv/config";
import { AUDIO_MODEL, VOICE_SETTINGS } from "../../app/articole/audio-naming";

const BASE_URL = "https://api.elevenlabs.io/v1/text-to-speech";

/** Cheia singură — efectele sonore n-au voce (ADR-030). */
function apiKey(): string {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY lipsă din .env");
  return key;
}

export function apiKeys(): { key: string; voice: string } {
  const key = process.env.ELEVENLABS_API_KEY;
  const voice = process.env.ELEVENLABS_VOICE_ID;
  if (!key || !voice) throw new Error("ELEVENLABS_API_KEY / ELEVENLABS_VOICE_ID lipsă din .env");
  return { key, voice };
}

/** POST pe `text-to-speech/<voce><suffix>` cu corpul dat; aruncă la orice status ne-ok. */
export async function ttsRequest(suffix: string, body: unknown): Promise<Response> {
  const { key, voice } = apiKeys();
  const response = await fetch(`${BASE_URL}/${voice}${suffix}`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok)
    throw new Error(`ElevenLabs HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
  return response;
}

const SOUND_URL = "https://api.elevenlabs.io/v1/sound-generation";

/** Efecte sonore (stingul de marcă): POST fără voce, răspunsul e mp3. */
export async function soundRequest(body: unknown): Promise<Response> {
  const response = await fetch(SOUND_URL, {
    method: "POST",
    headers: { "xi-api-key": apiKey(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok)
    throw new Error(`ElevenLabs HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
  return response;
}

/** Corpul cererii TTS pentru ARTICOLE (integrala, proba, coada episodului) — o casă (ADR-033). */
export function articleRequestBody(text: string): Record<string, unknown> {
  return { text, model_id: AUDIO_MODEL, voice_settings: VOICE_SETTINGS };
}
