import ClubInvite from "@/app/components/club-invite";
import { pillAge } from "@/app/components/ui";
import type { Game } from "../games";
import WelcomeBack from "./welcome-back";

type Props = {
  game: Game;
  children: React.ReactNode;
};

/**
 * Rama unui joc.
 *
 * Jocul e un bloc compact, de înălțimea lui: titlu scurt, instrucțiune de o
 * frază, tabla dedesubt, invitația la club după ea. Nimic nu se întinde ca să
 * umple ecranul — pe un monitor înalt, spațiul rămâne în jurul jocului, nu
 * înăuntrul lui, cu tabla plutind departe de butonul ei.
 *
 * Toate trei stau pe **aceeași coloană** (`max-w-2xl`): antetul, tabla și
 * invitația. Trei lățimi diferite una sub alta se văd ca trei blocuri
 * nealiniate, nu ca o pagină.
 */
export default function GameShell({ game, children }: Props) {
  return (
    <>
      <div className="mx-auto flex w-full max-w-2xl flex-col px-4 pb-8 pt-3 sm:px-6 sm:pb-10 sm:pt-5">
        <div className="flex items-center justify-between gap-3">
          <a
            href="/jocuri"
            className="touch-manipulation -ml-2 -mt-1 inline-flex min-h-[44px] items-center rounded-lg px-2 text-sm font-semibold text-gray-500 transition hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            &larr; Toate jocurile
          </a>
          <span className={pillAge + " shrink-0"}>de la {game.ages} ani</span>
        </div>

        <header className="mt-2.5 flex items-start gap-3">
          <span className="text-3xl leading-none sm:text-4xl" aria-hidden="true">
            {game.emoji}
          </span>
          <div className="min-w-0">
            <h1 className="text-balance text-2xl font-bold leading-tight tracking-tight text-gray-900 sm:text-3xl">
              {game.title}
            </h1>
            <p className="mt-1 text-pretty text-sm leading-snug text-gray-600 sm:text-base">
              {game.howTo}
            </p>
          </div>
        </header>

        <WelcomeBack game={game} />

        <div className="mt-4 sm:mt-6">{children}</div>
      </div>

      <aside className="mx-auto w-full max-w-2xl px-4 pb-12 sm:px-6">
        <ClubInvite
          title="E mai distractiv cu alți copii."
          body="Așa ne jucăm la club: același grup de copii, în fiecare săptămână, o oră în care româna e limba dintre prieteni. Prima lecție e gratuită."
          event="demo_joc"
        />
      </aside>
    </>
  );
}
