/**
 * Evenimente pentru apăsările pe care pageviews NU le vede:
 *
 * - plecările din site (WhatsApp, Messenger) — pagina următoare nu e a noastră;
 * - gesturile care nu schimbă pagina — `copiaza_cartea`, pe /azi: cartea pleacă
 *   într-o conversație, iar noi n-am ști niciodată că s-a întâmplat.
 *
 * Navigările interne rămân în afara listei: se văd oricum în pageviews.
 *
 * Singurul sistem de analiză folosit e Simple Analytics (vezi app/layout.tsx).
 * Nu se trimite nimic despre copil și nimic din conținutul copiat — doar faptul
 * că butonul a fost apăsat.
 *
 * Se apelează exclusiv din browser (dintr-un onClick). Nu aruncă niciodată:
 * un blocant de reclame sau un script neîncărcat nu are voie să strice un clic.
 */

/** Funcția expusă de Simple Analytics, plus coada ei de dinainte de încărcare. */
type SaEvent = ((...args: unknown[]) => void) & { q?: unknown[][] };

type WindowWithSa = Window & { sa_event?: SaEvent };

export type CtaEvent =
  | "demo_hero_whatsapp"
  | "demo_hero_messenger"
  | "demo_header"
  | "demo_contact_whatsapp"
  | "demo_contact_messenger"
  | "demo_footer_whatsapp"
  | "demo_footer_messenger"
  | "demo_jocuri"
  | "demo_joc"
  | "demo_articol"
  | "copiaza_cartea";

/**
 * Scriptul Simple Analytics se încarcă `async`, deci un clic în prima secundă
 * poate să-l găsească neîncărcat. Coada asta e tiparul recomandat de ei:
 * evenimentele se adună în `sa_event.q`, iar scriptul le trimite la pornire.
 */
function saEvent(window: WindowWithSa): SaEvent {
  if (!window.sa_event) {
    const queue: SaEvent = function (...args: unknown[]) {
      queue.q ? queue.q.push(args) : (queue.q = [args]);
    };
    window.sa_event = queue;
  }
  return window.sa_event;
}

export function trackCta(event: CtaEvent) {
  if (typeof window === "undefined") return;

  try {
    saEvent(window as WindowWithSa)(event);
  } catch {
    /* analytics indisponibil — clicul merge mai departe, asta contează */
  }
}
