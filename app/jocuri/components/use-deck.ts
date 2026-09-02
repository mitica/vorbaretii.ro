"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EMPTY_ROTATION, coerceRotation, pickUnseen, type RotationState } from "./rotation";
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
export type DeckOptions = {
  /** Câte elemente pe lot (implicit 1). */
  count?: number;
  /** Roata extrage abia când se apasă butonul, nu la deschiderea paginii. */
  drawOnMount?: boolean;
};

/** Extrage lotul următor din rotație și îl materializează în elemente întregi. */
function drawBatch<T extends { id: string }>(
  maps: { ids: string[]; byId: Map<string, T> },
  from: RotationState,
  count: number
) {
  const { chosen: drawn, next } = pickUnseen(maps.ids, from, count);
  const drawnItems = drawn
    .map((id) => maps.byId.get(id))
    .filter((item): item is T => item !== undefined);
  return { drawnItems, next };
}

/** Prima citire din localStorage — o singură dată per cheie, după montare. */
function useDeckBoot(props: {
  key: string;
  drawOnMount: boolean;
  apply: (from: RotationState) => unknown;
  restore: (stored: RotationState) => void;
  setReady: (ready: boolean) => void;
}) {
  const initializedFor = useRef<string | null>(null);
  useEffect(() => {
    // Se reia și când se schimbă cheia (ex. alt set de întrebări la roată).
    if (initializedFor.current === props.key) return;
    initializedFor.current = props.key;
    props.setReady(false);
    const stored = coerceRotation(loadJson<unknown>(props.key, null));
    if (props.drawOnMount) props.apply(stored);
    else props.restore(stored);
    props.setReady(true);
  });
}

export function useDeck<T extends { id: string }>(
  key: string,
  items: readonly T[],
  options: DeckOptions = {}
): Deck<T> {
  const { count = 1, drawOnMount = true } = options;
  const maps = useMemo(
    () => ({ ids: items.map((item) => item.id), byId: new Map(items.map((i) => [i.id, i])) }),
    [items]
  );

  const stateRef = useRef<RotationState>(EMPTY_ROTATION);
  const [chosen, setChosen] = useState<T[]>([]);
  const [progress, setProgress] = useState({ seen: 0, round: 1 });
  const [ready, setReady] = useState(false);

  const apply = useCallback(
    (from: RotationState) => {
      const { drawnItems, next } = drawBatch(maps, from, count);
      stateRef.current = next;
      saveJson(key, next);
      setChosen(drawnItems);
      setProgress({ seen: next.seen.length, round: next.round });
      return drawnItems;
    },
    [maps, count, key]
  );

  const restore = useCallback((stored: RotationState) => {
    stateRef.current = stored;
    setChosen([]);
    setProgress({ seen: stored.seen.length, round: stored.round });
  }, []);
  useDeckBoot({ key, drawOnMount, apply, restore, setReady });

  const next = useCallback(() => apply(stateRef.current), [apply]);
  const restart = useCallback(() => apply(EMPTY_ROTATION), [apply]);

  return {
    ready,
    chosen,
    next,
    restart,
    seen: progress.seen,
    total: maps.ids.length,
    round: progress.round,
  };
}
