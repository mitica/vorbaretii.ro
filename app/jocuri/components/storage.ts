/**
 * Memoria locală a jocurilor.
 *
 * Ține minte, **numai în browserul copilului**, ce s-a jucat deja: ce ghicitori
 * au ieșit, ce cuvinte s-au dezlegat, care e cel mai bun rezultat la memorie.
 * Nimic nu pleacă de aici — fără cont, fără server, fără date trimise nicăieri
 * (vezi docs/decisions.md D8).
 *
 * Nu aruncă niciodată: în navigare privată sau cu stocarea blocată,
 * `localStorage` aruncă la scriere. Un joc nu are voie să se strice din asta —
 * pur și simplu nu ține minte nimic.
 */

const PREFIX = "vorbaretii.jocuri.";

export function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return parsed === null || parsed === undefined ? fallback : (parsed as T);
  } catch {
    return fallback;
  }
}

export function saveJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* stocare plină sau blocată — jocul merge mai departe, doar nu ține minte */
  }
}
