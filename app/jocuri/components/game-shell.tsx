import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import ClubInvite from "@/app/components/club-invite";
import Mascot from "@/app/components/mascot/mascot";
import { GameVoice } from "../voice/context";
import MascotVoice from "../voice/mascot-voice";
import { VOICE_DIR, hasVoice, voiceKey } from "../voice/settings";
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
/** Hash-urile rostirilor cu fișier pe disc, citite la build (export static). */
function availableVoices(slug: string): string[] {
  const dir = join(process.cwd(), VOICE_DIR, slug, voiceKey(slug));
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => file.endsWith(".mp3"))
    .map((file) => file.slice(0, -4));
}

/** Jocurile cu voce primesc contextul vocii; restul rămân cum erau. */
function Voiced({ slug, children }: { slug: string; children: React.ReactNode }) {
  if (!hasVoice(slug)) return <>{children}</>;
  return (
    <GameVoice slug={slug} available={availableVoices(slug)}>
      {children}
    </GameVoice>
  );
}

export default function GameShell({ game, children }: Props) {
  return (
    <Voiced slug={game.slug}>
      <div className="mx-auto flex w-full max-w-2xl flex-col px-4 pb-8 pt-2 sm:px-6 sm:pb-10 sm:pt-4">
        {/* Antetul stă pe UN bloc: drumul înapoi, titlul și pastila de vârstă
            împart aceeași bandă. Instrucțiunea trece pe toată lățimea dedesubt —
            înghesuită în coloana dintre link și mascotă se rupea în trei rânduri.
            Pe telefon, fiecare rând de aici e ecran furat jocului (ADR-038). */}
        <header className="flex items-center gap-2 sm:gap-3">
          <a
            href="/jocuri"
            aria-label="Toate jocurile"
            className="touch-manipulation -ml-2 inline-flex min-h-[44px] shrink-0 items-center rounded-lg px-2 text-sm font-semibold text-gray-500 transition hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <span aria-hidden="true">&larr;</span>
            <span className="ml-1 hidden sm:inline">Toate jocurile</span>
          </a>

          <h1 className="min-w-0 flex-1 text-balance break-words text-xl font-bold leading-tight tracking-tight text-gray-900 sm:text-2xl">
            <span className="mr-1" aria-hidden="true">
              {game.emoji}
            </span>
            {game.title}
          </h1>

          {hasVoice(game.slug) ? <MascotVoice /> : <Mascot pose="liniste" size={56} />}
        </header>

        {/* Vârsta stă în capul instrucțiunii: pe telefon, pastila lângă titlu cădea
            pe rândul ei și lăsa antetul zdrențuit. */}
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-pretty text-sm leading-snug text-gray-600 sm:text-base">
          <span className={pillAge + " shrink-0"}>de la {game.ages} ani</span>
          <span className="min-w-0 flex-1">{game.howTo}</span>
        </p>

        <WelcomeBack game={game} />

        <div className="mt-3 sm:mt-5">{children}</div>
      </div>

      <aside className="mx-auto w-full max-w-2xl px-4 pb-12 sm:px-6">
        <ClubInvite
          title="E mai distractiv cu alți copii."
          body="Așa ne jucăm la club: același grup de copii, în fiecare săptămână, o oră în care româna e limba dintre prieteni. Prima lecție e gratuită."
          event="demo_joc"
        />
      </aside>
    </Voiced>
  );
}
