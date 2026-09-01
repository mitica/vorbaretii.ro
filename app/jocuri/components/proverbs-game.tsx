"use client";

import { useCallback, useEffect, useState } from "react";
import { proverbs } from "../content";
import { shuffle } from "./shuffle";

const ROUND_SIZE = 5;

export default function ProverbsGame() {
  const [left, setLeft] = useState<number[]>(() =>
    proverbs.slice(0, ROUND_SIZE).map((_, i) => i)
  );
  const [right, setRight] = useState<number[]>(() =>
    proverbs.slice(0, ROUND_SIZE).map((_, i) => i)
  );
  const [picked, setPicked] = useState<number | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);

  const newRound = useCallback(() => {
    const chosen = shuffle(proverbs.map((_, i) => i)).slice(0, ROUND_SIZE);
    setLeft(shuffle(chosen));
    setRight(shuffle(chosen));
    setPicked(null);
    setMatched([]);
    setWrong(null);
  }, []);

  useEffect(() => {
    newRound();
  }, [newRound]);

  useEffect(() => {
    if (wrong === null) return;
    const timer = setTimeout(() => setWrong(null), 700);
    return () => clearTimeout(timer);
  }, [wrong]);

  function chooseMeaning(id: number) {
    if (picked === null || matched.includes(id)) return;
    if (picked === id) {
      setMatched([...matched, id]);
      setPicked(null);
    } else {
      setWrong(id);
      setPicked(null);
    }
  }

  const done = matched.length === left.length;

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-gray-500">
          {matched.length} din {left.length} perechi găsite
        </p>
        <button
          type="button"
          onClick={newRound}
          className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-700"
        >
          Runda următoare
        </button>
      </div>

      {done && (
        <p
          className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-semibold text-emerald-800"
          aria-live="polite"
        >
          🎉 Toate la locul lor! Apasă „Runda următoare” pentru alte proverbe.
        </p>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 sm:gap-6">
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
            Proverbul
          </h2>
          <ul className="flex flex-col gap-3">
            {left.map((id) => {
              const isMatched = matched.includes(id);
              return (
                <li key={id}>
                  <button
                    type="button"
                    disabled={isMatched}
                    onClick={() => setPicked(id)}
                    className={
                      "w-full rounded-xl border p-4 text-left transition " +
                      (isMatched
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : picked === id
                          ? "border-indigo-500 bg-white ring-2 ring-indigo-200"
                          : "border-gray-200 bg-white hover:border-gray-400")
                    }
                  >
                    {proverbs[id].proverb}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
            Înțelesul
          </h2>
          <ul className="flex flex-col gap-3">
            {right.map((id) => {
              const isMatched = matched.includes(id);
              return (
                <li key={id}>
                  <button
                    type="button"
                    disabled={isMatched}
                    onClick={() => chooseMeaning(id)}
                    className={
                      "w-full rounded-xl border p-4 text-left transition " +
                      (isMatched
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : wrong === id
                          ? "border-red-400 bg-red-50 text-red-800"
                          : "border-gray-200 bg-white hover:border-gray-400")
                    }
                  >
                    {proverbs[id].meaning}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <p className="mt-6 text-sm text-gray-500">
        Alege întâi un proverb din stânga, apoi înțelesul lui din dreapta.
      </p>
    </div>
  );
}
