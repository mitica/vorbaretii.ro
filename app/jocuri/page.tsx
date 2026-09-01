import type { Metadata } from "next";
import { whatsappUrl } from "@/lib/contact";
import TrackLink from "@/app/components/track-link";
import { games } from "./games";

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
    <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <header className="max-w-[54ch]">
        <p className="text-lg font-semibold leading-6 text-indigo-600">
          Gratuit, fără cont și fără instalare
        </p>
        <h1 className="mt-4 text-balance text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Jocuri în română pentru copii
        </h1>
        <p className="mt-6 text-pretty text-lg leading-8 text-gray-600">
          Astea sunt jocurile pe care le folosim la club, ca să pornim
          conversația. Deschide-le cu copilul tău — se joacă la fel de bine pe
          telefon, pe tabletă sau pe calculator.
        </p>
      </header>

      <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <li key={game.slug}>
            <a
              href={`/jocuri/${game.slug}`}
              className="flex h-full flex-col rounded-2xl border border-pink-100 bg-white p-7 shadow-sm transition-shadow hover:shadow-lg"
            >
              <span className="text-4xl" aria-hidden="true">
                {game.emoji}
              </span>
              <h2 className="mt-5 text-xl font-bold text-gray-900">
                {game.title}
              </h2>
              <p className="mt-2 flex-1 text-gray-600">{game.tagline}</p>
              <p className="mt-5 text-sm font-semibold text-indigo-600">
                De la {game.ages} ani &rarr;
              </p>
            </a>
          </li>
        ))}
      </ul>

      <aside className="mt-14 rounded-2xl bg-gradient-to-r from-pink-50 to-indigo-50 p-6 sm:p-8">
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
          className="mt-6 flex min-h-[52px] w-full items-center justify-center rounded-xl bg-pink-600 px-5 py-3 text-center text-base font-semibold text-white transition hover:bg-pink-500 sm:inline-flex sm:w-auto sm:px-6"
        >
          Rezervă lecția demo gratuită
        </TrackLink>
      </aside>
    </div>
  );
}
