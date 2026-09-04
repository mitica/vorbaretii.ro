"use client";

/**
 * „Întrebări din povești” — roata cu întrebările articolelor. Pachetele vin
 * de pe server (pagina jocului le derivă din registrul articolelor); aici e
 * doar jocul: învârti, răspunzi cu voce tare, apoi vezi răspunsul din articol.
 */

import Link from "next/link";
import { useState } from "react";
import { useReactionWhen, useUtterance } from "../voice/context";
import type { StoryDeck } from "@/app/articole/articles";
import Tabs from "./tabs";
import { DeckBar, GameSkeleton, board, btnPrimary, btnSecondary } from "./ui";
import { useDeck } from "./use-deck";
import { WheelSvg, useSpinTo } from "./wheel-board";

function EmptyState() {
  return (
    <div className={board + " px-5 py-8 text-center text-gray-600"}>
      <p className="text-3xl" aria-hidden="true">
        📜
      </p>
      <p className="mt-2 font-semibold">Roata asta se umple din articole.</p>
      <p className="mt-1 text-sm">
        Primele{" "}
        <Link
          href="/articole"
          className="inline-flex min-h-[44px] items-center font-semibold text-indigo-600 hover:underline"
        >
          articole
        </Link>
        {" sunt pe drum — fiecare aduce întrebările lui."}
      </p>
    </div>
  );
}

function StoryLandedCard(props: {
  landed: number | null;
  spinning: boolean;
  question: string | undefined;
  answer: string | undefined;
  revealed: boolean;
  onReveal: () => void;
}) {
  return (
    <div
      className={
        board +
        " mx-auto mt-4 flex min-h-[128px] w-full max-w-xl flex-col items-center justify-center gap-3 p-4 text-center"
      }
      aria-live="polite"
    >
      {props.landed === null ? (
        <p className="text-gray-500">
          {props.spinning ? "Hopa, unde se oprește?" : "Învârte roata și răspunde cu voce tare."}
        </p>
      ) : (
        <>
          <p className="motion-safe:animate-pop text-balance text-lg font-semibold leading-snug text-gray-900 sm:text-xl">
            {props.question}
          </p>
          {props.revealed ? (
            <p className="motion-safe:animate-pop font-bold text-indigo-600">{props.answer}</p>
          ) : (
            <button type="button" onClick={props.onReveal} className={btnSecondary}>
              Arată răspunsul
            </button>
          )}
        </>
      )}
    </div>
  );
}

function SpinControls(props: { spinning: boolean; onSpin: () => void }) {
  return (
    <>
      <div className="mt-3 flex justify-center sm:mt-4">
        <button
          type="button"
          onClick={props.onSpin}
          disabled={props.spinning}
          className={btnPrimary + " w-full sm:w-64 sm:text-lg"}
        >
          {props.spinning ? "Se învârte…" : "Învârte roata"}
        </button>
      </div>

      <p className="mt-3 text-center text-sm text-gray-500">
        Răspunsurile sunt în{" "}
        <Link
          href="/articole"
          className="inline-flex min-h-[44px] items-center font-semibold text-indigo-600 hover:underline"
        >
          articole
        </Link>
        {" — citește articolul, apoi întoarce-te cu roata."}
      </p>
    </>
  );
}

function StoryTabs(props: {
  decks: StoryDeck[];
  activeId: string;
  onChange: (index: number) => void;
}) {
  if (props.decks.length < 2) return null;
  return (
    <Tabs
      items={props.decks.map((d) => ({ id: d.id, label: d.label }))}
      activeId={props.activeId}
      onChange={(id) => props.onChange(props.decks.findIndex((d) => d.id === id))}
      label="Categoria de întrebări"
    />
  );
}

/** Extrage următoarea întrebare din rotor și oprește roata pe sectorul ei. */
function spinWheel(
  rotor: ReturnType<typeof useDeck<StoryDeck["items"][number]>>,
  items: StoryDeck["items"],
  wheel: ReturnType<typeof useSpinTo>
) {
  const [item] = rotor.next();
  if (!item) return;
  const index = items.findIndex((candidate) => candidate.id === item.id);
  if (index >= 0) wheel.spinTo(index);
}

/** Ce citește mascota: nimic cât se învârte; întrebarea; răspunsul după reveal. */
function spokenFor(
  item: StoryDeck["items"][number] | undefined,
  spinning: boolean,
  revealed: boolean
) {
  if (!item || spinning) return null;
  return revealed ? item.answer : item.question;
}

/** Pachetul activ + rotorul lui + roata + dezvăluirea — starea întreagă a jocului. */
function useStoryWheel(decks: StoryDeck[]) {
  const [deckIndex, setDeckIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const deck = decks[deckIndex] ?? decks[0];
  const items = deck?.items ?? [];
  const rotor = useDeck(`curiozitati.${deck?.id ?? "gol"}`, items, { drawOnMount: false });
  const wheel = useSpinTo(items.length);
  const landedItem = wheel.landed === null ? undefined : items[wheel.landed];

  function spin() {
    if (wheel.spinning) return;
    setRevealed(false);
    spinWheel(rotor, items, wheel);
  }

  function changeDeck(index: number) {
    if (wheel.spinning) return;
    setDeckIndex(index);
    setRevealed(false);
    wheel.clearLanded();
  }

  return { deck, items, rotor, wheel, landedItem, revealed, setRevealed, spin, changeDeck };
}

export default function StoryQuestionsGame({ decks }: { decks: StoryDeck[] }) {
  const { deck, items, rotor, wheel, landedItem, revealed, setRevealed, spin, changeDeck } =
    useStoryWheel(decks);
  useUtterance(spokenFor(landedItem, wheel.spinning, revealed));
  useReactionWhen(revealed, "bucurie");

  if (!deck || items.length === 0) return <EmptyState />;
  if (!rotor.ready) return <GameSkeleton />;

  return (
    <div>
      <StoryTabs decks={decks} activeId={deck.id} onChange={changeDeck} />

      <DeckBar seen={rotor.seen} total={rotor.total} />

      <div className="mt-4 flex justify-center">
        <WheelSvg
          keys={items.map((item) => item.id)}
          label={deck.label}
          rotation={wheel.rotation}
          spinMs={wheel.spinMs}
          landed={wheel.landed}
        />
      </div>

      <StoryLandedCard
        landed={wheel.landed}
        spinning={wheel.spinning}
        question={landedItem?.question}
        answer={landedItem?.answer}
        revealed={revealed}
        onReveal={() => setRevealed(true)}
      />

      <SpinControls spinning={wheel.spinning} onSpin={spin} />
    </div>
  );
}
