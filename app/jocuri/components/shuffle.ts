/**
 * Amestecările jocurilor. Logică pură, testată în scripts/test-games.ts.
 * Se apelează doar în browser (după montare), ca să nu strice hidratarea.
 */

/** Fisher-Yates. */
export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // i și j sunt în interval prin construcție; sub noUncheckedIndexedAccess
    // schimbul se face prin valori citite o dată.
    const a = copy[i] as T;
    const b = copy[j] as T;
    copy[i] = b;
    copy[j] = a;
  }
  return copy;
}

/** Amestecă indecșii literelor unui cuvânt, dar niciodată în ordinea corectă. */
export function scrambleIndexes(word: string): number[] {
  const indexes = word.split("").map((_, i) => i);
  if (word.length < 2) return indexes;
  for (let attempt = 0; attempt < 20; attempt++) {
    const mixed = shuffle(indexes);
    if (mixed.map((i) => word[i]).join("") !== word) return mixed;
  }
  return [...indexes].reverse();
}

/** Amestecă lista, dar niciodată în exact aceeași ordine. */
export function shuffleApart<T>(items: readonly T[]): T[] {
  if (items.length < 2) return [...items];
  for (let attempt = 0; attempt < 20; attempt++) {
    const mixed = shuffle(items);
    if (mixed.some((item, index) => item !== items[index])) return mixed;
  }
  return [...items].reverse();
}
