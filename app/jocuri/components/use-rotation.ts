"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EMPTY_ROTATION, pickUnseen, type RotationState } from "./rotation";
import { loadJson, saveJson } from "./storage";

export type Rotation = {
  /** Fals până citim din localStorage. Până atunci jocul arată scheletul. */
  ready: boolean;
  /** Lotul curent de id-uri (unul singur, la jocurile care merg element cu element). */
  chosen: string[];
  /** Extrage lotul următor, doar din ce n-a ieșit încă. Îl și returnează. */
  next: () => string[];
  /** Uită tot și o ia de la prima rundă. */
  restart: () => string[];
  /** Câte elemente au ieșit în runda curentă, din total. */
  seen: number;
  total: number;
  round: number;
};

/**
 * Extragere fără repetiții, cu memorie în browser.
 *
 * ⚠️ Prima extragere se face **după montare**, nu la randare: site-ul e export
 * static, iar `Math.random()` în corpul componentei ar desena altceva pe server
 * decât în browser. Până atunci `ready` e `false`.
 */
export function useRotation(
  key: string,
  ids: readonly string[],
  count = 1,
  /** Roata extrage abia când se apasă butonul, nu la deschiderea paginii. */
  drawOnMount = true
): Rotation {
  const stateRef = useRef<RotationState>(EMPTY_ROTATION);
  const initializedFor = useRef<string | null>(null);
  const [chosen, setChosen] = useState<string[]>([]);
  const [progress, setProgress] = useState({ seen: 0, round: 1 });
  const [ready, setReady] = useState(false);

  const apply = useCallback(
    (from: RotationState) => {
      const { chosen: drawn, next } = pickUnseen(ids, from, count);
      stateRef.current = next;
      saveJson(key, next);
      setChosen(drawn);
      setProgress({ seen: next.seen.length, round: next.round });
      return drawn;
    },
    [count, ids, key]
  );

  useEffect(() => {
    // Se reia și când se schimbă cheia (ex. alt set de întrebări la roată).
    if (initializedFor.current === key) return;
    initializedFor.current = key;
    setReady(false);
    const stored = loadJson<RotationState>(key, EMPTY_ROTATION);
    if (drawOnMount) {
      apply(stored);
    } else {
      stateRef.current = stored;
      setChosen([]);
      setProgress({ seen: stored.seen.length, round: stored.round });
    }
    setReady(true);
  }, [apply, drawOnMount, key]);

  const next = useCallback(() => apply(stateRef.current), [apply]);
  const restart = useCallback(() => apply(EMPTY_ROTATION), [apply]);

  return {
    ready,
    chosen,
    next,
    restart,
    seen: progress.seen,
    total: ids.length,
    round: progress.round
  };
}
