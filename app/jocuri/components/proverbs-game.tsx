"use client";

import { Fragment, useEffect, useState } from "react";
import { proverbs } from "../content";
import { shuffleApart } from "./shuffle";
import { GameSkeleton, GameStatus, StatusAction, btnPrimary } from "./ui";
import { useDeck } from "./use-deck";

/** Patru perechi pe rundă: încap pe două coloane și pe cel mai mic telefon. */
const ROUND_SIZE = 4;

type ProverbItem = (typeof proverbs)[number];

const cell =
  "touch-manipulation flex min-h-[56px] w-full items-center rounded-xl border p-2.5 text-left text-sm font-medium leading-snug transition " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:p-4 sm:text-base";

const columnHead =
  "text-xs font-semibold uppercase tracking-[0.14em] text-gray-500";

export default function ProverbsGame() {
  const deck = useDeck("proverbe", proverbs, ROUND_SIZE);
  const [meanings, setMeanings] = useState<ProverbItem[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [nudge, setNudge] = useState(false);

  useEffect(() => {
    // Coloana din dreapta trebuie să fie în altă ordine decât cea din stânga.
    setMeanings(shuffleApart(deck.chosen));
    setPicked(null);
    setMatched([]);
    setWrong(null);
    setNudge(false);
  }, [deck.chosen]);

  useEffect(() => {
    if (wrong === null && !nudge) return;
    const timer = setTimeout(() => {
      setWrong(null);
      setNudge(false);
    }, 700);
    return () => clearTimeout(timer);
  }, [wrong, nudge]);

  function chooseMeaning(id: string) {
    if (matched.includes(id)) return;
    if (picked === null) {
      setNudge(true);
      return;
    }
    if (picked === id) {
      setMatched((now) => [...now, id]);
    } else {
      setWrong(id);
    }
    setPicked(null);
  }

  const done = deck.chosen.length > 0 && matched.length === deck.chosen.length;

  // Înțelesurile se amestecă abia după extragere; până atunci ar arăta runda veche.
  const inSync =
    meanings.length === deck.chosen.length &&
    meanings.every((item) => deck.chosen.includes(item));

  if (!deck.ready || deck.chosen.length === 0 || !inSync) {
    return <GameSkeleton />;
  }

  return (
    <div>
      <GameStatus
        action={
          <StatusAction onClick={() => deck.next()}>
            Runda următoare
          </StatusAction>
        }
      >
        {matched.length} din {deck.chosen.length} perechi găsite
      </GameStatus>

      {/* O singură grilă cu două coloane: rândul crește după cel mai înalt
          dintre cele două carduri, deci nimic nu iese din rândul lui. */}
      <div
        className="mt-3 grid grid-cols-2 items-stretch gap-2 sm:gap-3"
        role="group"
        aria-label="Potrivește proverbul cu înțelesul lui"
      >
        <h2 className={columnHead}>Proverbul</h2>
        <h2 className={columnHead}>Înțelesul</h2>

        {deck.chosen.map((item, row) => {
          const meaning = meanings[row];
          const leftMatched = matched.includes(item.id);
          const rightMatched = matched.includes(meaning.id);
          return (
            <Fragment key={item.id}>
              <button
                type="button"
                disabled={leftMatched}
                onClick={() => setPicked(item.id)}
                className={
                  cell +
                  " " +
                  (leftMatched
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : picked === item.id
                      ? "border-indigo-500 bg-white text-gray-900 ring-2 ring-indigo-200"
                      : "border-gray-200 bg-white text-gray-900 hover:border-gray-400")
                }
              >
                {item.proverb}
              </button>
              <button
                type="button"
                disabled={rightMatched}
                onClick={() => chooseMeaning(meaning.id)}
                className={
                  cell +
                  " " +
                  (rightMatched
                    ? "motion-safe:animate-pop border-emerald-200 bg-emerald-50 text-emerald-800"
                    : wrong === meaning.id
                      ? "motion-safe:animate-shake border-red-400 bg-red-50 text-red-800"
                      : "border-gray-200 bg-white text-gray-900 hover:border-gray-400")
                }
              >
                {meaning.meaning}
              </button>
            </Fragment>
          );
        })}
      </div>

      <div className="mt-4 flex min-h-[52px] items-center" aria-live="polite">
        {done ? (
          <button
            type="button"
            onClick={() => deck.next()}
            className={btnPrimary + " w-full sm:w-auto"}
          >
            🎉 Toate la locul lor — runda următoare
          </button>
        ) : (
          <p
            className={
              "text-sm transition " +
              (nudge
                ? "font-semibold text-pink-600"
                : picked
                  ? "font-semibold text-indigo-600"
                  : "text-gray-500")
            }
          >
            {picked
              ? "Acum apasă înțelesul lui."
              : "Apasă întâi un proverb din stânga."}
          </p>
        )}
      </div>
    </div>
  );
}
