/**
 * Casa vocii jocurilor (ADR-050): care jocuri au voce, cheia vocii (directorul),
 * forma rostirilor compuse. PUR — merge și în client
 * (butonul mascotei), și în scripturi (generator, lege).
 *
 * O ROSTIRE = textul exact trimis vocii; fișierul ei = hashId(text).mp3 în
 * directorul cheii curente. Text schimbat = fișier nou; setări schimbate =
 * key nouă (dir nou, cel vechi măturat de generator).
 */
import { AUDIO_MODEL, VOICE_SETTINGS } from "../../articole/audio-settings";
import { hashId } from "../content/ids";

/** Ritmul vocii la jocuri (verdictul probei: cel al integralei). */
export const SPEED = 1.0;

/* --------------------------------------- calitatea rostirii (ADR-050) */

/**
 * Sursa: plafonul contului la 44,1 kHz. `pcm_44100` e blocat pe Pro, iar
 * `pcm_24000` — deși fără pierderi — taie tot peste 12 kHz și tocește sibilantele
 * (ș, ț, s, j, z), adică exact vitrina frământărilor de limbă.
 */
export const VOICE_SOURCE_FORMAT = "mp3_44100_192";
/**
 * Formatul SERVIT: o singură re-encodare din sursă. La 192 servit, cea mai lungă
 * rostire ar da 138 KB și ar sparge `FILE_BUDGET`; la 128 dă 91 KB.
 */
export const SERVED_FORMAT = { bitRate: 128_000, sampleRate: 44_100, channels: 1 };
/** Aceeași cifră, în forma pe care o cere ffmpeg — derivată, nu scrisă a doua oară. */
export const VOICE_SERVED_BITRATE = `${SERVED_FORMAT.bitRate / 1000}k`;
/**
 * Ce trebuie să MĂSOARE fișierul comis. −24 nu e o preferință: la −16, 95 din
 * cele 122 de rostiri ar fi cerut limitare (vârfurile vorbirii ăsteia stau la
 * 16,5 dB peste nivel, median); la −24, niciuna. Deci câștig pur liniar, zero
 * compresie. Marja pentru overshoot-ul codării o aplică `gainFor`, nu numărul de aici.
 */
export const UTTERANCE_MASTER = { lufs: -24, truePeak: -1 };
/** Praguri ale LEGII, nu ale artefactului — de-aia stau în afara amprentei. */
export const EDGE_THRESHOLD_DB = -40;
export const LEVEL_TOLERANCE_LU = 1;

/** Parametrii lustruirii; orice cifră de aici schimbă fișierul, deci intră în cheie. */
export const POLISH = {
  highpassHz: 50,
  trimThresholdDb: -50,
  keepSeconds: 0.05,
  fadeInSeconds: 0.008,
  fadeOutSeconds: 0.015,
};
/**
 * Amprenta lustruirii, pe un ȘIR compus câmp cu câmp, în ordine scrisă aici —
 * nu `JSON.stringify` peste obiect: reordonarea a două câmpuri ar mătura 504
 * fișiere pentru o editare cosmetică. Se calculează, nu se bumpează de mână.
 */
export function polishDigest(polish: typeof POLISH, master: typeof UTTERANCE_MASTER): string {
  return hashId(
    `hp${polish.highpassHz}|tr${polish.trimThresholdDb}|keep${polish.keepSeconds}` +
      `|in${polish.fadeInSeconds}|out${polish.fadeOutSeconds}|I${master.lufs}|TP${master.truePeak}`
  );
}
/** Un fișier peste bugetul ăsta pică legea (ADR-050). */
export const FILE_BUDGET = 120 * 1024;
/** Rădăcina fișierelor, relativ la repo; servită sub /assets/audio/jocuri. */
export const VOICE_DIR = "public/assets/audio/jocuri";

export type GameVoiceSettings = {
  /** Tag de emoție prefixat textului trimis (intră în key, nu în hash). */
  tag?: string;
};

/** Jocurile cu voce (designul FEAT-011, decizia 1) — cheia = slug-ul din games.ts. */
export const VOICED_GAMES: Readonly<Record<string, GameVoiceSettings>> = {
  "ghicitori": {},
  "roata-cuvintelor": {},
  "curiozitati": {},
  "proverbe-pereche": {},
  "framantari-de-limba": {},
  "spune-o-altfel": {},
  "categorii": {},
  "vinde-mi-asta": {},
};

export function voiceKey(slug: string): string {
  const { stability, similarity_boost } = VOICE_SETTINGS;
  const source = VOICE_SOURCE_FORMAT.split("_").pop();
  const digest = polishDigest(POLISH, UTTERANCE_MASTER);
  const settings = `s${stability}_b${similarity_boost}_sp${SPEED}`;
  const base = `${AUDIO_MODEL}_src${source}_out${VOICE_SERVED_BITRATE}_${settings}_p${digest}`;
  const tag = VOICED_GAMES[slug]?.tag;
  return tag ? `${base}_t${tag}` : base;
}

/** Textul trimis vocii: tagul jocului (dacă e) + rostirea. */
export function requestText(slug: string, utterance: string): string {
  const tag = VOICED_GAMES[slug]?.tag;
  return tag ? `[${tag}] ${utterance}` : utterance;
}

export function hasVoice(slug: string): boolean {
  return Object.prototype.hasOwnProperty.call(VOICED_GAMES, slug);
}

/** URL-ul servit al unei rostiri. */
export function audioPath(slug: string, utterance: string): string {
  return `/assets/audio/jocuri/${slug}/${voiceKey(slug)}/${hashId(utterance)}.mp3`;
}

/* ----------------------------------------------- rostirile compuse (o casă) */

export function categoryUtterance(prompt: string): string {
  return `Spune ${prompt}!`;
}

export function tabooUtterance(word: string, forbidden: readonly string[]): string {
  return `${word}. Fără să spui: ${forbidden.join(", ")}.`;
}

export function bonusUtterance(bonus: string): string {
  return `Argument bonus: ${bonus}`;
}
