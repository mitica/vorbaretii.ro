"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  EMPTY_ROTATION,
  coerceRotation,
  pickUnseen,
  type RotationState
} from "./rotation";
import { loadJson, saveJson } from "./storage";

export type Deck<T> = {
  /** Fals până citim din localStorage. Până atunci jocul arată scheletul. */
  ready: boolean;
  /** Lotul curent (un singur element, la jocurile care merg bucată cu bucată). */
  chosen: T[];
  /** Extrage lotul următor, doar din ce n-a ieșit încă. Îl și returnează. */
  next: () => T[];
  /** Uită tot și o ia de la prima rundă. */
  restart: () => T[];
  /** Câte elemente au ieșit în runda curentă, din total. */
  seen: number;
  total: number;
  round: number;
};

/**
 * Extragere fără repetiții, cu memorie în browser. Jocul dă lista lui de
 * elemente — fiecare cu `id`, pus automat în content.ts — și primește înapoi
 * elemente întregi. Id-urile rămân o treabă internă: niciun joc nu mai are
 * nevoie de propria hartă id → element.
 *
 * ⚠️ Prima extragere se face **după montare**, nu la randare: site-ul e export
 * static, iar `Math.random()` în corpul componentei ar desena altceva pe server
 * decât în browser. Până atunci `ready` e `false`.
 */
export function useDeck<T extends { id: string }>(
  key: string,
  items: readonly T[],
  count = 1,
  /** Roata extrage abia când se apasă butonul, nu la deschiderea paginii. */
  drawOnMount = true
): Deck<T> {
  const ids = useMemo(() => items.map((item) => item.id), [items]);
  const byId = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items]
  );

  const stateRef = useRef<RotationState>(EMPTY_ROTATION);
  const initializedFor = useRef<string | null>(null);
  const [chosen, setChosen] = useState<T[]>([]);
  const [progress, setProgress] = useState({ seen: 0, round: 1 });
  const [ready, setReady] = useState(false);

  const apply = useCallback(
    (from: RotationState) => {
      const { chosen: drawn, next } = pickUnseen(ids, from, count);
      stateRef.current = next;
      saveJson(key, next);
      const drawnItems = drawn
        .map((id) => byId.get(id))
        .filter((item): item is T => item !== undefined);
      setChosen(drawnItems);
      setProgress({ seen: next.seen.length, round: next.round });
      return drawnItems;
    },
    [byId, count, ids, key]
  );

  useEffect(() => {
    // Se reia și când se schimbă cheia (ex. alt set de întrebări la roată).
    if (initializedFor.current === key) return;
    initializedFor.current = key;
    setReady(false);
    const stored = coerceRotation(loadJson<unknown>(key, null));
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
