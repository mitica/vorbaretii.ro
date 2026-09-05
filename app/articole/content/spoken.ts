/**
 * Textul VORBIT — casa pură a tagurilor de emoție (ADR-014, ADR-023). Tagurile
 * `[curious]`, `[whispers]`… nu se rostesc: alinierea, filmul și bula adresează
 * textul fără ele. «voce» = textul beat-ului cu tagurile inline, NICIODATĂ
 * conținut nou — altfel pagina ar arăta un text și audio-ul ar rosti altul, iar
 * bugetul benzii ar guverna un șir nespus; legea o ține `voiceErrors`, apelată
 * din schemă. Fără Node — merge și în client, ca schema și bugetele.
 */

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

/** «voce» rostește exact textul: fără taguri și cu spațiile colapsate, șirurile coincid. */
function voiceMatchesText(voice: string, text: string): boolean {
  return normalize(spokenText(voice)) === normalize(text);
}

/** Erorile câmpului «voce» al unui beat: absent = nimic; gol (ADR-013); alt conținut decât textul (ADR-023). */
export function voiceErrors(text: string, voice: unknown, sid: string): string[] {
  if (voice === undefined) return [];
  if (typeof voice !== "string" || voice.trim() === "")
    return [`un beat din "${sid}" are «voce» goală — câmpul e opțional, nu vid (ADR-013)`];
  if (!voiceMatchesText(voice, text))
    return [
      `un beat din "${sid}" are «voce» care nu e textul lui cu taguri — textul vorbit diferă de text (ADR-023)`,
    ];
  return [];
}
