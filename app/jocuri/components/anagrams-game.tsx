"use client";

import { useCallback, useEffect, useState } from "react";
import { anagrams } from "../content";
import { shuffle } from "./shuffle";

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

export default function AnagramsGame() {
  const [order, setOrder] = useState<number[]>(() => anagrams.map((_, i) => i));
  const [position, setPosition] = useState(0);
  const [letters, setLetters] = useState<number[]>([]);
  const [picked, setPicked] = useState<number[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);

  const entry = anagrams[order[position % order.length]];

  const load = useCallback((word: string) => {
    setLetters(scramble(word));
    setPicked([]);
    setShowHint(false);
    setGaveUp(false);
  }, []);

  useEffect(() => {
    const shuffled = shuffle(anagrams.map((_, i) => i));
    setOrder(shuffled);
    setPosition(0);
    load(anagrams[shuffled[0]].word);
  }, [load]);

  const attempt = picked.map((i) => entry.word[i]).join("");
  const complete = picked.length === entry.word.length;
  const correct = complete && attempt === entry.word;

  function next() {
    const nextPosition = (position + 1) % order.length;
    setPosition(nextPosition);
    load(anagrams[order[nextPosition]].word);
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-7 sm:p-9">
      <p className="text-sm font-semibold text-gray-500">
        Cuvântul {position + 1} din {order.length}
      </p>

      {/* Locurile în care se construiește cuvântul */}
      <div className="mt-5 flex flex-wrap gap-2">
        {entry.word.split("").map((_, slot) => {
          const letterIndex = picked[slot];
          const filled = letterIndex !== undefined;
          return (
            <div
              key={slot}
              className={
                "flex h-14 w-11 items-center justify-center rounded-xl border-2 text-2xl font-bold sm:h-16 sm:w-12 " +
                (gaveUp
                  ? "border-gray-300 bg-gray-100 text-gray-700"
                  : correct
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                    : complete
                      ? "border-red-300 bg-red-50 text-red-700"
                      : filled
                        ? "border-gray-300 bg-gray-50 text-gray-900"
                        : "border-dashed border-gray-300 bg-white")
              }
            >
              {gaveUp ? entry.word[slot] : filled ? entry.word[letterIndex] : ""}
            </div>
          );
        })}
      </div>

      {/* Literele amestecate */}
      <div className="mt-7 flex flex-wrap gap-2">
        {letters.map((letterIndex) => {
          const used = picked.includes(letterIndex);
          return (
            <button
              key={letterIndex}
              type="button"
              disabled={used || gaveUp}
              onClick={() => setPicked([...picked, letterIndex])}
              className={
                "h-14 w-11 rounded-xl border text-2xl font-bold transition sm:h-16 sm:w-12 " +
                (used || gaveUp
                  ? "border-gray-200 bg-gray-100 text-gray-300"
                  : "border-gray-300 bg-white text-gray-900 hover:border-indigo-400 hover:text-indigo-600")
              }
            >
              {entry.word[letterIndex]}
            </button>
          );
        })}
      </div>

      <div className="mt-6 min-h-[2rem]" aria-live="polite">
        {gaveUp ? (
          <p className="font-semibold text-gray-700">
            Cuvântul era <span className="text-indigo-600">{entry.word}</span>.
          </p>
        ) : correct ? (
          <p className="font-semibold text-emerald-700">
            🎉 Exact! {entry.word}.
          </p>
        ) : complete ? (
          <p className="font-semibold text-red-700">
            Încă nu e bine. Șterge o literă și mai încearcă.
          </p>
        ) : showHint ? (
          <p className="text-gray-600">Indiciu: {entry.hint}</p>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setPicked(picked.slice(0, -1))}
          disabled={picked.length === 0 || gaveUp}
          className="min-h-[48px] rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:border-gray-400 disabled:opacity-40"
        >
          Șterge o literă
        </button>
        <button
          type="button"
          onClick={() => setShowHint(true)}
          disabled={showHint || gaveUp}
          className="min-h-[48px] rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:border-gray-400 disabled:opacity-40"
        >
          Dă-mi un indiciu
        </button>
        <button
          type="button"
          onClick={() => setGaveUp(true)}
          disabled={gaveUp || correct}
          className="min-h-[48px] rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:border-gray-400 disabled:opacity-40"
        >
          Arată răspunsul
        </button>
        <button
          type="button"
          onClick={next}
          className="min-h-[48px] rounded-xl bg-pink-600 px-5 py-3 font-semibold text-white transition hover:bg-pink-500"
        >
          Cuvântul următor
        </button>
      </div>
    </div>
  );
}
