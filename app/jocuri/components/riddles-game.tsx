"use client";

import { useState } from "react";
import { riddleIds, riddles } from "../content";
import {
  GameSkeleton,
  GameStatus,
  StatusAction,
  board,
  btnGhost,
  btnPrimary,
  btnSecondary
} from "./ui";
import { useRotation } from "./use-rotation";

const byId = new Map(riddles.map((riddle) => [riddle.id, riddle]));

/** „Începe cu C și are 6 litere." — pasul dintre «habar n-am» și răspuns. */
function firstLetterHint(answer: string) {
  const letters = answer.replace(/\s/g, "").length;
  return `Începe cu ${answer[0].toUpperCase()} și are ${letters} litere.`;
}

export default function RiddlesGame() {
  const deck = useRotation("ghicitori", riddleIds);
  const [revealed, setRevealed] = useState(false);
  const [hint, setHint] = useState(false);

  const riddle = byId.get(deck.chosen[0] ?? "");

  function goNext() {
    setRevealed(false);
    setHint(false);
    deck.next();
  }

  if (!deck.ready || !riddle) return <GameSkeleton />;

  return (
    <div className="flex flex-1 flex-col">
      <GameStatus
        action={
          deck.seen > 1 ? (
            <StatusAction
              onClick={() => {
                setRevealed(false);
                setHint(false);
                deck.restart();
              }}
            >
              Ia-o de la capăt
            </StatusAction>
          ) : undefined
        }
      >
        Ghicitoarea {deck.seen} din {deck.total}
        {deck.round > 1 ? ` · runda ${deck.round}` : ""}
      </GameStatus>

      <div
        className={
          board +
          " mt-3 flex flex-1 flex-col items-center justify-center p-6 text-center sm:p-10"
        }
      >
        <p className="text-balance font-serif text-2xl italic leading-relaxed text-gray-900 sm:text-3xl">
          {riddle.question}
        </p>

        <div
          className="mt-6 flex min-h-[3.5rem] items-center justify-center"
          aria-live="polite"
        >
          {revealed ? (
            <p className="pop text-2xl font-bold text-indigo-600 sm:text-3xl">
              {riddle.answer}
            </p>
          ) : hint ? (
            <p className="text-gray-600">{firstLetterHint(riddle.answer)}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {revealed ? null : (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setHint(true)}
              disabled={hint}
              className={btnGhost}
            >
              💡 Indiciu
            </button>
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className={btnSecondary}
            >
              Arată răspunsul
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={goNext}
          className={revealed ? btnPrimary : btnGhost}
        >
          Ghicitoarea următoare
        </button>
      </div>
    </div>
  );
}
