"use client";

import { wheelDecks, wheelItems } from "../content";
import Tabs from "./tabs";
import { DeckHeader, GameSkeleton } from "./ui";
import { useDeck } from "./use-deck";
import {
  LandedCard,
  LandedQuestion,
  SpinButton,
  WheelStage,
  drawAndSpin,
  seenWedges,
  useSpinTo,
} from "./wheel-board";
import { useState } from "react";
import { useUtterance } from "../voice/context";

// Conținutul are mereu cel puțin un set; helperul face tipul onest sub
// noUncheckedIndexedAccess fără aserțiuni.
function mustFirst<T>(list: readonly T[], what: string): T {
  const first = list[0];
  if (first === undefined) throw new Error(`content.ts: ${what} gol`);
  return first;
}
const firstDeck = mustFirst(wheelDecks, "wheelDecks");
const firstItems = mustFirst(wheelItems, "wheelItems");

/** Pachetul activ + rotorul lui + învârtirea — starea întreagă a jocului. */
function useWheelGame() {
  const [deckIndex, setDeckIndex] = useState(0);
  const deck = wheelDecks[deckIndex] ?? firstDeck;
  const items = wheelItems[deckIndex] ?? firstItems;
  const rotor = useDeck(`roata.${deck.id}`, items, { drawOnMount: false });
  const wheel = useSpinTo(deck.prompts.length);

  function spin() {
    drawAndSpin(rotor, items, wheel);
  }

  function changeDeck(index: number) {
    if (wheel.spinning) return;
    setDeckIndex(index);
    wheel.clearLanded();
  }

  /** „Ia-o de la capăt": uită runda, fără să tragă o întrebare pe loc. */
  function restart() {
    if (wheel.spinning) return;
    rotor.clear();
    wheel.clearLanded();
  }

  // Derivatele roții stau lângă starea ei: componenta doar le așază pe ecran.
  const landed = wheel.landed === null ? null : (deck.prompts[wheel.landed] ?? null);
  const seen = seenWedges(
    items.map((item) => item.id),
    rotor.seenIds
  );

  return { deck, rotor, wheel, spin, changeDeck, restart, landed, seen };
}

export default function WheelGame() {
  const { deck, rotor, wheel, spin, changeDeck, restart, landed, seen } = useWheelGame();
  useUtterance(wheel.spinning ? null : landed);

  if (!rotor.ready) return <GameSkeleton />;

  return (
    <div>
      <Tabs
        items={wheelDecks.map((item) => ({ id: item.id, label: item.label }))}
        activeId={deck.id}
        onChange={(id) => changeDeck(wheelDecks.findIndex((item) => item.id === id))}
        label="Setul de întrebări"
      />

      <DeckHeader
        label="Întrebarea"
        seen={rotor.seen}
        total={rotor.total}
        round={rotor.round}
        onRestart={restart}
        emptyLabel={`${rotor.total} întrebări`}
      />

      <WheelStage
        keys={deck.prompts}
        label={deck.label}
        rotation={wheel.rotation}
        spinMs={wheel.spinMs}
        landed={wheel.landed}
        seen={seen}
      />

      <LandedCard
        landed={wheel.landed}
        spinning={wheel.spinning}
        idle="Apasă butonul și vezi ce întrebare îți iese."
        shape="min-h-[104px] short:min-h-[64px]"
      >
        <LandedQuestion>{landed}</LandedQuestion>
      </LandedCard>

      <SpinButton spinning={wheel.spinning} onSpin={spin} />
    </div>
  );
}
