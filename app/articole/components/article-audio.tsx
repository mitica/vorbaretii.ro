"use client";

import { useRef, useState } from "react";

type Props = {
  src: string;
  /** Raportează redarea: `true` la Play, `false` la pauză sau la sfârșit. */
  onPlayback?: (activ: boolean) => void;
};

/** Player-ul articolului: integrala, nimic încărcat până la Play (ADR-014). */
export default function ArticleAudio({ src, onPlayback }: Props) {
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLAudioElement>(null);

  return (
    <div>
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
        <audio
          ref={ref}
          controls
          preload="none"
          src={src}
          onPlay={() => onPlayback?.(true)}
          onPause={() => onPlayback?.(false)}
          onEnded={() => onPlayback?.(false)}
          className="mt-2 w-full"
        />
      ) : null}
    </div>
  );
}
