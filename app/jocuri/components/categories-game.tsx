"use client";

import { useEffect, useRef, useState } from "react";
import { categories } from "../content";
import { numeralDe } from "./format";
import {
  DeckBar,
  GameSkeleton,
  GameStatus,
  StatusAction,
  board,
  btnGhost,
  btnPrimary
} from "./ui";
import { useDeck } from "./use-deck";

const TARGET = 5;
const DURATION_S = 60;

type Phase = "ready" | "running" | "won" | "timeup";

function clock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function wonMessage(seconds: number) {
  if (seconds === 1) return "🎉 Toate 5, într-o singură secundă!";
  return `🎉 Toate 5, în ${numeralDe(seconds)} secunde!`;
}

export default function CategoriesGame() {
  const deck = useDeck("categorii", categories);
  const [phase, setPhase] = useState<Phase>("ready");
  const [said, setSaid] = useState(0);
  const [remaining, setRemaining] = useState(DURATION_S);
  const [wonIn, setWonIn] = useState(0);
  const endAt = useRef(0);

  const category = deck.chosen[0];

  useEffect(() => {
    setPhase("ready");
    setSaid(0);
    setRemaining(DURATION_S);
  }, [deck.chosen]);

  useEffect(() => {
    if (phase !== "running") return;
    const timer = setInterval(() => {
      const left = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) setPhase("timeup");
    }, 200);
    return () => clearInterval(timer);
  }, [phase]);

  function start() {
    endAt.current = Date.now() + DURATION_S * 1000;
    setSaid(0);
    setRemaining(DURATION_S);
    setPhase("running");
  }

  function sayOne() {
    if (phase !== "running" || said >= TARGET) return;
    const next = said + 1;
    setSaid(next);
    if (next === TARGET) {
      setWonIn(
        Math.max(1, Math.round(DURATION_S - (endAt.current - Date.now()) / 1000))
      );
      setPhase("won");
    }
  }

  if (!deck.ready || !category) return <GameSkeleton />;

  const urgent = phase === "running" && remaining <= 10;

  return (
    <div>
      <GameStatus
        action={
          <StatusAction onClick={() => deck.next()}>Altă categorie</StatusAction>
        }
      >
        Categoria {deck.seen} din {deck.total}
        {deck.round > 1 ? ` · runda ${deck.round}` : ""}
      </GameStatus>

      <DeckBar seen={deck.seen} total={deck.total} />

      <div
        className={
          board +
          " mt-3 flex flex-col items-center gap-5 p-5 text-center sm:gap-6 sm:p-8"
        }
      >
        <p className="text-balance text-xl font-semibold leading-snug text-gray-900 sm:text-2xl">
          Spune {category.prompt}!
        </p>

        <div className="w-full max-w-xs">
          <p
            className={
              "text-2xl font-bold tabular-nums " +
              (urgent ? "text-pink-600" : "text-gray-900")
            }
          >
            {clock(remaining)}
          </p>
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-indigo-100">
            {/* Lățimea se calculează la fiecare secundă, deci nu poate fi o clasă. */}
            <div
              className={
                "h-full rounded-full transition-[width] duration-200 " +
                (urgent ? "bg-pink-600" : "bg-indigo-500")
              }
              style={{ width: `${(remaining / DURATION_S) * 100}%` }}
            />
          </div>
        </div>

        <div
          className="flex flex-wrap items-center justify-center gap-2 sm:gap-3"
          role="group"
          aria-label="Câte ai spus până acum"
        >
          {Array.from({ length: TARGET }, (_, index) => {
            const filled = index < said;
            return (
              <button
                key={index}
                type="button"
                disabled={phase !== "running" || filled}
                onClick={sayOne}
                aria-label={
                  filled
                    ? `A ${index + 1}-a e spusă`
                    : `Am mai spus una (până acum ${said} din ${TARGET})`
                }
                className={
                  "touch-manipulation flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full border-2 p-2 text-lg font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 " +
                  (filled
                    ? "motion-safe:animate-pop border-emerald-300 bg-emerald-50 text-emerald-700"
                    : phase === "running"
                      ? "border-gray-300 bg-white text-gray-400 hover:border-indigo-400"
                      : "border-dashed border-gray-200 bg-white text-gray-300")
                }
              >
                {filled ? "✓" : index + 1}
              </button>
            );
          })}
        </div>

        <p
          className="min-h-[3rem] max-w-[38ch] text-balance leading-snug"
          aria-live="polite"
        >
          {phase === "won" ? (
            <span className="font-semibold text-emerald-700">
              {wonMessage(wonIn)}
            </span>
          ) : phase === "timeup" ? (
            <span className="font-semibold text-gray-700">
              S-a dus minutul! Ai zis {said} din {TARGET} — data viitoare le iei
              pe toate.
            </span>
          ) : phase === "running" ? (
            <span className="text-gray-600">
              Spune cu voce tare și atinge câte o bulă pentru fiecare.
            </span>
          ) : (
            <span className="text-gray-500">
              Pornește cronometrul când ești gata.
            </span>
          )}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {phase === "won" || phase === "timeup" ? (
          <button
            type="button"
            onClick={() => deck.next()}
            className={btnPrimary + " flex-1 basis-40"}
          >
            Următoarea
          </button>
        ) : phase === "running" ? (
          <button
            type="button"
            onClick={() => deck.next()}
            className={btnGhost + " flex-1 basis-40"}
          >
            Sar peste
          </button>
        ) : (
          <button
            type="button"
            onClick={start}
            className={btnPrimary + " flex-1 basis-40"}
          >
            Pornește
          </button>
        )}
      </div>

      <p className="mt-3 text-sm text-gray-500">
        Singur: contra ceasului. În grup: pe rânduri — fiecare cu categoria lui.
      </p>
    </div>
  );
}
