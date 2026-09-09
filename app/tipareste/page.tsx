import type { Metadata } from "next";
import { eyebrow, eyebrowMuted } from "@/app/components/ui";
import { DICE_CUBES } from "./dice";
import DiceNet from "./dice-net";
import PrintPack from "./print-pack";
import PrintSheet from "./print-sheet";
import { RULES_CARD } from "./rules";

const pageTitle = "Pachetul de tipărit — jocurile în română, pe hârtie";
const pageDescription =
  "Cartonașele roții și zarurile de poveste, gata de tipărit pe A4. Fără cont, fără PDF, fără email.";
const pageImage = {
  url: "/assets/og/tipareste.png",
  width: 1200,
  height: 630,
  alt: "Pachetul de tipărit — Vorbăreții.ro",
};

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: "/tipareste" },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    siteName: "Vorbăreții.ro",
    type: "website",
    locale: "ro_RO",
    url: "/tipareste",
    images: [pageImage],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
    images: [pageImage.url],
  },
};

/**
 * Al patrulea loc de pe foaia zarurilor: cuvintele omului mare (`rules.ts`) și
 * marca. Bordura e linie de tăiere, ca la cartonașele roții; niciun fundal, ca
 * textul să iasă și cu „background graphics" stins (ADR-044).
 */
function RulesCard() {
  return (
    <div className="rounded-2xl border border-gray-200 p-4 print:rounded-none print:border-[0.4mm] print:border-gray-400 print:p-[7mm]">
      <h3 className={eyebrowMuted + " text-xs print:text-[9pt] print:text-gray-700"}>
        {RULES_CARD.heading}
      </h3>
      <p
        data-rules
        className="mt-3 font-serif text-sm leading-relaxed text-gray-900 sm:text-base print:mt-[4mm] print:text-[11.5pt] print:leading-snug print:text-black"
      >
        {RULES_CARD.text}
      </p>
      <p className="mt-4 text-xs text-gray-400 print:mt-[6mm] print:text-[8pt] print:text-black">
        {RULES_CARD.mark}
      </p>
    </div>
  );
}

/**
 * Pachetul de tipărit: pe ecran e o pagină obișnuită, la tipar ies foile.
 * Rama (marginea hârtiei, ruperile de pagină, antetul foii) e a lui
 * `PrintSheet` și a regulii `@page` din `app/globals.css`.
 *
 * Cele două foi ale roții stau în `PrintPack`, nu aici: setul ales e stare de
 * client, iar pagina asta e randată pe server. În DOM ies tot frați cu foaia
 * zarurilor, fiindcă `PrintPack` nu-și pune niciun înveliș peste ele.
 */
export default function PrintPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-5 sm:px-6 sm:pt-10 print:px-0 print:pb-0 print:pt-0">
      <header className="max-w-[52ch] print:hidden">
        <p className={eyebrow}>Gratuit, de tipărit acasă</p>
        <h1 className="mt-1 text-balance text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Pachetul de tipărit
        </h1>
        <p className="mt-2 text-pretty text-sm leading-relaxed text-gray-600 sm:mt-3 sm:text-lg">
          Două jocuri de masă pe hârtie: cartonașele roții și zarurile de poveste. Se taie cu
          foarfeca, se lipesc și rămân pe masă.
        </p>
      </header>

      {/* Cele trei foi stau în ACEEAȘI listă: ruperea de pagină a lui PrintSheet
          se uită după fratele următor, deci ultima foaie trebuie să fie ultimul
          copil al containerului, altfel iese o pagină albă în plus. */}
      <div className="mt-5 sm:mt-6 print:mt-0">
        {/* Comenzile de ecran, apoi foaia 1 (cele 12 cartonașe ale setului ales)
            și foaia 2 (versoul oglindit, cu mascota). */}
        <PrintPack />
        {/* Foaia 3 — trei desfășurate (cine · ce · unde) și, în al patrulea loc
            al grilei, cartonașul de reguli. Două nets pe rând: 87 + 8 + 87 =
            182mm, sub cei 190mm utili ai lui A4. */}
        <PrintSheet title="Zarurile de poveste">
          <div className="grid gap-6 sm:grid-cols-2 print:grid-cols-[87mm_87mm] print:gap-[8mm]">
            {DICE_CUBES.map((cube) => (
              <DiceNet key={cube.label} cube={cube} />
            ))}
            <RulesCard />
          </div>
        </PrintSheet>
      </div>
    </div>
  );
}
