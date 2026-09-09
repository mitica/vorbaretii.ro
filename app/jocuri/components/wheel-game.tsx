"use client";

import { wheelDecks, wheelItems } from "../content";
import Tabs from "./tabs";
import { DeckHeader, GameSkeleton, board, btnPrimary } from "./ui";
import { useDeck } from "./use-deck";
import { WheelStage, seenWedges, useSpinTo } from "./wheel-board";
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

function LandedCard(props: {
  landed: number | null;
  spinning: boolean;
  prompt: string | undefined;
}) {
  return (
    <div
      className={
        board +
        " mx-auto mt-3 flex min-h-[104px] w-full max-w-xl flex-col justify-center p-4 text-center short:min-h-[64px] short:p-3"
      }
      aria-live="polite"
    >
      {props.landed === null ? (
        <p className="text-gray-500">
          {props.spinning
            ? "Hopa, unde se oprește?"
            : "Apasă butonul și vezi ce întrebare îți iese."}
        </p>
      ) : (
        <p className="motion-safe:animate-pop text-balance text-lg font-semibold leading-snug text-gray-900 sm:text-xl">
          {props.prompt}
        </p>
      )}
    </div>
  );
}

/** Pachetul activ + rotorul lui + învârtirea — starea întreagă a jocului. */
function useWheelGame() {
  const [deckIndex, setDeckIndex] = useState(0);
  const deck = wheelDecks[deckIndex] ?? firstDeck;
  const items = wheelItems[deckIndex] ?? firstItems;
  const rotor = useDeck(`roata.${deck.id}`, items, { drawOnMount: false });
  const wheel = useSpinTo(deck.prompts.length);

  function spin() {
    if (wheel.spinning) return;
    const [item] = rotor.next();
    if (!item) return;
    const index = items.findIndex((candidate) => candidate.id === item.id);
    if (index >= 0) wheel.spinTo(index);
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

/**
 * Butonul e `inline-flex`, iar pe un element inline `mx-auto` nu face nimic:
 * îl centrăm din părinte. Rândul lui e acțiunea unei ture (ADR-038).
 */
function SpinButton(props: { spinning: boolean; onSpin: () => void }) {
  return (
    <div className="mt-3 flex justify-center sm:mt-4" data-game-action>
      <button
        type="button"
        onClick={props.onSpin}
        disabled={props.spinning}
        className={btnPrimary + " w-full sm:w-64 sm:text-lg"}
      >
        {props.spinning ? "Se învârte…" : "Învârte roata"}
      </button>
    </div>
  );
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
        prompt={wheel.landed === null ? undefined : deck.prompts[wheel.landed]}
      />

      <SpinButton spinning={wheel.spinning} onSpin={spin} />
    </div>
  );
}
