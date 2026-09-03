"use client";

import { useRef, useState } from "react";

type Piece = { src: string; label: string };

/** Player-ul articolului: bucățile curg în ordine; nimic nu se încarcă până la Play (ADR-013). */
export default function ArticleAudio({ pieces }: { pieces: Piece[] }) {
  const [index, setIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLAudioElement>(null);

  const play = (i: number) => {
    setIndex(i);
    setStarted(true);
    requestAnimationFrame(() => ref.current?.play().catch(() => undefined));
  };

  return (
    <div className="mt-4 rounded-2xl border border-pink-100 bg-pink-50/50 px-4 py-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => play(started ? index : 0)}
          className="inline-flex min-h-[44px] items-center gap-1.5 font-bold text-indigo-600 hover:text-indigo-500"
        >
          🔊 Ascultă articolul
        </button>
        <span className="text-sm text-gray-600">
          {started ? pieces[index]?.label : `${pieces.length} bucăți`}
        </span>
      </div>
      {started ? (
        <audio
          ref={ref}
          controls
          preload="none"
          src={pieces[index]?.src}
          onEnded={() => (index + 1 < pieces.length ? play(index + 1) : setStarted(false))}
          className="mt-2 w-full"
        />
      ) : null}
    </div>
  );
}
