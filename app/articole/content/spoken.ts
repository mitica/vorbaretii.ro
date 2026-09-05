/**
 * Textul VORBIT — casa pură a tagurilor de emoție (ADR-014, ADR-034). Tagurile
 * `[curious]`, `[whispers]`… nu se rostesc: alinierea, filmul și bula adresează
 * textul fără ele. «voce» = textul beat-ului cu tagurile inline din LISTA
 * CANONICĂ, niciodată conținut nou — altfel pagina ar arăta un text și audio-ul
 * ar rosti altul, iar un tag inventat ([pause]) ar pleca la ElevenLabs
 * necontrolat; legea o ține `voiceErrors`, apelată din schemă. Parantezele drepte
 * sunt rezervate tagurilor: un text de articol nu poartă `[…]` literal. Fără Node —
 * merge și în client, ca schema și bugetele.
 */

/** Tagurile eleven_v3 permise în articole (harta text→tag: skill-ul /audio) — o singură casă. */
export const EMOTION_TAGS = [
  "[laughs]",
  "[laughs harder]",
  "[starts laughing]",
  "[wheezing]",
  "[whispers]",
  "[sighs]",
  "[exhales]",
  "[sarcastic]",
  "[curious]",
  "[excited]",
  "[crying]",
  "[snorts]",
  "[mischievously]",
] as const;
export type EmotionTag = (typeof EMOTION_TAGS)[number];

export const TAG_RE = /\[[a-z ]+\]\s*/g;

export function spokenText(text: string): string {
  return text.replace(TAG_RE, "");
}

export type TagMark = { tag: string; spokenIndex: number };

/** Tagurile unui text și poziția lor în textul VORBIT — tagul colorează ce urmează după el. */
export function tagMarks(text: string): TagMark[] {
  return [...text.matchAll(TAG_RE)].map((match) => ({
    tag: match[0].trim(),
    spokenIndex: spokenText(text.slice(0, match.index)).length,
  }));
}

/** Câte taguri de emoție poartă un text (raportul manivelei: densitatea pe bandă). */
export function tagCount(text: string): number {
  return text.match(TAG_RE)?.length ?? 0;
}

const normalize = (text: string): string => text.replace(/\s+/g, " ").trim();
const BRACKET_RE = /\[[^\]]*\]/g;

/** Token-urile dintre paranteze care nu sunt taguri canonice — inventate ([pause]) sau scrise altfel ([Curious]). */
function unknownTags(voice: string): string[] {
  const known: readonly string[] = EMOTION_TAGS;
  return [...voice.matchAll(BRACKET_RE)].map((m) => m[0]).filter((tag) => !known.includes(tag));
}

/** «voce» rostește exact textul: fără taguri și cu spațiile colapsate, șirurile coincid. */
function voiceMatchesText(voice: string, text: string): boolean {
  return normalize(spokenText(voice)) === normalize(text);
}

/** Erorile «voce» ale unui beat: absent = nimic; gol; tag necunoscut; alt conținut decât textul (ADR-034). */
export function voiceErrors(text: string, voice: unknown, sid: string): string[] {
  if (voice === undefined) return [];
  if (typeof voice !== "string" || voice.trim() === "")
    return [`un beat din "${sid}" are «voce» goală — câmpul e opțional, nu vid (ADR-034)`];
  const unknown = unknownTags(voice);
  if (unknown.length > 0)
    return [
      `un beat din "${sid}" are în «voce» un tag necunoscut «${unknown[0]}» — tagurile permise: ${EMOTION_TAGS.join(", ")} (ADR-034)`,
    ];
  if (!voiceMatchesText(voice, text))
    return [
      `un beat din "${sid}" are «voce» care nu e textul lui cu taguri — textul vorbit diferă de text (ADR-034)`,
    ];
  return [];
}
