"use client";

import { useState } from "react";
import { sellItems } from "../content";
import { numeralDe } from "./format";
import {
  Countdown,
  DeckBar,
  GameSkeleton,
  GameStatus,
  StatusAction,
  board,
  btnGhost,
  btnPrimary,
} from "./ui";
import { useCountdown, useRoundReset, useTimeUp } from "./use-countdown";
import { useDeck } from "./use-deck";

const DURATION_S = 60;

type Phase = "ready" | "running" | "sold" | "timeup";

type Item = (typeof sellItems)[number];

/** Mesajul de sub cronometru — fazele scoase din JSX, ca ramurile să se citească drept listă. */
function statusMessage(props: { phase: Phase; bonus: boolean; item: Item; soldIn: number }) {
  const { phase, bonus, item, soldIn } = props;
  if (phase === "sold")
    return (
      <span className="font-semibold text-emerald-700">
        💰 Vândut, în {soldIn === 1 ? "o secundă" : `${numeralDe(soldIn)} secunde`}! Un vânzător
        înnăscut.
      </span>
    );
  if (phase === "timeup")
    return (
      <span className="font-semibold text-gray-700">
        S-a închis piața! Dar pledoaria a fost pe gratis — mai încearcă una.
      </span>
    );
  if (bonus)
    return (
      <span className="text-gray-600">
        <span className="font-semibold text-indigo-600">Argument bonus:</span> {item.bonus}
      </span>
    );
  if (phase === "running")
    return <span className="text-gray-600">Spune tot ce-l face irezistibil — cu entuziasm!</span>;
  return <span className="text-gray-500">Pornește cronometrul și convinge-ne.</span>;
}

function SellBoard(props: {
  item: Item;
  phase: Phase;
  bonus: boolean;
  soldIn: number;
  remaining: number;
}) {
  return (
    <div
      className={board + " mt-3 flex flex-col items-center gap-5 p-5 text-center sm:gap-6 sm:p-8"}
    >
      <p className="text-pretty text-sm font-semibold uppercase tracking-[0.14em] text-gray-500">
        Vinde-ne…
      </p>
      <p className="text-balance text-xl font-semibold leading-snug text-gray-900 sm:text-2xl">
        {props.item.item}
      </p>

      <Countdown remaining={props.remaining} total={DURATION_S} />

      <p className="min-h-[3.25rem] max-w-[42ch] text-balance leading-snug" aria-live="polite">
        {statusMessage({
          phase: props.phase,
          bonus: props.bonus,
          item: props.item,
          soldIn: props.soldIn,
        })}
      </p>
    </div>
  );
}

function SellControls(props: {
  phase: Phase;
  bonus: boolean;
  onStart: () => void;
  onSold: () => void;
  onBonus: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-3">
      {props.phase === "running" ? (
        <>
          <button type="button" onClick={props.onSold} className={btnPrimary + " flex-1 basis-40"}>
            Am vândut-o!
          </button>
          <button
            type="button"
            onClick={props.onBonus}
            disabled={props.bonus}
            className={btnGhost + " flex-1 basis-40"}
          >
            💡 Argument
          </button>
        </>
      ) : props.phase === "ready" ? (
        <button type="button" onClick={props.onStart} className={btnPrimary + " flex-1 basis-40"}>
          Pornește
        </button>
      ) : (
        <button type="button" onClick={props.onNext} className={btnPrimary + " flex-1 basis-40"}>
          Următorul obiect
        </button>
      )}
    </div>
  );
}

export default function SellItGame() {
  const deck = useDeck("vinde", sellItems);
  const timer = useCountdown(DURATION_S);
  const [phase, setPhase] = useState<Phase>("ready");
  const [bonus, setBonus] = useState(false);
  const [soldIn, setSoldIn] = useState(0);

  const item = deck.chosen[0];

  useRoundReset(deck.chosen, timer.reset, () => {
    setPhase("ready");
    setBonus(false);
  });

  useTimeUp(phase === "running", timer, () => setPhase("timeup"));

  function start() {
    timer.start();
    setPhase("running");
  }

  function sold() {
    setSoldIn(timer.usedSeconds());
    timer.stop();
    setPhase("sold");
  }

  if (!deck.ready || !item) return <GameSkeleton />;

  return (
    <div>
      <GameStatus action={<StatusAction onClick={() => deck.next()}>Alt obiect</StatusAction>}>
        Obiectul {deck.seen} din {deck.total}
        {deck.round > 1 ? ` · runda ${deck.round}` : ""}
      </GameStatus>

      <DeckBar seen={deck.seen} total={deck.total} />

      <SellBoard
        item={item}
        phase={phase}
        bonus={bonus}
        soldIn={soldIn}
        remaining={timer.remaining}
      />

      <SellControls
        phase={phase}
        bonus={bonus}
        onStart={start}
        onSold={sold}
        onBonus={() => setBonus(true)}
        onNext={() => deck.next()}
      />

      <p className="mt-3 text-sm text-gray-500">
        Singur: convinge oglinda. În grup: fiecare vinde alt obiect — cine convinge juriul?
      </p>
    </div>
  );
}
