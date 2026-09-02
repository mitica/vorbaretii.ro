"use client";

import { useEffect, useState } from "react";
import { tabooWords } from "../content";
import { numeralDe } from "./format";
import {
  Countdown,
  DeckBar,
  GameSkeleton,
  GameStatus,
  StatusAction,
  board,
  btnGhost,
  btnPrimary
} from "./ui";
import { useCountdown } from "./use-countdown";
import { useDeck } from "./use-deck";

const DURATION_S = 60;

type Phase = "ready" | "running" | "guessed" | "timeup";

export default function TabooGame() {
  const deck = useDeck("altfel", tabooWords);
  const timer = useCountdown(DURATION_S);
  const [phase, setPhase] = useState<Phase>("ready");
  const [guessedIn, setGuessedIn] = useState(0);

  const entry = deck.chosen[0];

  useEffect(() => {
    setPhase("ready");
    timer.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck.chosen]);

  useEffect(() => {
    if (phase === "running" && !timer.running && timer.remaining === 0) {
      setPhase("timeup");
    }
  }, [phase, timer.running, timer.remaining]);

  function start() {
    timer.start();
    setPhase("running");
  }

  function guessed() {
    setGuessedIn(timer.usedSeconds());
    timer.stop();
    setPhase("guessed");
  }

  if (!deck.ready || !entry) return <GameSkeleton />;

  return (
    <div>
      <GameStatus
        action={
          <StatusAction onClick={() => deck.next()}>Alt cuvânt</StatusAction>
        }
      >
        Cuvântul {deck.seen} din {deck.total}
        {deck.round > 1 ? ` · runda ${deck.round}` : ""}
      </GameStatus>

      <DeckBar seen={deck.seen} total={deck.total} />

      <div
        className={
          board +
          " mt-3 flex flex-col items-center gap-5 p-5 text-center sm:gap-6 sm:p-8"
        }
      >
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-500">
          Descrie cuvântul
        </p>
        <p className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {entry.word}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-sm font-semibold text-red-700">❌ fără:</span>
          {entry.forbidden.map((word) => (
            <span
              key={word}
              className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm font-semibold text-red-700"
            >
              {word}
            </span>
          ))}
        </div>

        <Countdown remaining={timer.remaining} total={DURATION_S} />

        <p className="min-h-[3.25rem] max-w-[42ch] text-balance leading-snug" aria-live="polite">
          {phase === "guessed" ? (
            <span className="font-semibold text-emerald-700">
              🎉 Ghicit, în {guessedIn === 1 ? "o secundă" : `${numeralDe(guessedIn)} secunde`}!
            </span>
          ) : phase === "timeup" ? (
            <span className="font-semibold text-gray-700">
              S-a dus minutul! Cuvântul era greu — treci la următorul.
            </span>
          ) : phase === "running" ? (
            <span className="text-gray-600">
              Descrie-l pe ocolite, până îl ghicesc ceilalți!
            </span>
          ) : (
            <span className="text-gray-500">
              Pornește cronometrul când publicul e gata.
            </span>
          )}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {phase === "running" ? (
          <>
            <button type="button" onClick={guessed} className={btnPrimary + " flex-1 basis-40"}>
              Au ghicit!
            </button>
            <button
              type="button"
              onClick={() => deck.next()}
              className={btnGhost + " flex-1 basis-40"}
            >
              Sar peste
            </button>
          </>
        ) : phase === "ready" ? (
          <button type="button" onClick={start} className={btnPrimary + " flex-1 basis-40"}>
            Pornește
          </button>
        ) : (
          <button
            type="button"
            onClick={() => deck.next()}
            className={btnPrimary + " flex-1 basis-40"}
          >
            Următorul cuvânt
          </button>
        )}
      </div>

      <p className="mt-3 text-sm text-gray-500">
        În grup: unul descrie, ceilalți ghicesc — apoi schimbați. Singur:
        descrie-l fără cuvintele interzise, ca antrenament.
      </p>
    </div>
  );
}
