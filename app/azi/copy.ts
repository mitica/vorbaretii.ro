/**
 * „Copiază cartea" — trei drumuri, în ordinea în care merg:
 *
 * 1. `navigator.clipboard` — drumul modern, dar cere context sigur și, pe unele
 *    browsere, un gest de utilizator încă „proaspăt".
 * 2. un `textarea` scos din ecran + `document.execCommand("copy")` — vechi și
 *    depreciat, dar singurul care merge în browserul din WhatsApp.
 * 3. „manual" — n-a mers niciunul; pagina arată blocul de ținut apăsat.
 *
 * Nu aruncă niciodată: un clipboard refuzat nu are voie să strice apăsarea.
 */

/** `"ok"` = textul a ajuns în clipboard; `"manual"` = omul îl copiază singur. */
export type CopyResult = "ok" | "manual";

async function viaClipboard(text: string): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Cutia ascunsă stă `fixed` în afara ecranului, nu la `opacity: 0`: pe iOS,
 * selecția dintr-un element transparent e refuzată, cea din afara ecranului nu.
 * Trăiește cât ține copierea și se șterge chiar dacă aceasta crapă.
 */
function viaTextarea(text: string): boolean {
  const area = document.createElement("textarea");
  area.value = text;
  area.readOnly = true;
  area.setAttribute("aria-hidden", "true");
  area.className = "fixed -left-full top-0";
  document.body.appendChild(area);
  try {
    area.select();
    area.setSelectionRange(0, text.length);
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    area.remove();
  }
}

export async function copyText(text: string): Promise<CopyResult> {
  if (await viaClipboard(text)) return "ok";
  return viaTextarea(text) ? "ok" : "manual";
}
