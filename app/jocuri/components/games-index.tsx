"use client";

import { useEffect, useState } from "react";
import { cardLinkChrome } from "@/app/components/ui";
import { games, type Game } from "../games";
import { readLastVisit, readProgress, type GameProgress } from "../progress";

/**
 * Cardurile jocurilor + progresul copilului. Serverul randează cardurile la
 * fel pentru toată lumea; progresul se citește din localStorage după montare
 * și apare doar unde există ceva de arătat — la prima vizită nu se schimbă
 * nimic.
 */
function ProgressLine({ p, isLast }: { p: GameProgress; isLast: boolean }) {
  return (
    <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="h-1 w-full max-w-[7rem] overflow-hidden rounded-full bg-indigo-100">
        {/* Lățimea se calculează la rulare, deci nu poate fi o clasă. */}
        <span
          className="block h-full rounded-full bg-indigo-500"
          style={{ width: `${Math.round((p.seen / p.total) * 100)}%` }}
        />
      </span>
      <span className="text-xs font-semibold text-indigo-600">
        {p.round > 1 ? `runda ${p.round} · ` : ""}
        {p.seen} din {p.total}
      </span>
      {isLast && <span className="text-xs font-semibold text-pink-600">· continuă</span>}
    </span>
  );
}

function GameCard(props: { game: Game; p?: GameProgress; isLast: boolean }) {
  const { game, p, isLast } = props;
  return (
    <a
      href={`/jocuri/${game.slug}`}
      className={
        cardLinkChrome +
        " flex h-full items-center gap-3 p-2.5 sm:gap-4 sm:p-5 " +
        (isLast ? "border-pink-300 hover:border-pink-400" : "border-pink-100 hover:border-pink-200")
      }
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-50 to-indigo-50 text-xl sm:h-14 sm:w-14 sm:text-3xl"
        aria-hidden="true"
      >
        {game.emoji}
      </span>
      {/* `anywhere`: lățimea minimă a coloanei nu mai e cel mai lung cuvânt
          din titlu — la 320px cu font mărit se rupe cuvântul, nu pagina. */}
      <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
        <span className="block font-bold leading-tight text-gray-900 sm:text-lg">{game.title}</span>
        <span className="mt-0.5 block text-pretty text-xs leading-snug text-gray-600 sm:text-sm">
          {game.tagline}
        </span>
        {p && <ProgressLine p={p} isLast={isLast} />}
      </span>
      {/* Pastila compactă (px-2, nu pillAge): la 320px cu font 24px,
          cardul n-are niciun pixel de rezervă pentru px-2.5. */}
      <span className="shrink-0 self-center rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">
        <span className="sr-only">de la {game.ages} ani</span>
        <span aria-hidden="true">{game.ages}+</span>
      </span>
    </a>
  );
}

export default function GamesIndex({ hiddenSlugs = [] }: { hiddenSlugs?: string[] }) {
  const [progress, setProgress] = useState<Record<string, GameProgress>>({});
  const [lastSlug, setLastSlug] = useState<string | null>(null);
  const visible = games.filter((g) => !hiddenSlugs.includes(g.slug));

  useEffect(() => {
    const found: Record<string, GameProgress> = {};
    for (const game of games) {
      const p = readProgress(game.slug);
      if (p && p.seen > 0) found[game.slug] = p;
    }
    setProgress(found);
    setLastSlug(readLastVisit()?.slug ?? null);
  }, []);

  return (
    <ul className="mt-4 grid gap-2 sm:mt-8 sm:grid-cols-2 sm:gap-4">
      {visible.map((game) => {
        const p = progress[game.slug];
        const isLast = lastSlug === game.slug && p !== undefined;
        return (
          <li key={game.slug}>
            <GameCard game={game} p={p} isLast={isLast} />
          </li>
        );
      })}
    </ul>
  );
}
