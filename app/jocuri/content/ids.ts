/** Id-uri derivate din text — djb2/base36; un text editat redevine „nevăzut”. */

/** djb2, în base36. Scurt, stabil și suficient pentru câteva sute de texte. */
export function hashId(text: string): string {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

export function withIds<T extends object>(
  items: readonly T[],
  key: (item: T) => string
): (T & { id: string })[] {
  return items.map((item) => ({ ...item, id: hashId(key(item)) }));
}

/* ------------------------------------------------------------------ roata */
