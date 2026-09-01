"use client";

import { useCallback, useEffect, useState } from "react";
import { anagramIds, anagrams } from "../content";
import { shuffle } from "./shuffle";
import {
  GameSkeleton,
  GameStatus,
  StatusAction,
  board,
  btnGhost,
  btnPrimary
} from "./ui";
import { useRotation } from "./use-rotation";

const byId = new Map(anagrams.map((item) => [item.id, item]));

/** Amestecă literele, dar niciodată în ordinea corectă. */
function scramble(word: string): number[] {
  const indexes = word.split("").map((_, i) => i);
  if (word.length < 2) return indexes;
  for (let attempt = 0; attempt < 20; attempt++) {
    const mixed = shuffle(indexes);
    if (mixed.map((i) => word[i]).join("") !== word) return mixed;
  }
  return [...indexes].reverse();
}

const tile =
  "flex aspect-[3/4] w-full items-center justify-center rounded-xl text-xl font-bold sm:text-2xl";

/** Cuvintele lungi se rup în două rânduri egale, nu în 7 + 2. */
function perRow(length: number) {
  return length <= 6 ? length : Math.ceil(length / 2);
}

/**
 * Cât de late sunt rândurile de litere. Coloanele sunt `1fr` cu o lățime maximă:
 * la dimensiuni normale literele au 2.75rem, iar când nu mai încap (ecran mic,
 * font mărit) se micșorează ele, în loc să împingă pagina în lateral.
 */
function tileGrid(length: number) {
  const columns = perRow(length);
  return {
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    maxWidth: `${columns * 2.75 + (columns - 1) * 0.5}rem`
  };
}

export default function AnagramsGame() {
  const deck = useRotation("anagrame", anagramIds);
  const [letters, setLetters] = useState<number[]>([]);
  const [picked, setPicked] = useState<number[]>([]);
  const [hint, setHint] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);

  const entry = byId.get(deck.chosen[0] ?? "");
  const word = entry?.word ?? "";

  useEffect(() => {
    if (!word) return;
    setLetters(scramble(word));
    setPicked([]);
    setHint(false);
    setGaveUp(false);
  }, [word]);

  const columns = tileGrid(word.length);
  const complete = picked.length === word.length;
  const correct = complete && picked.map((i) => word[i]).join("") === word;

  const undo = useCallback(() => setPicked((now) => now.slice(0, -1)), []);

  if (!deck.ready || !entry) return <GameSkeleton />;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <GameStatus
        action={
          deck.seen > 1 ? (
            <StatusAction onClick={() => deck.restart()}>
              Ia-o de la capăt
            </StatusAction>
          ) : undefined
        }
      >
        Cuvântul {deck.seen} din {deck.total}
        {deck.round > 1 ? ` · runda ${deck.round}` : ""}
      </GameStatus>

      <div
        className={
          board +
          " mt-3 flex flex-col items-center justify-center gap-6 p-4 sm:gap-8 sm:p-8"
        }
      >
        {/* Locurile în care se construiește cuvântul */}
        <div className="mx-auto grid w-full gap-2" style={columns}>
          {word.split("").map((_, slot) => {
            const letterIndex = picked[slot];
            const filled = letterIndex !== undefined;
            return (
              <div
                key={slot}
                className={
                  tile +
                  " border-2 " +
                  (gaveUp
                    ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                    : correct
                      ? "pop border-emerald-300 bg-emerald-50 text-emerald-800"
                      : complete
                        ? "shake border-red-300 bg-red-50 text-red-700"
                        : filled
                          ? "border-gray-300 bg-gray-50 text-gray-900"
                          : "border-dashed border-gray-300 bg-white")
                }
              >
                {gaveUp ? word[slot] : filled ? word[letterIndex] : ""}
              </div>
            );
          })}
        </div>

        {/* Literele amestecate */}
        <div className="mx-auto grid w-full gap-2" style={columns}>
          {letters.map((letterIndex) => {
            const used = picked.includes(letterIndex);
            return (
              <button
                key={letterIndex}
                type="button"
                disabled={used || gaveUp || correct}
                onClick={() => setPicked((now) => [...now, letterIndex])}
                className={
                  tile +
                  " tap border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 " +
                  (used || gaveUp || correct
                    ? "border-gray-200 bg-gray-100 text-gray-300"
                    : "border-gray-300 bg-white text-gray-900 hover:border-indigo-400 hover:text-indigo-600")
                }
              >
                {word[letterIndex]}
              </button>
            );
          })}
        </div>

        <p
          className="min-h-[3rem] max-w-[40ch] text-balance text-center leading-snug"
          aria-live="polite"
        >
          {gaveUp ? (
            <span className="font-semibold text-gray-700">
              Cuvântul era <span className="text-indigo-600">{word}</span>.
            </span>
          ) : correct ? (
            <span className="font-semibold text-emerald-700">
              🎉 Exact! {word}.
            </span>
          ) : complete ? (
            <span className="font-semibold text-red-700">
              Încă nu e bine. Șterge o literă și mai încearcă.
            </span>
          ) : hint ? (
            <span className="text-gray-600">{entry.hint}</span>
          ) : (
            <span className="text-gray-400">
              Apasă literele în ordinea potrivită.
            </span>
          )}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
        <button
          type="button"
          onClick={undo}
          disabled={picked.length === 0 || gaveUp}
          className={btnGhost + " flex-1 basis-28 px-2 text-sm sm:flex-none sm:px-5 sm:text-base"}
        >
          <span aria-hidden="true">⌫</span> Șterge
        </button>
        <button
          type="button"
          onClick={() => (hint ? setGaveUp(true) : setHint(true))}
          disabled={gaveUp || correct}
          className={btnGhost + " flex-1 basis-28 px-2 text-sm sm:flex-none sm:px-5 sm:text-base"}
        >
          {hint ? "Răspunsul" : "💡 Indiciu"}
        </button>
        <button
          type="button"
          onClick={() => deck.next()}
          className={btnPrimary + " flex-1 basis-28 px-2 text-sm sm:flex-none sm:px-5 sm:text-base"}
        >
          Următorul
        </button>
      </div>
    </div>
  );
}
