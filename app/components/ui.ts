/**
 * Limbajul vizual comun al site-ului: butoane, carduri, pastile, etichete.
 * Toate paginile se îmbracă de aici — nu se mai scriu clase de buton de mână.
 * Jocurile își compun butoanele tot de aici (app/jocuri/components/ui.tsx).
 *
 * Standardul de colțuri: butoane și pastile de sine stătătoare `rounded-xl`,
 * carduri `rounded-2xl`, pastile `rounded-full`; acțiunile mici dintr-un
 * container `rounded-xl` (selectorul roții, linkurile discrete) rămân
 * `rounded-lg` — colțul interior e mai mic decât al cutiei, nu egal cu el.
 * Griurile de text: 900 (titluri), 600 (corp), 500 (secundar) — vezi D6.
 */

const btnBase =
  "touch-manipulation inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed";

/** Mărimi: sm = compact (header), md = standard, lg = CTA de erou. */
export const btnSizes = {
  sm: "min-h-[44px] px-3 text-sm",
  md: "min-h-[48px] px-5 text-base",
  lg: "min-h-[52px] px-6 py-3 text-base",
} as const;

export const btnVariants = {
  primary:
    "bg-pink-600 text-white shadow-sm hover:bg-pink-500 focus-visible:outline-pink-600 disabled:opacity-50",
  secondary:
    "bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-indigo-600 disabled:opacity-50",
  ghost:
    "border border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-900 focus-visible:outline-indigo-600 disabled:opacity-40",
  whatsapp: "bg-green-600 text-white shadow-sm hover:bg-green-500 focus-visible:outline-green-600",
  messenger: "bg-blue-600 text-white shadow-sm hover:bg-blue-500 focus-visible:outline-blue-600",
} as const;

export function btn(variant: keyof typeof btnVariants, size: keyof typeof btnSizes = "md"): string {
  return `${btnBase} ${btnSizes[size]} ${btnVariants[variant]}`;
}

/** Cardul alb de listă (jocuri pe index, teaser) — pe fundalul lavandă. */
export const cardWhite = "rounded-2xl border border-pink-100 bg-white shadow-sm";

/** Banda-card a invitației la club (sub jocuri, pe index). */
export const cardBand =
  "rounded-2xl border border-pink-200 bg-gradient-to-r from-pink-100 to-indigo-100";

/** Ținuta comună a cardurilor-link din liste (jocuri, articole): chrome-ul
 * fără display și fără culoarea de bord — pe alea le compune fiecare listă. */
export const cardLinkChrome =
  "touch-manipulation rounded-2xl border bg-white shadow-sm transition hover:shadow-md " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600";

/** Pastila de etichetă (tagurile articolelor). */
export const pillTag =
  "rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700";

/** Pastila de vârstă („7+", „de la 7 ani"). */
export const pillAge =
  "rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700";

/** Pastila de fapt din hero („o oră pe săptămână"). */
export const pillFact =
  "rounded-full border border-pink-100 bg-white px-3.5 py-1.5 text-sm font-medium text-gray-600 shadow-sm";

/** Eticheta de secțiune (eyebrow) — una singură, peste tot. */
export const eyebrow =
  "text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 sm:text-sm";
