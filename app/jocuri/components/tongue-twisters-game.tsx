"use client";

import { useEffect, useRef, useState } from "react";
import { tongueTwisters } from "../content";
import { DeckBar, GameSkeleton, GameStatus, StatusAction, board, btnGhost, btnPrimary } from "./ui";
import { useDeck } from "./use-deck";
import { useUtterance } from "../voice/context";

type Phase = "ready" | "running" | "done";

/** Secunde cu o zecimală, cu virgulă românească: „7,3". */
function seconds(ms: number) {
  return (ms / 1000).toFixed(1).replace(".", ",");
}

/** Verdictul e mereu o laudă — viteza dă doar gradul de foc. */
function verdict(ms: number) {
  if (ms <= 8000) return "🔥 Limbă de foc!";
  if (ms <= 15000) return "⚡ Rapid de tot!";
  return "😄 Ai îmblânzit-o!";
}

function TwisterBoard({ text, phase, elapsed }: { text: string; phase: Phase; elapsed: number }) {
  return (
    <div
      className={board + " mt-3 flex flex-col items-center gap-5 p-6 text-center sm:gap-6 sm:p-8"}
    >
      <p className="text-balance font-serif text-xl italic leading-relaxed text-gray-900 sm:text-2xl">
        {text}
      </p>

      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-500">
        De spus de 3 ori, repede
      </p>

      <p
        className={
          "text-3xl font-bold tabular-nums " +
          (phase === "running" ? "text-pink-600" : "text-gray-900")
        }
      >
        {seconds(elapsed)} s
      </p>

      <p className="min-h-[1.75rem] text-balance leading-snug" aria-live="polite">
        {phase === "done" ? (
          <span className="font-semibold text-emerald-700">
            {verdict(elapsed)} De 3 ori în {seconds(elapsed)} secunde.
          </span>
        ) : phase === "running" ? (
          <span className="text-gray-600">Zi-o! O dată… de două ori… de trei ori!</span>
        ) : (
          <span className="text-gray-500">Pornește cronometrul și dă-i drumul.</span>
        )}
      </p>
    </div>
  );
}

function TwisterControls(props: {
  phase: Phase;
  onStart: () => void;
  onStop: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-3">
      {props.phase === "running" ? (
        <button
          type="button"
          onClick={props.onStop}
          className={btnPrimary + " flex-1 basis-40 sm:text-lg"}
        >
          Gata!
        </button>
      ) : props.phase === "done" ? (
        <>
          <button type="button" onClick={props.onStart} className={btnGhost + " flex-1 basis-40"}>
            Încă o dată
          </button>
          <button type="button" onClick={props.onNext} className={btnPrimary + " flex-1 basis-40"}>
            Următoarea
          </button>
        </>
      ) : (
        <>
          <button type="button" onClick={props.onStart} className={btnPrimary + " flex-1 basis-40"}>
            Pornește
          </button>
          <button type="button" onClick={props.onNext} className={btnGhost + " flex-1 basis-40"}>
            Alta
          </button>
        </>
      )}
    </div>
  );
}

export default function TongueTwistersGame() {
  const deck = useDeck("framantari", tongueTwisters);
  const [phase, setPhase] = useState<Phase>("ready");
  const [elapsed, setElapsed] = useState(0);
  const startAt = useRef(0);

  const twister = deck.chosen[0];
  useUtterance(twister?.text ?? null);

  useEffect(() => {
    setPhase("ready");
    setElapsed(0);
  }, [deck.chosen]);

  useEffect(() => {
    if (phase !== "running") return;
    const timer = setInterval(() => setElapsed(Date.now() - startAt.current), 100);
    return () => clearInterval(timer);
  }, [phase]);

  function start() {
    startAt.current = Date.now();
    setElapsed(0);
    setPhase("running");
  }

  function stop() {
    setElapsed(Date.now() - startAt.current);
    setPhase("done");
  }

  function goNext() {
    deck.next();
  }

  if (!deck.ready || !twister) return <GameSkeleton />;

  return (
    <div>
      <GameStatus
        action={
          deck.seen > 1 ? (
            <StatusAction onClick={() => deck.restart()}>Ia-o de la capăt</StatusAction>
          ) : undefined
        }
      >
        Frământarea {deck.seen} din {deck.total}
        {deck.round > 1 ? ` · runda ${deck.round}` : ""}
      </GameStatus>

      <DeckBar seen={deck.seen} total={deck.total} />

      <TwisterBoard text={twister.text} phase={phase} elapsed={elapsed} />

      <TwisterControls phase={phase} onStart={start} onStop={stop} onNext={goNext} />

      <p className="mt-3 text-sm text-gray-500">
        Singur: contra ceasului. În grup: pe rânduri — cine o spune curat și repede?
      </p>
    </div>
  );
}
