"use client";

import { useState } from "react";
import { emojiRebus } from "../content";
import { DeckBar, GameSkeleton, GameStatus, RevealControls, StatusAction, board } from "./ui";
import { useDeck } from "./use-deck";

const CATEGORY_LABEL: Record<string, string> = {
  poveste: "E o poveste",
  proverb: "E un proverb",
  cuvant: "E un cuvânt compus",
};

type Rebus = (typeof emojiRebus)[number];

function RebusBoard({ rebus, revealed, hint }: { rebus: Rebus; revealed: boolean; hint: boolean }) {
  return (
    <div
      className={
        board +
        " mt-3 flex min-h-[14rem] flex-col items-center justify-center gap-5 p-6 text-center sm:p-10"
      }
    >
      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
        {CATEGORY_LABEL[rebus.category] ?? rebus.category}
      </span>

      <p className="text-5xl leading-normal tracking-wide sm:text-6xl">{rebus.emojis}</p>

      <div className="flex min-h-[3.5rem] items-center justify-center" aria-live="polite">
        {revealed ? (
          <p className="motion-safe:animate-pop text-xl font-bold text-indigo-600 sm:text-2xl">
            {rebus.answer}
          </p>
        ) : hint ? (
          <p className="max-w-[36ch] text-balance text-gray-600">{rebus.hint}</p>
        ) : null}
      </div>
    </div>
  );
}

export default function EmojiRebusGame() {
  const deck = useDeck("rebus", emojiRebus);
  const [revealed, setRevealed] = useState(false);
  const [hint, setHint] = useState(false);

  const rebus = deck.chosen[0];

  function goNext() {
    setRevealed(false);
    setHint(false);
    deck.next();
  }

  if (!deck.ready || !rebus) return <GameSkeleton />;

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
        Rebusul {deck.seen} din {deck.total}
        {deck.round > 1 ? ` · runda ${deck.round}` : ""}
      </GameStatus>

      <DeckBar seen={deck.seen} total={deck.total} />

      <RebusBoard rebus={rebus} revealed={revealed} hint={hint} />

      <RevealControls
        revealed={revealed}
        hint={hint}
        nextLabel="Rebusul următor"
        onHint={() => setHint(true)}
        onReveal={() => setRevealed(true)}
        onNext={goNext}
      />

      <p className="mt-3 text-sm text-gray-500">
        Singur sau în grup: cine strigă primul răspunsul?
      </p>
    </div>
  );
}
