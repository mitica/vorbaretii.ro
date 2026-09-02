"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cronometrul jocurilor contra timp (Categorii, Vinde-mi asta!, Spune-o
 * altfel). Numără înapoi din `durationS`; jocul își ține singur fazele și
 * ascultă `remaining === 0`.
 */
export function useCountdown(durationS: number) {
  const [remaining, setRemaining] = useState(durationS);
  const [running, setRunning] = useState(false);
  const endAt = useRef(0);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      const left = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) setRunning(false);
    }, 200);
    return () => clearInterval(timer);
  }, [running]);

  function start() {
    endAt.current = Date.now() + durationS * 1000;
    setRemaining(durationS);
    setRunning(true);
  }

  function stop() {
    setRunning(false);
  }

  function reset() {
    setRunning(false);
    setRemaining(durationS);
  }

  /** Câte secunde s-au scurs până acum (cel puțin 1) — pentru mesajul final. */
  function usedSeconds() {
    return Math.min(
      durationS,
      Math.max(1, Math.round(durationS - (endAt.current - Date.now()) / 1000))
    );
  }

  return { remaining, running, start, stop, reset, usedSeconds };
}
