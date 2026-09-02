"use client";

import { useEffect, useState } from "react";
import { hiddenWords } from "../content";
import { tries } from "./format";
import {
  DeckBar,
  GameSkeleton,
  GameStatus,
  StatusAction,
  board,
  btnPrimary
} from "./ui";
import { useDeck } from "./use-deck";

/** Alfabetul românesc de pe tastatură — 28 de litere, grilă 7×4. */
const ALPHABET = "AĂÂBCDEFGHIÎJKLMNOPRSȘTȚUVXZ".split("");

const MAX_WRONG = 5;

/** Balonul se strânge cu fiecare greșeală; nimic nu se construiește morbid. */
const BALLOON_SIZES = ["text-2xl", "text-3xl", "text-4xl", "text-5xl", "text-6xl"];

export default function HiddenWordGame() {
  const deck = useDeck("ascuns", hiddenWords);
  const [guessed, setGuessed] = useState<string[]>([]);
  const [wrong, setWrong] = useState(0);

  const entry = deck.chosen[0];
  const word = entry?.word ?? "";

  useEffect(() => {
    setGuessed([]);
    setWrong(0);
  }, [deck.chosen]);

  const letters = word.split("");
  const won = word !== "" && letters.every((letter) => guessed.includes(letter));
  const lost = wrong >= MAX_WRONG;
  const over = won || lost;
  const remaining = MAX_WRONG - wrong;

  function pick(letter: string) {
    if (over || guessed.includes(letter)) return;
    setGuessed((now) => [...now, letter]);
    if (!letters.includes(letter)) setWrong((now) => now + 1);
  }

  if (!deck.ready || !entry) return <GameSkeleton />;

  return (
    <div>
      <GameStatus
        action={
          deck.seen > 1 ? (
            <StatusAction onClick={() => deck.restart()}>
              Ia-o de la capăt
            </StatusAction>
          ) : undefined
        }
      >
        Cuvântul {deck.seen} din {deck.total}
        {deck.round > 1 ? ` · runda ${deck.round}` : ""}
      </GameStatus>

      <DeckBar seen={deck.seen} total={deck.total} />

      <div
        className={
          board +
          " mt-3 flex flex-col items-center gap-5 p-4 text-center sm:gap-6 sm:p-6"
        }
      >
        <p className="text-pretty text-sm text-gray-600 sm:text-base">
          <span className="font-semibold text-indigo-600">Indiciu:</span>{" "}
          {entry.hint}
        </p>

        <div className="flex flex-wrap items-stretch justify-center gap-1.5">
          {letters.map((letter, index) => {
            const shown = guessed.includes(letter) || lost;
            return (
              <span
                key={index}
                className={
                  "flex min-h-[3rem] min-w-[2.25rem] items-center justify-center rounded-lg border-2 px-1 text-xl font-bold " +
                  (won
                    ? "motion-safe:animate-pop border-emerald-300 bg-emerald-50 text-emerald-800"
                    : lost && !guessed.includes(letter)
                      ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                      : shown
                        ? "border-gray-300 bg-gray-50 text-gray-900"
                        : "border-dashed border-gray-300 bg-white")
                }
              >
                {shown ? letter : ""}
              </span>
            );
          })}
        </div>

        <p className="min-h-[3.25rem] max-w-[40ch] text-balance leading-snug" aria-live="polite">
          {won ? (
            <span className="font-semibold text-emerald-700">
              🎉 Bravo! {word} — și balonul e întreg.
            </span>
          ) : lost ? (
            <span className="font-semibold text-gray-700">
              💨 S-a dezumflat balonul! Cuvântul era{" "}
              <span className="text-indigo-600">{word}</span>.
            </span>
          ) : (
            <span className="inline-flex flex-wrap items-center justify-center gap-2 text-gray-600">
              <span
                className={BALLOON_SIZES[remaining - 1] + " leading-none"}
                aria-hidden="true"
              >
                🎈
              </span>
              <span>Mai ai {tries(remaining)}.</span>
            </span>
          )}
        </p>

        {over ? (
          <button
            type="button"
            onClick={() => deck.next()}
            className={btnPrimary + " w-full sm:w-auto"}
          >
            Următorul cuvânt
          </button>
        ) : (
          <div className="grid w-full max-w-[26rem] grid-cols-7 gap-1.5">
            {ALPHABET.map((letter) => {
              const used = guessed.includes(letter);
              const hit = used && letters.includes(letter);
              return (
                <button
                  key={letter}
                  type="button"
                  disabled={used}
                  onClick={() => pick(letter)}
                  className={
                    "touch-manipulation flex min-h-[44px] items-center justify-center rounded-lg border text-base font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 " +
                    (hit
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : used
                        ? "border-gray-200 bg-gray-100 text-gray-300"
                        : "border-gray-300 bg-white text-gray-900 hover:border-indigo-400 hover:text-indigo-600")
                  }
                >
                  {letter}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <p className="mt-3 text-center text-sm text-gray-500">
        În grup: strigați literele pe rând — balonul e al tuturor.
      </p>
    </div>
  );
}
