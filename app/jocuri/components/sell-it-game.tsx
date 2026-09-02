"use client";

import { useEffect, useState } from "react";
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
  btnPrimary
} from "./ui";
import { useCountdown } from "./use-countdown";
import { useDeck } from "./use-deck";

const DURATION_S = 60;

type Phase = "ready" | "running" | "sold" | "timeup";

export default function SellItGame() {
  const deck = useDeck("vinde", sellItems);
  const timer = useCountdown(DURATION_S);
  const [phase, setPhase] = useState<Phase>("ready");
  const [bonus, setBonus] = useState(false);
  const [soldIn, setSoldIn] = useState(0);

  const item = deck.chosen[0];

  useEffect(() => {
    setPhase("ready");
    setBonus(false);
    timer.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck.chosen]);

  useEffect(() => {
    if (phase === "running" && !timer.running && timer.remaining === 0) {
      setPhase("timeup");
    }
  }, [phase, timer.running, timer.remaining]);

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
      <GameStatus
        action={
          <StatusAction onClick={() => deck.next()}>Alt obiect</StatusAction>
        }
      >
        Obiectul {deck.seen} din {deck.total}
        {deck.round > 1 ? ` · runda ${deck.round}` : ""}
      </GameStatus>

      <DeckBar seen={deck.seen} total={deck.total} />

      <div
        className={
          board +
          " mt-3 flex flex-col items-center gap-5 p-5 text-center sm:gap-6 sm:p-8"
        }
      >
        <p className="text-pretty text-sm font-semibold uppercase tracking-[0.14em] text-gray-500">
          Vinde-ne…
        </p>
        <p className="text-balance text-xl font-semibold leading-snug text-gray-900 sm:text-2xl">
          {item.item}
        </p>

        <Countdown remaining={timer.remaining} total={DURATION_S} />

        <p className="min-h-[3.25rem] max-w-[42ch] text-balance leading-snug" aria-live="polite">
          {phase === "sold" ? (
            <span className="font-semibold text-emerald-700">
              💰 Vândut, în {soldIn === 1 ? "o secundă" : `${numeralDe(soldIn)} secunde`}!
              Un vânzător înnăscut.
            </span>
          ) : phase === "timeup" ? (
            <span className="font-semibold text-gray-700">
              S-a închis piața! Dar pledoaria a fost pe gratis — mai încearcă una.
            </span>
          ) : bonus ? (
            <span className="text-gray-600">
              <span className="font-semibold text-indigo-600">Argument bonus:</span>{" "}
              {item.bonus}
            </span>
          ) : phase === "running" ? (
            <span className="text-gray-600">
              Spune tot ce-l face irezistibil — cu entuziasm!
            </span>
          ) : (
            <span className="text-gray-500">
              Pornește cronometrul și convinge-ne.
            </span>
          )}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {phase === "running" ? (
          <>
            <button type="button" onClick={sold} className={btnPrimary + " flex-1 basis-40"}>
              Am vândut-o!
            </button>
            <button
              type="button"
              onClick={() => setBonus(true)}
              disabled={bonus}
              className={btnGhost + " flex-1 basis-40"}
            >
              💡 Argument
            </button>
          </>
        ) : phase === "ready" ? (
          <button type="button" onClick={start} className={btnPrimary + " flex-1 basis-40"}>
            Pornește
          </button>
        ) : (
          <button
            type="button"
            onClick={() => deck.next()}
            className={btnPrimary + " flex-1 basis-40"}
          >
            Următorul obiect
          </button>
        )}
      </div>

      <p className="mt-3 text-sm text-gray-500">
        Singur: convinge oglinda. În grup: fiecare vinde alt obiect — cine
        convinge juriul?
      </p>
    </div>
  );
}
