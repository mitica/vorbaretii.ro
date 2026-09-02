"use client";

import { wheelDecks, wheelItems } from "../content";
import Tabs from "./tabs";
import { DeckBar, GameSkeleton, board, btnPrimary } from "./ui";
import { useDeck } from "./use-deck";
import { WheelSvg, useSpinTo } from "./wheel-board";
import { useState } from "react";

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
  seen: number;
  total: number;
  round: number;
}) {
  return (
    <div
      className={
        board +
        " mx-auto mt-4 flex min-h-[104px] w-full max-w-xl flex-col justify-center p-4 text-center"
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
        <>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
            Întrebarea {props.seen} din {props.total}
            {props.round > 1 ? ` · runda ${props.round}` : ""}
          </p>
          <p className="motion-safe:animate-pop mt-2 text-balance text-lg font-semibold leading-snug text-gray-900 sm:text-xl">
            {props.prompt}
          </p>
        </>
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

  return { deck, rotor, wheel, spin, changeDeck };
}

export default function WheelGame() {
  const { deck, rotor, wheel, spin, changeDeck } = useWheelGame();

  if (!rotor.ready) return <GameSkeleton />;

  return (
    <div>
      <Tabs
        items={wheelDecks.map((item) => ({ id: item.id, label: item.label }))}
        activeId={deck.id}
        onChange={(id) => changeDeck(wheelDecks.findIndex((item) => item.id === id))}
        label="Setul de întrebări"
      />

      <DeckBar seen={rotor.seen} total={rotor.total} />

      <div className="mt-4 flex justify-center">
        <WheelSvg
          keys={deck.prompts}
          label={deck.label}
          rotation={wheel.rotation}
          spinMs={wheel.spinMs}
          landed={wheel.landed}
        />
      </div>

      <LandedCard
        landed={wheel.landed}
        spinning={wheel.spinning}
        prompt={wheel.landed === null ? undefined : deck.prompts[wheel.landed]}
        seen={rotor.seen}
        total={rotor.total}
        round={rotor.round}
      />

      {/* Butonul e `inline-flex`, iar pe un element inline `mx-auto` nu face
          nimic. Îl centrăm din părinte, nu din marginile lui. */}
      <div className="mt-3 flex justify-center sm:mt-4">
        <button
          type="button"
          onClick={spin}
          disabled={wheel.spinning}
          className={btnPrimary + " w-full sm:w-64 sm:text-lg"}
        >
          {wheel.spinning ? "Se învârte…" : "Învârte roata"}
        </button>
      </div>
    </div>
  );
}
