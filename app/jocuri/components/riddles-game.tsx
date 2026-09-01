"use client";

import { useEffect, useState } from "react";
import { riddles } from "../content";
import { shuffle } from "./shuffle";

export default function RiddlesGame() {
  const [order, setOrder] = useState<number[]>(() => riddles.map((_, i) => i));
  const [position, setPosition] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setOrder(shuffle(riddles.map((_, i) => i)));
  }, []);

  const finished = position >= order.length;
  const riddle = finished ? null : riddles[order[position]];

  function next() {
    setRevealed(false);
    setPosition(position + 1);
  }

  function restart() {
    setOrder(shuffle(riddles.map((_, i) => i)));
    setPosition(0);
    setRevealed(false);
  }

  if (finished) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
        <p className="text-4xl" aria-hidden="true">
          🎉
        </p>
        <p className="mt-4 text-xl font-bold text-gray-900">
          Le-ai ghicit pe toate!
        </p>
        <p className="mt-2 text-gray-600">
          Le amestecăm din nou și o luăm de la capăt.
        </p>
        <button
          type="button"
          onClick={restart}
          className="mt-6 min-h-[48px] rounded-xl bg-pink-600 px-6 py-3 font-semibold text-white transition hover:bg-pink-500"
        >
          Încă o dată
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-semibold text-gray-500">
        Ghicitoarea {position + 1} din {order.length}
      </p>

      <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-8 sm:p-10">
        <p className="text-balance font-serif text-2xl italic leading-relaxed text-gray-900 sm:text-3xl">
          {riddle?.question}
        </p>

        <div className="mt-8 min-h-[3.5rem]" aria-live="polite">
          {revealed ? (
            <p className="text-lg text-gray-600">
              Răspunsul:{" "}
              <span className="text-2xl font-bold text-indigo-600">
                {riddle?.answer}
              </span>
            </p>
          ) : (
            <p className="text-gray-500">
              Spune cu voce tare ce crezi, apoi verifică.
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {!revealed && (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="min-h-[48px] rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-500"
            >
              Arată răspunsul
            </button>
          )}
          <button
            type="button"
            onClick={next}
            className="min-h-[48px] rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:border-gray-400 hover:text-gray-900"
          >
            Următoarea ghicitoare
          </button>
        </div>
      </div>
    </div>
  );
}
