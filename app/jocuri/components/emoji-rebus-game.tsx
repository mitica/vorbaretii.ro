"use client";

import { useState } from "react";
import { emojiRebus } from "../content";
import {
  DeckBar,
  GameSkeleton,
  GameStatus,
  StatusAction,
  board,
  btnGhost,
  btnPrimary,
  btnSecondary
} from "./ui";
import { useDeck } from "./use-deck";

const CATEGORY_LABEL: Record<string, string> = {
  poveste: "E o poveste",
  proverb: "E un proverb",
  cuvant: "E un cuvânt compus"
};

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

      <div
        className={
          board +
          " mt-3 flex min-h-[14rem] flex-col items-center justify-center gap-5 p-6 text-center sm:p-10"
        }
      >
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          {CATEGORY_LABEL[rebus.category] ?? rebus.category}
        </span>

        <p className="text-5xl leading-normal tracking-wide sm:text-6xl">
          {rebus.emojis}
        </p>

        <div
          className="flex min-h-[3.5rem] items-center justify-center"
          aria-live="polite"
        >
          {revealed ? (
            <p className="motion-safe:animate-pop text-xl font-bold text-indigo-600 sm:text-2xl">
              {rebus.answer}
            </p>
          ) : hint ? (
            <p className="max-w-[36ch] text-balance text-gray-600">{rebus.hint}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {revealed ? null : (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setHint(true)}
              disabled={hint}
              className={btnGhost + " flex-1 basis-36"}
            >
              💡 Indiciu
            </button>
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className={btnSecondary + " flex-1 basis-36"}
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
          Rebusul următor
        </button>
      </div>

      <p className="mt-3 text-sm text-gray-500">
        Singur sau în grup: cine strigă primul răspunsul?
      </p>
    </div>
  );
}
