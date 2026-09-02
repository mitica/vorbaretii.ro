"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Cronometrul jocurilor contra timp (Categorii, Vinde-mi asta!, Spune-o
 * altfel). Numără înapoi din `durationS`; jocul își ține singur fazele și
 * ascultă `remaining === 0`.
 */
export type Countdown = ReturnType<typeof useCountdown>;

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

  const start = useCallback(() => {
    endAt.current = Date.now() + durationS * 1000;
    setRemaining(durationS);
    setRunning(true);
  }, [durationS]);

  const stop = useCallback(() => {
    setRunning(false);
  }, []);

  // Stabile prin useCallback, ca efectele jocurilor să le poată lista în deps.
  const reset = useCallback(() => {
    setRunning(false);
    setRemaining(durationS);
  }, [durationS]);

  /** Câte secunde s-au scurs până acum (cel puțin 1) — pentru mesajul final. */
  function usedSeconds() {
    return Math.min(
      durationS,
      Math.max(1, Math.round(durationS - (endAt.current - Date.now()) / 1000))
    );
  }

  return { remaining, running, start, stop, reset, usedSeconds };
}

/** Fazele „contra timp”: când cronometrul ajunge la zero în plină rundă, anunță. */
export function useTimeUp(active: boolean, timer: Countdown, onTimeUp: () => void) {
  useEffect(() => {
    if (active && !timer.running && timer.remaining === 0) onTimeUp();
  }, [active, timer.running, timer.remaining, onTimeUp]);
}

/**
 * Resetul comun la extragerea unui element nou: întâi starea jocului (prin
 * ref, ca efectul să nu se refacă la fiecare randare), apoi cronometrul.
 */
export function useRoundReset(marker: unknown, reset: () => void, onReset: () => void) {
  const callback = useRef(onReset);
  callback.current = onReset;
  useEffect(() => {
    callback.current();
    reset();
  }, [marker, reset]);
}
