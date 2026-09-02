"use client";

import { useState } from "react";
import { riddles } from "../content";
import { DeckBar, GameSkeleton, GameStatus, RevealControls, StatusAction, board } from "./ui";
import { useDeck } from "./use-deck";

/** „Începe cu C și are 6 litere." — pasul dintre «habar n-am» și răspuns. */
function firstLetterHint(answer: string) {
  const letters = answer.replace(/\s/g, "").length;
  return `Începe cu ${answer.charAt(0).toUpperCase()} și are ${letters} litere.`;
}

type Riddle = (typeof riddles)[number];

function RiddleBoard({
  riddle,
  revealed,
  hint,
}: {
  riddle: Riddle;
  revealed: boolean;
  hint: boolean;
}) {
  return (
    <div
      className={
        board +
        " mt-3 flex min-h-[14rem] flex-col items-center justify-center p-6 text-center sm:p-10"
      }
    >
      <p className="text-balance font-serif text-2xl italic leading-relaxed text-gray-900 sm:text-3xl">
        {riddle.question}
      </p>

      <div className="mt-6 flex min-h-[3.5rem] items-center justify-center" aria-live="polite">
        {revealed ? (
          <p className="motion-safe:animate-pop text-2xl font-bold text-indigo-600 sm:text-3xl">
            {riddle.answer}
          </p>
        ) : hint ? (
          <p className="text-gray-600">{firstLetterHint(riddle.answer)}</p>
        ) : null}
      </div>
    </div>
  );
}

export default function RiddlesGame() {
  const deck = useDeck("ghicitori", riddles);
  const [revealed, setRevealed] = useState(false);
  const [hint, setHint] = useState(false);

  const riddle = deck.chosen[0];

  function goNext() {
    setRevealed(false);
    setHint(false);
    deck.next();
  }

  if (!deck.ready || !riddle) return <GameSkeleton />;

  return (
    <div>
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

      <DeckBar seen={deck.seen} total={deck.total} />

      <RiddleBoard riddle={riddle} revealed={revealed} hint={hint} />

      {/* `flex-wrap` + `basis`: butoanele stau alături cât încap și trec unul
          sub altul când nu mai încap. Fără praguri de lățime scrise de mână. */}
      <RevealControls
        revealed={revealed}
        hint={hint}
        nextLabel="Ghicitoarea următoare"
        onHint={() => setHint(true)}
        onReveal={() => setRevealed(true)}
        onNext={goNext}
      />
    </div>
  );
}
