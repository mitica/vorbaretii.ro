/**
 * Casa unică a convenției de nume a variantelor servite: din src-ul canonic
 * `…-1536.jpg` (rezolvat de registru) derivă srcset-ul complet. SVG-urile
 * n-au variante — întorc undefined, iar consumatorii le randează simplu.
 * Tot aici stă bugetul de greutate al unei variante: compresia coboară calitatea
 * până intră, legea servirii îl verifică pe disc (ADR-012) — o singură cifră.
 */

/** Bugetul unei variante servite (ADR-012): compresia îl țintește, legea îl impune. */
export const MAX_SERVED_BYTES = 300 * 1024;

export function srcsetFor(src: string): string | undefined {
  if (!src.endsWith("-1536.jpg")) return undefined;
  const base = src.slice(0, -"-1536.jpg".length);
  return `${base}-768.jpg 768w, ${src} 1536w`;
}
