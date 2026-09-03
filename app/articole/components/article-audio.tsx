"use client";

import { useRef, useState } from "react";

/** Player-ul articolului: integrala, nimic încărcat până la Play (ADR-014). */
export default function ArticleAudio({ src }: { src: string }) {
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLAudioElement>(null);

  return (
    <div className="mt-4 rounded-2xl border border-pink-100 bg-pink-50/50 px-4 py-3">
      <button
        type="button"
        onClick={() => {
          setStarted(true);
          requestAnimationFrame(() => ref.current?.play().catch(() => undefined));
        }}
        className="inline-flex min-h-[44px] items-center gap-1.5 font-bold text-indigo-600 hover:text-indigo-500"
      >
        🔊 Ascultă articolul
      </button>
      {started ? (
        <audio ref={ref} controls preload="none" src={src} className="mt-2 w-full" />
      ) : null}
    </div>
  );
}
