"use client";

import { useState } from "react";
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
  btnPrimary,
} from "./ui";
import { useCountdown, useRoundReset, useTimeUp } from "./use-countdown";
import { useDeck } from "./use-deck";

const DURATION_S = 60;

type Phase = "ready" | "running" | "guessed" | "timeup";

type Entry = (typeof tabooWords)[number];

function TabooBoard(props: { entry: Entry; phase: Phase; remaining: number; guessedIn: number }) {
  const { entry, phase, remaining, guessedIn } = props;
  return (
    <div
      className={board + " mt-3 flex flex-col items-center gap-5 p-5 text-center sm:gap-6 sm:p-8"}
    >
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-500">
        Descrie cuvântul
      </p>
      <p className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{entry.word}</p>

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

      <Countdown remaining={remaining} total={DURATION_S} />

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
          <span className="text-gray-600">Descrie-l pe ocolite, până îl ghicesc ceilalți!</span>
        ) : (
          <span className="text-gray-500">Pornește cronometrul când publicul e gata.</span>
        )}
      </p>
    </div>
  );
}

function TabooControls(props: {
  phase: Phase;
  onStart: () => void;
  onGuessed: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-3">
      {props.phase === "running" ? (
        <>
          <button
            type="button"
            onClick={props.onGuessed}
            className={btnPrimary + " flex-1 basis-40"}
          >
            Au ghicit!
          </button>
          <button type="button" onClick={props.onNext} className={btnGhost + " flex-1 basis-40"}>
            Sar peste
          </button>
        </>
      ) : props.phase === "ready" ? (
        <button type="button" onClick={props.onStart} className={btnPrimary + " flex-1 basis-40"}>
          Pornește
        </button>
      ) : (
        <button type="button" onClick={props.onNext} className={btnPrimary + " flex-1 basis-40"}>
          Următorul cuvânt
        </button>
      )}
    </div>
  );
}

export default function TabooGame() {
  const deck = useDeck("altfel", tabooWords);
  const timer = useCountdown(DURATION_S);
  const [phase, setPhase] = useState<Phase>("ready");
  const [guessedIn, setGuessedIn] = useState(0);

  const entry = deck.chosen[0];

  useRoundReset(deck.chosen, timer.reset, () => setPhase("ready"));

  useTimeUp(phase === "running", timer, () => setPhase("timeup"));

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
      <GameStatus action={<StatusAction onClick={() => deck.next()}>Alt cuvânt</StatusAction>}>
        Cuvântul {deck.seen} din {deck.total}
        {deck.round > 1 ? ` · runda ${deck.round}` : ""}
      </GameStatus>

      <DeckBar seen={deck.seen} total={deck.total} />

      <TabooBoard entry={entry} phase={phase} remaining={timer.remaining} guessedIn={guessedIn} />

      <TabooControls phase={phase} onStart={start} onGuessed={guessed} onNext={() => deck.next()} />

      <p className="mt-3 text-sm text-gray-500">
        În grup: unul descrie, ceilalți ghicesc — apoi schimbați. Singur: descrie-l fără cuvintele
        interzise, ca antrenament.
      </p>
    </div>
  );
}
