/**
 * Casa unică a convenției de nume a variantelor servite: din src-ul canonic
 * `…-1536.jpg` (rezolvat de registru) derivă srcset-ul complet. SVG-urile
 * n-au variante — întorc undefined, iar consumatorii le randează simplu.
 */

export function srcsetFor(src: string): string | undefined {
  if (!src.endsWith("-1536.jpg")) return undefined;
  const base = src.slice(0, -"-1536.jpg".length);
  return `${base}-768.jpg 768w, ${src} 1536w`;
}
