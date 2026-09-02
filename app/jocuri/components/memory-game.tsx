"use client";

import { useEffect, useState } from "react";
import { memoryPairs } from "../content";
import { tries } from "./format";
import { shuffle } from "./shuffle";
import { loadJson, saveJson } from "./storage";
import { DeckBar, GameSkeleton, GameStatus, StatusAction, btnPrimary } from "./ui";
import { useDeck } from "./use-deck";

/** 8 perechi = 16 cartonașe = o tablă 4×4, care încape pe orice telefon. */
const ROUND_SIZE = 8;
const BEST_KEY = "memorie.record";

type MemoryItem = (typeof memoryPairs)[number];
type Card = { item: MemoryItem; kind: "emoji" | "word" };

export default function MemoryGame() {
  const deck = useDeck("memorie", memoryPairs, ROUND_SIZE);
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [best, setBest] = useState<number | null>(null);

  useEffect(() => {
    // În localStorage poate sta orice; recordul e record doar dacă e un număr.
    const stored = loadJson<unknown>(BEST_KEY, null);
    setBest(typeof stored === "number" && Number.isFinite(stored) ? stored : null);
  }, []);

  useEffect(() => {
    setCards(
      shuffle(
        deck.chosen.flatMap((item) => [
          { item, kind: "emoji" as const },
          { item, kind: "word" as const }
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
    const isPair = cards[a].item.id === cards[b].item.id;
    const timer = setTimeout(
      () => {
        if (isPair) setMatched((now) => [...now, cards[a].item.id]);
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
    if (flipped.includes(index) || matched.includes(cards[index].item.id)) return;
    if (flipped.length === 1) setMoves((now) => now + 1);
    setFlipped([...flipped, index]);
  }

  if (!deck.ready || cards.length === 0) return <GameSkeleton />;

  return (
    <div>
      <GameStatus
        action={
          <StatusAction onClick={() => deck.next()}>Joc nou</StatusAction>
        }
      >
        {matched.length} din {cards.length / 2} perechi · {tries(moves)}
        {best !== null ? ` · record ${best}` : ""} · {deck.seen}/{deck.total} văzute
      </GameStatus>

      <DeckBar seen={deck.seen} total={deck.total} />

      <div className="mt-3 flex justify-center">
        <div className="grid w-full max-w-[26rem] grid-cols-4 gap-2 sm:gap-3">
          {cards.map((card, index) => {
            const isMatched = matched.includes(card.item.id);
            const isUp = flipped.includes(index) || isMatched;
            return (
              <button
                key={`${card.item.id}-${card.kind}`}
                type="button"
                onClick={() => flip(index)}
                disabled={isUp}
                data-up={isUp}
                aria-label={
                  isUp
                    ? card.kind === "emoji"
                      ? `Imagine: ${card.item.word.toLowerCase()}`
                      : card.item.word
                    : "Cartonaș cu fața în jos"
                }
                className="group relative aspect-square w-full touch-manipulation rounded-xl [perspective:900px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-default"
              >
                <span className="absolute inset-0 block transition-transform duration-300 ease-[cubic-bezier(0.2,0.7,0.3,1)] [transform-style:preserve-3d] group-data-[up=true]:[transform:rotateY(180deg)] motion-reduce:transition-none">
                  <span
                    className="absolute inset-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-orange-400 text-2xl font-bold text-white/80 [backface-visibility:hidden]"
                    aria-hidden="true"
                  >
                    ?
                  </span>
                  <span
                    className={
                      "absolute inset-0 flex items-center justify-center rounded-xl border-2 p-1 text-center [backface-visibility:hidden] [transform:rotateY(180deg)] " +
                      (isMatched
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-gray-300 bg-white")
                    }
                    aria-hidden="true"
                  >
                    {card.kind === "emoji" ? (
                      <span className="text-3xl sm:text-4xl">
                        {card.item.emoji}
                      </span>
                    ) : (
                      <span className="text-xs font-bold leading-tight text-gray-900 sm:text-sm">
                        {card.item.word}
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
