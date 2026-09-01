"use client";

import { useEffect, useState } from "react";
import { proverbIds, proverbs } from "../content";
import { shuffle } from "./shuffle";
import {
  GameSkeleton,
  GameStatus,
  StatusAction,
  btnPrimary
} from "./ui";
import { useRotation } from "./use-rotation";

/** Patru perechi pe rundă: încap pe două coloane și pe cel mai mic telefon. */
const ROUND_SIZE = 4;

const byId = new Map(proverbs.map((item) => [item.id, item]));

/** Coloana din dreapta trebuie să fie în altă ordine decât cea din stânga. */
function shuffleApart(ids: string[]): string[] {
  if (ids.length < 2) return [...ids];
  for (let attempt = 0; attempt < 20; attempt++) {
    const mixed = shuffle(ids);
    if (mixed.some((id, index) => id !== ids[index])) return mixed;
  }
  return [...ids].reverse();
}

const cell =
  "tap flex h-full w-full items-center rounded-xl border p-2.5 text-left text-[13px] font-medium leading-snug transition " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:p-4 sm:text-base";

export default function ProverbsGame() {
  const deck = useRotation("proverbe", proverbIds, ROUND_SIZE);
  const [meanings, setMeanings] = useState<string[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [nudge, setNudge] = useState(false);

  useEffect(() => {
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

  if (!deck.ready || deck.chosen.length === 0 || meanings.length === 0) {
    return <GameSkeleton />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <GameStatus
        action={
          <StatusAction onClick={() => deck.next()}>
            Runda următoare
          </StatusAction>
        }
      >
        {matched.length} din {deck.chosen.length} perechi găsite
      </GameStatus>

      <div className="mt-3 grid min-h-0 flex-1 grid-cols-2 gap-2 sm:gap-4">
        <div className="flex min-h-0 flex-col">
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
            Proverbul
          </h2>
          <ul className="grid flex-1 auto-rows-fr gap-2 sm:gap-3">
            {deck.chosen.map((id) => {
              const isMatched = matched.includes(id);
              return (
                <li key={id} className="min-h-0">
                  <button
                    type="button"
                    disabled={isMatched}
                    onClick={() => setPicked(id)}
                    className={
                      cell +
                      " " +
                      (isMatched
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : picked === id
                          ? "border-indigo-500 bg-white text-gray-900 ring-2 ring-indigo-200"
                          : "border-gray-200 bg-white text-gray-900 hover:border-gray-400")
                    }
                  >
                    {byId.get(id)?.proverb}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex min-h-0 flex-col">
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
            Înțelesul
          </h2>
          <ul className="grid flex-1 auto-rows-fr gap-2 sm:gap-3">
            {meanings.map((id) => {
              const isMatched = matched.includes(id);
              return (
                <li key={id} className="min-h-0">
                  <button
                    type="button"
                    disabled={isMatched}
                    onClick={() => chooseMeaning(id)}
                    className={
                      cell +
                      " " +
                      (isMatched
                        ? "pop border-emerald-200 bg-emerald-50 text-emerald-800"
                        : wrong === id
                          ? "shake border-red-400 bg-red-50 text-red-800"
                          : "border-gray-200 bg-white text-gray-900 hover:border-gray-400")
                    }
                  >
                    {byId.get(id)?.meaning}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="mt-3 flex min-h-[52px] items-center" aria-live="polite">
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
