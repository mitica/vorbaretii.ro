"use client";

import { useCallback, useEffect, useState } from "react";
import { memoryPairs } from "../content";
import { shuffle } from "./shuffle";

type Card = { pair: number; kind: "emoji" | "word" };

function tries(count: number) {
  return count === 1 ? "o încercare" : `${count} încercări`;
}

const DECK: Card[] = memoryPairs.flatMap((_, pair) => [
  { pair, kind: "emoji" as const },
  { pair, kind: "word" as const }
]);

export default function MemoryGame() {
  const [cards, setCards] = useState<Card[]>(DECK);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  const restart = useCallback(() => {
    setCards(shuffle(DECK));
    setFlipped([]);
    setMatched([]);
    setMoves(0);
  }, []);

  useEffect(() => {
    restart();
  }, [restart]);

  useEffect(() => {
    if (flipped.length !== 2) return;
    const [a, b] = flipped;
    const isPair = cards[a].pair === cards[b].pair;
    const timer = setTimeout(
      () => {
        if (isPair) setMatched((current) => [...current, cards[a].pair]);
        setFlipped([]);
      },
      isPair ? 450 : 950
    );
    return () => clearTimeout(timer);
  }, [flipped, cards]);

  function flip(index: number) {
    if (flipped.length === 2) return;
    if (flipped.includes(index) || matched.includes(cards[index].pair)) return;
    if (flipped.length === 1) setMoves((current) => current + 1);
    setFlipped([...flipped, index]);
  }

  const done = matched.length === memoryPairs.length;

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-gray-500">
          {matched.length} din {memoryPairs.length} perechi · {tries(moves)}
        </p>
        <button
          type="button"
          onClick={restart}
          className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-700"
        >
          Joc nou
        </button>
      </div>

      {done && (
        <p
          className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-semibold text-emerald-800"
          aria-live="polite"
        >
          🎉 Le-ai găsit pe toate, din {tries(moves)}. Încerci să faci mai bine?
        </p>
      )}

      <div className="mx-auto mt-5 grid max-w-xl grid-cols-4 gap-2.5 sm:gap-4">
        {cards.map((card, index) => {
          const isUp = flipped.includes(index) || matched.includes(card.pair);
          const pair = memoryPairs[card.pair];
          return (
            <button
              key={`${card.pair}-${card.kind}`}
              type="button"
              onClick={() => flip(index)}
              aria-label={isUp ? undefined : "Cartonaș întors cu fața în jos"}
              className={
                "flex aspect-[3/4] items-center justify-center rounded-xl border-2 p-1 text-center transition " +
                (matched.includes(card.pair)
                  ? "border-emerald-300 bg-emerald-50"
                  : isUp
                    ? "border-gray-300 bg-white"
                    : "border-gray-200 bg-gradient-to-br from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500")
              }
            >
              {isUp ? (
                card.kind === "emoji" ? (
                  <span className="text-3xl sm:text-4xl" aria-hidden="true">
                    {pair.emoji}
                  </span>
                ) : (
                  <span className="text-xs font-bold leading-tight text-gray-900 sm:text-base">
                    {pair.word}
                  </span>
                )
              ) : (
                <span className="text-2xl font-bold text-white/80" aria-hidden="true">
                  ?
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
