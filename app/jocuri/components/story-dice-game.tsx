"use client";

import { useEffect, useRef, useState } from "react";
import { storyDice, storyStarters } from "../content";
import {
  DeckBar,
  GameSkeleton,
  GameStatus,
  StatusAction,
  board,
  btnPrimary
} from "./ui";
import { useDeck } from "./use-deck";

type Die = (typeof storyDice)[number];

const ROLL_MS = 500;

/** Zarul se cere bucată cu bucată (count=1): așa poți rearunca unul singur. */
export default function StoryDiceGame() {
  const deck = useDeck("zaruri", storyDice, 1, false);
  const [dice, setDice] = useState<(Die | null)[]>([null, null, null]);
  const [rolling, setRolling] = useState<boolean[]>([false, false, false]);
  const [rollCount, setRollCount] = useState(0);
  const [calm, setCalm] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setCalm(
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
    );
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const anyRolling = rolling.some(Boolean);
  const hasDice = dice.every((die) => die !== null);
  const starter = hasDice
    ? storyStarters[(rollCount - 1 + storyStarters.length) % storyStarters.length]
    : null;

  function land(nextDice: (Die | null)[], indexes: number[]) {
    setDice(nextDice);
    setRolling((now) => now.map((spins, i) => (indexes.includes(i) ? false : spins)));
  }

  function rollAll() {
    if (anyRolling) return;
    const drawn = [deck.next()[0], deck.next()[0], deck.next()[0]];
    setRollCount((now) => now + 1);
    if (calm) {
      setDice(drawn);
      return;
    }
    setRolling([true, true, true]);
    timers.current.push(setTimeout(() => land(drawn, [0, 1, 2]), ROLL_MS));
  }

  function rollOne(index: number) {
    if (anyRolling || !hasDice) return;
    const [drawn] = deck.next();
    const nextDice = dice.map((die, i) => (i === index ? drawn : die));
    if (calm) {
      setDice(nextDice);
      return;
    }
    setRolling((now) => now.map((spins, i) => (i === index ? true : spins)));
    timers.current.push(setTimeout(() => land(nextDice, [index]), ROLL_MS));
  }

  function restart() {
    const first = deck.restart()[0];
    const drawn = [first, deck.next()[0], deck.next()[0]];
    setRollCount((now) => now + 1);
    setRolling([false, false, false]);
    setDice(drawn);
  }

  if (!deck.ready) return <GameSkeleton />;

  return (
    <div>
      <GameStatus
        action={
          deck.seen > 3 ? (
            <StatusAction onClick={restart}>Ia-o de la capăt</StatusAction>
          ) : undefined
        }
      >
        {deck.seen} din {deck.total} imagini
        {deck.round > 1 ? ` · runda ${deck.round}` : ""}
      </GameStatus>

      <DeckBar seen={deck.seen} total={deck.total} />

      <div
        className={
          board + " mt-3 flex flex-col items-center gap-5 p-4 sm:gap-6 sm:p-6"
        }
      >
        <div className="grid w-full max-w-[24rem] grid-cols-3 gap-2 sm:gap-3">
          {dice.map((die, index) => (
            <button
              key={index}
              type="button"
              disabled={!hasDice || anyRolling}
              onClick={() => rollOne(index)}
              aria-label={
                die ? `Rearuncă zarul: ${die.word}` : "Zarul așteaptă aruncarea"
              }
              className={
                "touch-manipulation flex min-h-[6rem] flex-col items-center justify-center gap-1 rounded-xl border-2 p-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 " +
                (die
                  ? "border-gray-300 bg-white hover:border-indigo-400"
                  : "cursor-default border-dashed border-gray-300 bg-white")
              }
            >
              <span className="text-4xl leading-none sm:text-5xl" aria-hidden="true">
                {rolling[index] ? (
                  <span className="inline-block motion-safe:animate-spin">🎲</span>
                ) : die ? (
                  die.emoji
                ) : (
                  "🎲"
                )}
              </span>
              <span
                className={
                  "text-sm font-semibold " +
                  (die && !rolling[index] ? "text-gray-900" : "text-gray-400")
                }
              >
                {rolling[index] ? "…" : die ? die.word : "?"}
              </span>
            </button>
          ))}
        </div>

        <p
          className="min-h-[3rem] max-w-[40ch] text-balance text-center leading-snug"
          aria-live="polite"
        >
          {hasDice && !anyRolling ? (
            <>
              <span className="text-gray-600">
                Spune o poveste cu toate trei. Începe cu:
              </span>{" "}
              <span className="font-serif italic text-gray-900">„{starter}”</span>
            </>
          ) : anyRolling ? (
            <span className="text-gray-500">Se rostogolesc…</span>
          ) : (
            <span className="text-gray-400">
              Apasă butonul și vezi ce imagini îți ies.
            </span>
          )}
        </p>

        {hasDice ? (
          <p className="text-xs text-gray-500">
            Atinge un zar ca să-l rearunci doar pe el.
          </p>
        ) : null}
      </div>

      <div className="mt-3 flex justify-center sm:mt-4">
        <button
          type="button"
          onClick={rollAll}
          disabled={anyRolling}
          className={btnPrimary + " w-full sm:w-64 sm:text-lg"}
        >
          {hasDice ? "Aruncă din nou" : "Aruncă zarurile"}
        </button>
      </div>

      <p className="mt-3 text-center text-sm text-gray-500">
        Singur: spui tu povestea. În grup: fiecare adaugă câte o propoziție.
      </p>
    </div>
  );
}
