"use client";

/**
 * „Întrebări din povești” — roata cu întrebările articolelor. Pachetele vin
 * de pe server (pagina jocului le derivă din registrul articolelor); aici e
 * doar jocul: învârti, răspunzi cu voce tare, apoi vezi răspunsul din articol.
 */

import { linkTap } from "@/app/components/ui";
import Link from "next/link";
import { useState } from "react";
import { useReactionWhen, useUtterance } from "../voice/context";
import type { StoryDeck } from "@/app/articole/articles";
import Tabs from "./tabs";
import { DeckHeader, GameSkeleton, board, btnSecondary } from "./ui";
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

function EmptyState() {
  return (
    <div className={board + " px-5 py-8 text-center text-gray-600"}>
      <p className="text-3xl" aria-hidden="true">
        📜
      </p>
      <p className="mt-2 font-semibold">Roata asta se umple din articole.</p>
      <p className="mt-1 text-sm">
        Primele{" "}
        <Link href="/articole" className={linkTap + " hover:underline"}>
          articole
        </Link>
        {" sunt pe drum — fiecare aduce întrebările lui."}
      </p>
    </div>
  );
}

/** Ce pune jocul ăsta în cartonașul casei: întrebarea, apoi răspunsul — la cerere. */
function StoryCard(props: {
  landed: number | null;
  spinning: boolean;
  question: string | undefined;
  answer: string | undefined;
  revealed: boolean;
  onReveal: () => void;
}) {
  return (
    <LandedCard
      landed={props.landed}
      spinning={props.spinning}
      idle="Învârte roata și răspunde cu voce tare."
      shape="min-h-[128px] items-center gap-3 short:min-h-[96px] short:gap-2"
    >
      <LandedQuestion>{props.question}</LandedQuestion>
      {props.revealed ? (
        <p className="motion-safe:animate-pop font-bold text-indigo-600">{props.answer}</p>
      ) : (
        <button type="button" onClick={props.onReveal} className={btnSecondary}>
          Arată răspunsul
        </button>
      )}
    </LandedCard>
  );
}

/** Butonul casei plus trimiterea la articole — răspunsul întreg e acolo. */
function SpinControls(props: { spinning: boolean; onSpin: () => void }) {
  return (
    <>
      <SpinButton spinning={props.spinning} onSpin={props.onSpin} />

      <p className="mt-3 text-center text-sm text-gray-500">
        Răspunsurile sunt în{" "}
        <Link href="/articole" className={linkTap + " hover:underline"}>
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
    drawAndSpin(rotor, items, wheel);
  }

  function changeDeck(index: number) {
    if (wheel.spinning) return;
    setDeckIndex(index);
    setRevealed(false);
    wheel.clearLanded();
  }

  /** „Ia-o de la capăt": uită runda, fără să tragă o întrebare pe loc. */
  function restart() {
    if (wheel.spinning) return;
    setRevealed(false);
    rotor.clear();
    wheel.clearLanded();
  }

  // Derivatele roții stau lângă starea ei: componenta doar le așază pe ecran.
  const seen = seenWedges(
    items.map((item) => item.id),
    rotor.seenIds
  );

  return {
    deck,
    items,
    rotor,
    wheel,
    landedItem,
    revealed,
    setRevealed,
    spin,
    changeDeck,
    restart,
    seen,
  };
}

export default function StoryQuestionsGame({ decks }: { decks: StoryDeck[] }) {
  const {
    deck,
    items,
    rotor,
    wheel,
    landedItem,
    revealed,
    setRevealed,
    spin,
    changeDeck,
    restart,
    seen,
  } = useStoryWheel(decks);
  useUtterance(spokenFor(landedItem, wheel.spinning, revealed));
  useReactionWhen(revealed, "bucurie");

  if (!deck || items.length === 0) return <EmptyState />;
  if (!rotor.ready) return <GameSkeleton />;

  return (
    <div>
      <StoryTabs decks={decks} activeId={deck.id} onChange={changeDeck} />

      <DeckHeader
        label="Întrebarea"
        seen={rotor.seen}
        total={rotor.total}
        round={rotor.round}
        onRestart={restart}
        emptyLabel={`${rotor.total} întrebări`}
      />

      <WheelStage
        keys={items.map((item) => item.id)}
        label={deck.label}
        rotation={wheel.rotation}
        spinMs={wheel.spinMs}
        landed={wheel.landed}
        seen={seen}
      />

      <StoryCard
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
