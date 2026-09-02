import DailyRiddle from "@/app/jocuri/components/daily-riddle";
import { games } from "@/app/jocuri/games";

export default function GamesTeaser() {
  return (
    <section className="bg-gradient-to-r from-pink-50 to-indigo-50 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold leading-6 text-indigo-600">
              Gratuit, pentru oricine
            </p>
            <h2 className="mt-4 max-w-[22ch] text-balance text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Jocuri în română, de jucat chiar acum.
            </h2>
            <p className="mt-4 max-w-[52ch] text-pretty text-lg leading-8 text-gray-600">
              Jocurile pe care le folosim la club. Deschide-le cu copilul tău —
              nu e nevoie de cont, de instalare sau de înscriere.
            </p>
          </div>
          <a
            href="/jocuri"
            className="inline-flex min-h-[52px] shrink-0 items-center justify-center rounded-md bg-pink-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-pink-500"
          >
            Vezi toate jocurile
          </a>
        </div>

        <DailyRiddle className="mt-8" />

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.slice(0, 3).map((game) => (
            <li key={game.slug}>
              <a
                href={`/jocuri/${game.slug}`}
                className="flex h-full flex-col rounded-2xl border border-pink-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="text-3xl" aria-hidden="true">
                  {game.emoji}
                </span>
                <span className="mt-4 text-lg font-bold text-gray-900">
                  {game.title}
                </span>
                <span className="mt-2 text-gray-600">{game.tagline}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
