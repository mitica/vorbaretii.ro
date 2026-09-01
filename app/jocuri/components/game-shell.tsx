import { whatsappUrl } from "@/lib/contact";
import TrackLink from "@/app/components/track-link";
import type { Game } from "../games";

type Props = {
  game: Game;
  children: React.ReactNode;
};

export default function GameShell({ game, children }: Props) {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10 sm:py-14">
      <a
        href="/jocuri"
        className="text-sm font-semibold text-gray-500 transition hover:text-gray-800"
      >
        &larr; Toate jocurile
      </a>

      <header className="mt-6">
        <span className="text-4xl" aria-hidden="true">
          {game.emoji}
        </span>
        <h1 className="mt-3 text-balance text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {game.title}
        </h1>
        <p className="mt-3 text-pretty text-lg text-gray-600">
          {game.howTo}
        </p>
      </header>

      <div className="mt-9">{children}</div>

      <aside className="mt-14 rounded-2xl bg-gradient-to-r from-pink-50 to-indigo-50 p-6 sm:p-7">
        <h2 className="text-lg font-bold text-gray-900">
          E mai distractiv cu alți copii.
        </h2>
        <p className="mt-2 max-w-[52ch] text-pretty text-gray-600">
          Așa ne jucăm la club: același grup de copii, în fiecare săptămână, o
          oră în care româna e limba dintre prieteni. Prima lecție e gratuită.
        </p>
        <TrackLink
          href={whatsappUrl}
          event="demo_joc"
          className="mt-5 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-pink-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-pink-500 sm:inline-flex sm:w-auto"
        >
          Rezervă lecția demo gratuită
        </TrackLink>
      </aside>
    </div>
  );
}
