import type { Metadata } from "next";
import { eyebrow } from "@/app/components/ui";
import PrintPack from "./print-pack";
import PrintSheet from "./print-sheet";

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
        {/* Foaia 3 — trei zaruri desfășurate și cartonașul de reguli: TASK-0115 (harness-ul privat). */}
        <PrintSheet title="Zarurile de poveste" />
      </div>
    </div>
  );
}
