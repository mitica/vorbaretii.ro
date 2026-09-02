import type { Metadata } from "next";
import { whatsappUrl } from "@/lib/contact";
import TrackLink from "@/app/components/track-link";
import { btn, cardBand, eyebrow } from "@/app/components/ui";
import DailyRiddle from "./components/daily-riddle";
import GamesIndex from "./components/games-index";

export const metadata: Metadata = {
  title: "Jocuri în limba română pentru copii - Vorbăreții.ro",
  description:
    "Jocuri gratuite în limba română pentru copii de la 7 ani: roata cuvintelor, ghicitori, proverbe, anagrame și joc de memorie. Fără cont, fără instalare.",
  openGraph: {
    title: "Jocuri în limba română pentru copii - Vorbăreții.ro",
    description:
      "Jocuri gratuite în limba română pentru copii de la 7 ani: roata cuvintelor, ghicitori, proverbe, anagrame și joc de memorie.",
    siteName: "Vorbăreții.ro"
  }
};

export default function GamesPage() {
  return (
    <>
      <div className="min-h-[calc(100svh-4rem-1px)] mx-auto flex w-full max-w-4xl flex-col px-4 pb-6 pt-5 sm:px-6 sm:pt-10">
        <header className="max-w-[52ch]">
          <p className={eyebrow}>
            Gratuit, fără cont și fără instalare
          </p>
          <h1 className="mt-1 text-balance text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Jocuri în română pentru copii
          </h1>
          <p className="mt-2 text-pretty text-sm leading-relaxed text-gray-600 sm:mt-3 sm:text-lg">
            Jocurile pe care le folosim la club. Merg pe telefon, pe tabletă și
            pe calculator.
          </p>
        </header>

        <DailyRiddle className="mt-4 sm:mt-6" />

        <GamesIndex />
      </div>

      <aside className="mx-auto w-full max-w-4xl px-4 pb-12 sm:px-6">
        <div className={cardBand + " p-6 sm:p-8"}>
          <h2 className="text-balance text-2xl font-bold tracking-tight text-gray-900">
            Jocurile sunt începutul. Partea bună e cu cine te joci.
          </h2>
          <p className="mt-3 max-w-[54ch] text-pretty text-gray-600">
            La Vorbăreții, copilul tău intră într-un grup stabil de copii de
            vârsta lui — aceiași în fiecare săptămână, o oră, live, în română.
            Prima lecție e gratuită.
          </p>
          <TrackLink
            href={whatsappUrl}
            event="demo_jocuri"
            className={btn("primary", "lg") + " mt-6 w-full text-center sm:w-auto"}
          >
            Rezervă lecția demo gratuită
          </TrackLink>
        </div>
      </aside>
    </>
  );
}
