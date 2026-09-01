"use client";

import { useEffect, useState } from "react";
import { memoryPairIds, memoryPairs } from "../content";
import { shuffle } from "./shuffle";
import { loadJson, saveJson } from "./storage";
import { GameSkeleton, GameStatus, StatusAction, btnPrimary } from "./ui";
import { useRotation } from "./use-rotation";

/** 8 perechi = 16 cartonașe = o tablă 4×4, care încape pe orice telefon. */
const ROUND_SIZE = 8;
const BEST_KEY = "memorie.record";

type Card = { pair: string; kind: "emoji" | "word" };

const byId = new Map(memoryPairs.map((item) => [item.id, item]));

/** „o încercare", „3 încercări", „20 **de** încercări" — acordul cu numeralul. */
function tries(count: number) {
  if (count === 1) return "o încercare";
  const lastTwo = count % 100;
  const de = count > 0 && (lastTwo === 0 || lastTwo > 19) ? "de " : "";
  return `${count} ${de}încercări`;
}

export default function MemoryGame() {
  const deck = useRotation("memorie", memoryPairIds, ROUND_SIZE);
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [best, setBest] = useState<number | null>(null);

  useEffect(() => {
    setBest(loadJson<number | null>(BEST_KEY, null));
  }, []);

  useEffect(() => {
    setCards(
      shuffle(
        deck.chosen.flatMap((pair) => [
          { pair, kind: "emoji" as const },
          { pair, kind: "word" as const }
        ])
      )
    );
    setFlipped([]);
    setMatched([]);
    setMoves(0);
  }, [deck.chosen]);

  useEffect(() => {
    if (flipped.length !== 2) return;
    const [a, b] = flipped;
    const isPair = cards[a].pair === cards[b].pair;
    const timer = setTimeout(
      () => {
        if (isPair) setMatched((now) => [...now, cards[a].pair]);
        setFlipped([]);
      },
      isPair ? 500 : 1000
    );
    return () => clearTimeout(timer);
  }, [flipped, cards]);

  const done = cards.length > 0 && matched.length === cards.length / 2;

  useEffect(() => {
    if (!done) return;
    setBest((previous) => {
      if (previous !== null && previous <= moves) return previous;
      saveJson(BEST_KEY, moves);
      return moves;
    });
  }, [done, moves]);

  function flip(index: number) {
    if (flipped.length === 2) return;
    if (flipped.includes(index) || matched.includes(cards[index].pair)) return;
    if (flipped.length === 1) setMoves((now) => now + 1);
    setFlipped([...flipped, index]);
  }

  if (!deck.ready || cards.length === 0) return <GameSkeleton />;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <GameStatus
        action={
          <StatusAction onClick={() => deck.next()}>Joc nou</StatusAction>
        }
      >
        {matched.length} din {cards.length / 2} perechi · {tries(moves)}
        {best !== null ? ` · record ${best}` : ""}
      </GameStatus>

      <div className="mt-3 flex justify-center">
        <div className="grid w-full max-w-[26rem] grid-cols-4 gap-2 sm:gap-3">
          {cards.map((card, index) => {
            const isMatched = matched.includes(card.pair);
            const isUp = flipped.includes(index) || isMatched;
            const pair = byId.get(card.pair);
            return (
              <button
                key={`${card.pair}-${card.kind}`}
                type="button"
                onClick={() => flip(index)}
                disabled={isUp}
                data-up={isUp}
                aria-label={
                  isUp
                    ? card.kind === "emoji"
                      ? `Imagine: ${pair?.word.toLowerCase()}`
                      : pair?.word
                    : "Cartonaș cu fața în jos"
                }
                className="flip tap aspect-square w-full rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-default"
              >
                <span className="flip-inner">
                  <span
                    className="flip-face bg-gradient-to-br from-pink-500 to-orange-400 text-2xl font-bold text-white/80"
                    aria-hidden="true"
                  >
                    ?
                  </span>
                  <span
                    className={
                      "flip-face flip-face-back border-2 p-1 text-center " +
                      (isMatched
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-gray-300 bg-white")
                    }
                    aria-hidden="true"
                  >
                    {card.kind === "emoji" ? (
                      <span className="text-3xl sm:text-4xl">
                        {pair?.emoji}
                      </span>
                    ) : (
                      <span className="text-xs font-bold leading-tight text-gray-900 sm:text-sm">
                        {pair?.word}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex min-h-[52px] items-center" aria-live="polite">
        {done ? (
          <button
            type="button"
            onClick={() => deck.next()}
            className={btnPrimary + " w-full sm:w-auto"}
          >
            🎉 Gata, din {tries(moves)} — încă un joc
          </button>
        ) : (
          <p className="text-sm text-gray-500">
            Ține minte unde ai văzut fiecare cartonaș.
          </p>
        )}
      </div>
    </div>
  );
}
