/**
 * Setările API comise (ADR-014) — COD, nu .env; în .env rămân doar secretele
 * (ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID). Fără nicio dependență de Node,
 * ca să poată intra și în client (cheia vocii jocurilor, ADR-020).
 */
export const AUDIO_MODEL = "eleven_v3";
/** Integrala ARTICOLELOR (ADR-033): 128 kbps — plaja Apple, recomandarea Spotify; jocurile rămân la AUDIO_OUTPUT_FORMAT. */
export const ARTICLE_AUDIO_FORMAT = "mp3_44100_128";
export const AUDIO_OUTPUT_FORMAT = "mp3_44100_64";
export const VOICE_SETTINGS = { stability: 0.5, similarity_boost: 0.75, speed: 1.0 };
