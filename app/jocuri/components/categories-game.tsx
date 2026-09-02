"use client";

import { useState } from "react";
import { categories } from "../content";
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

const TARGET = 5;
const DURATION_S = 60;

type Phase = "ready" | "running" | "won" | "timeup";

function wonMessage(seconds: number) {
  if (seconds === 1) return "🎉 Toate 5, într-o singură secundă!";
  return `🎉 Toate 5, în ${numeralDe(seconds)} secunde!`;
}

function SaidBubbles(props: { said: number; phase: Phase; onSay: () => void }) {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-2 sm:gap-3"
      role="group"
      aria-label="Câte ai spus până acum"
    >
      {Array.from({ length: TARGET }, (_, index) => {
        const filled = index < props.said;
        return (
          <button
            key={index}
            type="button"
            disabled={props.phase !== "running" || filled}
            onClick={props.onSay}
            aria-label={
              filled
                ? `A ${index + 1}-a e spusă`
                : `Am mai spus una (până acum ${props.said} din ${TARGET})`
            }
            className={
              "touch-manipulation flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full border-2 p-2 text-lg font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 " +
              (filled
                ? "motion-safe:animate-pop border-emerald-300 bg-emerald-50 text-emerald-700"
                : props.phase === "running"
                  ? "border-gray-300 bg-white text-gray-400 hover:border-indigo-400"
                  : "border-dashed border-gray-200 bg-white text-gray-300")
            }
          >
            {filled ? "✓" : index + 1}
          </button>
        );
      })}
    </div>
  );
}

function CategoryStatus({ phase, said, wonIn }: { phase: Phase; said: number; wonIn: number }) {
  return (
    <p className="min-h-[3rem] max-w-[38ch] text-balance leading-snug" aria-live="polite">
      {phase === "won" ? (
        <span className="font-semibold text-emerald-700">{wonMessage(wonIn)}</span>
      ) : phase === "timeup" ? (
        <span className="font-semibold text-gray-700">
          S-a dus minutul! Ai zis {said} din {TARGET} — data viitoare le iei pe toate.
        </span>
      ) : phase === "running" ? (
        <span className="text-gray-600">
          Spune cu voce tare și atinge câte o bulă pentru fiecare.
        </span>
      ) : (
        <span className="text-gray-500">Pornește cronometrul când ești gata.</span>
      )}
    </p>
  );
}

function CategoryControls(props: { phase: Phase; onStart: () => void; onNext: () => void }) {
  return (
    <div className="mt-4 flex flex-wrap gap-3">
      {props.phase === "won" || props.phase === "timeup" ? (
        <button type="button" onClick={props.onNext} className={btnPrimary + " flex-1 basis-40"}>
          Următoarea
        </button>
      ) : props.phase === "running" ? (
        <button type="button" onClick={props.onNext} className={btnGhost + " flex-1 basis-40"}>
          Sar peste
        </button>
      ) : (
        <button type="button" onClick={props.onStart} className={btnPrimary + " flex-1 basis-40"}>
          Pornește
        </button>
      )}
    </div>
  );
}

function CategoryBoard(props: {
  prompt: string;
  phase: Phase;
  said: number;
  wonIn: number;
  remaining: number;
  onSay: () => void;
}) {
  return (
    <div
      className={board + " mt-3 flex flex-col items-center gap-5 p-5 text-center sm:gap-6 sm:p-8"}
    >
      <p className="text-balance text-xl font-semibold leading-snug text-gray-900 sm:text-2xl">
        Spune {props.prompt}!
      </p>

      <Countdown remaining={props.remaining} total={DURATION_S} />

      <SaidBubbles said={props.said} phase={props.phase} onSay={props.onSay} />

      <CategoryStatus phase={props.phase} said={props.said} wonIn={props.wonIn} />
    </div>
  );
}

export default function CategoriesGame() {
  const deck = useDeck("categorii", categories);
  const timer = useCountdown(DURATION_S);
  const [phase, setPhase] = useState<Phase>("ready");
  const [said, setSaid] = useState(0);
  const [wonIn, setWonIn] = useState(0);

  const category = deck.chosen[0];

  useRoundReset(deck.chosen, timer.reset, () => {
    setPhase("ready");
    setSaid(0);
  });

  useTimeUp(phase === "running", timer, () => setPhase("timeup"));

  function start() {
    setSaid(0);
    timer.start();
    setPhase("running");
  }

  function sayOne() {
    if (phase !== "running" || said >= TARGET) return;
    const next = said + 1;
    setSaid(next);
    if (next === TARGET) {
      setWonIn(timer.usedSeconds());
      timer.stop();
      setPhase("won");
    }
  }

  if (!deck.ready || !category) return <GameSkeleton />;

  return (
    <div>
      <GameStatus action={<StatusAction onClick={() => deck.next()}>Altă categorie</StatusAction>}>
        Categoria {deck.seen} din {deck.total}
        {deck.round > 1 ? ` · runda ${deck.round}` : ""}
      </GameStatus>

      <DeckBar seen={deck.seen} total={deck.total} />

      <CategoryBoard
        prompt={category.prompt}
        phase={phase}
        said={said}
        wonIn={wonIn}
        remaining={timer.remaining}
        onSay={sayOne}
      />

      <CategoryControls phase={phase} onStart={start} onNext={() => deck.next()} />

      <p className="mt-3 text-sm text-gray-500">
        Singur: contra ceasului. În grup: pe rânduri — fiecare cu categoria lui.
      </p>
    </div>
  );
}
