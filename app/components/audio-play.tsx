"use client";

import { useRef, useState } from "react";

type Props = {
  src: string;
  /** Ce se aude la apăsare — eticheta e a locului, nu a player-ului. */
  label: string;
  /** Raportează redarea: `true` la Play, `false` la pauză sau la sfârșit. */
  onPlayback?: (activ: boolean) => void;
};

/**
 * Butonul „Ascultă" și player-ul lui: nimic nu se încarcă până la apăsare —
 * elementul `<audio>` nici nu există înainte de Play (ADR-033). Îl folosesc și
 * articolul (integrala), și `/azi` (episodul zilei), de-aia eticheta vine din
 * afară: era singurul lucru din markup care ținea de un singur loc.
 */
export default function AudioPlay({ src, label, onPlayback }: Props) {
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
        {label}
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
