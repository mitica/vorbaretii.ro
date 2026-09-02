"use client";

import { useEffect, useState } from "react";
import { hiddenWords } from "../content";
import { tries } from "./format";
import { DeckHeader, GameSkeleton, board, btnPrimary } from "./ui";
import { useDeck } from "./use-deck";

/** Alfabetul românesc de pe tastatură — 28 de litere, grilă 7×4. */
const ALPHABET = "AĂÂBCDEFGHIÎJKLMNOPRSȘTȚUVXZ".split("");

const MAX_WRONG = 5;

/** Balonul se strânge cu fiecare greșeală; nimic nu se construiește morbid. */
const BALLOON_SIZES = ["text-2xl", "text-3xl", "text-4xl", "text-5xl", "text-6xl"];

type Outcome = { won: boolean; lost: boolean };

function slotClass(outcome: Outcome, shownMissed: boolean, shown: boolean) {
  if (outcome.won)
    return "motion-safe:animate-pop border-emerald-300 bg-emerald-50 text-emerald-800";
  if (shownMissed) return "border-indigo-200 bg-indigo-50 text-indigo-700";
  if (shown) return "border-gray-300 bg-gray-50 text-gray-900";
  return "border-dashed border-gray-300 bg-white";
}

function WordSlots(props: { letters: string[]; guessed: string[]; outcome: Outcome }) {
  return (
    <div className="flex flex-wrap items-stretch justify-center gap-1.5">
      {props.letters.map((letter, index) => {
        const guessedIt = props.guessed.includes(letter);
        const shown = guessedIt || props.outcome.lost;
        return (
          <span
            key={index}
            className={
              "flex min-h-[3rem] min-w-[2.25rem] items-center justify-center rounded-lg border-2 px-1 text-xl font-bold " +
              slotClass(props.outcome, props.outcome.lost && !guessedIt, shown)
            }
          >
            {shown ? letter : ""}
          </span>
        );
      })}
    </div>
  );
}

function BalloonStatus(props: { word: string; remaining: number; outcome: Outcome }) {
  if (props.outcome.won)
    return (
      <span className="font-semibold text-emerald-700">
        🎉 Bravo! {props.word} — și balonul e întreg.
      </span>
    );
  if (props.outcome.lost)
    return (
      <span className="font-semibold text-gray-700">
        💨 S-a dezumflat balonul! Cuvântul era <span className="text-indigo-600">{props.word}</span>
        .
      </span>
    );
  return (
    <span className="inline-flex flex-wrap items-center justify-center gap-2 text-gray-600">
      <span className={BALLOON_SIZES[props.remaining - 1] + " leading-none"} aria-hidden="true">
        🎈
      </span>
      <span>Mai ai {tries(props.remaining)}.</span>
    </span>
  );
}

function Keyboard(props: {
  letters: string[];
  guessed: string[];
  onPick: (letter: string) => void;
}) {
  return (
    <div className="grid w-full max-w-[26rem] grid-cols-7 gap-1.5">
      {ALPHABET.map((letter) => {
        const used = props.guessed.includes(letter);
        const hit = used && props.letters.includes(letter);
        return (
          <button
            key={letter}
            type="button"
            disabled={used}
            onClick={() => props.onPick(letter)}
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
  );
}

function HiddenBoard(props: {
  hint: string;
  word: string;
  letters: string[];
  guessed: string[];
  remaining: number;
  outcome: Outcome;
  onPick: (letter: string) => void;
  onNext: () => void;
}) {
  const over = props.outcome.won || props.outcome.lost;
  return (
    <div
      className={board + " mt-3 flex flex-col items-center gap-5 p-4 text-center sm:gap-6 sm:p-6"}
    >
      <p className="text-pretty text-sm text-gray-600 sm:text-base">
        <span className="font-semibold text-indigo-600">Indiciu:</span> {props.hint}
      </p>

      <WordSlots letters={props.letters} guessed={props.guessed} outcome={props.outcome} />

      <p className="min-h-[3.25rem] max-w-[40ch] text-balance leading-snug" aria-live="polite">
        <BalloonStatus word={props.word} remaining={props.remaining} outcome={props.outcome} />
      </p>

      {over ? (
        <button type="button" onClick={props.onNext} className={btnPrimary + " w-full sm:w-auto"}>
          Următorul cuvânt
        </button>
      ) : (
        <Keyboard letters={props.letters} guessed={props.guessed} onPick={props.onPick} />
      )}
    </div>
  );
}

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
  const outcome = { won, lost };
  const remaining = MAX_WRONG - wrong;

  function pick(letter: string) {
    if (over || guessed.includes(letter)) return;
    setGuessed((now) => [...now, letter]);
    if (!letters.includes(letter)) setWrong((now) => now + 1);
  }

  if (!deck.ready || !entry) return <GameSkeleton />;

  return (
    <div>
      <DeckHeader
        label="Cuvântul"
        seen={deck.seen}
        total={deck.total}
        round={deck.round}
        onRestart={() => deck.restart()}
      />

      <HiddenBoard
        hint={entry.hint}
        word={word}
        letters={letters}
        guessed={guessed}
        remaining={remaining}
        outcome={outcome}
        onPick={pick}
        onNext={() => deck.next()}
      />

      <p className="mt-3 text-center text-sm text-gray-500">
        În grup: strigați literele pe rând — balonul e al tuturor.
      </p>
    </div>
  );
}
