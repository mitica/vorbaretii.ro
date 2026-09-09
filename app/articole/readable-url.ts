/**
 * URL-ul unei surse, pregătit pentru citit: fără schemă, cu diacriticele
 * întoarse din procent-codare.
 *
 * `decodeURIComponent` ARUNCĂ pe un `%` care nu deschide o secvență validă
 * (`…/100%_sare` e un URL perfect valid, pe care schema îl acceptă) — iar
 * aruncarea aici cădea la build, nu la rulare. Ce nu se poate decoda se arată
 * așa cum e.
 */
export function readableUrl(url: string): string {
  const bare = url.replace(/^https?:\/\//, "");
  try {
    return decodeURIComponent(bare);
  } catch {
    return bare;
  }
}
