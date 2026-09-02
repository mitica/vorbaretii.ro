"use client";

import { useCallback, useEffect, useState } from "react";
import { anagrams } from "../content";
import { scrambleIndexes } from "./shuffle";
import { DeckHeader, GameSkeleton, board, btnGhost, btnPrimary } from "./ui";
import { useDeck } from "./use-deck";

const tile =
  "flex aspect-[3/4] w-full items-center justify-center rounded-xl text-xl font-bold sm:text-3xl";

/** Cuvintele lungi se rup în două rânduri egale, nu în 7 + 2. */
function perRow(length: number) {
  return length <= 6 ? length : Math.ceil(length / 2);
}

/**
 * Cât de late sunt rândurile de litere, pe număr de coloane. Coloanele sunt
 * `1fr` cu o lățime maximă: la dimensiuni normale literele au 3.25rem, iar când
 * nu mai încap (ecran mic, font mărit) se micșorează ele, în loc să împingă
 * pagina în lateral.
 *
 * Clasele se scriu întregi, nu compuse la rulare: Tailwind citește sursa ca
 * text, deci un nume construit din bucăți (`grid-cols-${n}`) n-ar exista în CSS.
 */
const TILE_GRID: Record<number, string> = {
  1: "grid-cols-1 max-w-[3.25rem]",
  2: "grid-cols-2 max-w-[7rem]",
  3: "grid-cols-3 max-w-[10.75rem]",
  4: "grid-cols-4 max-w-[14.5rem]",
  5: "grid-cols-5 max-w-[18.25rem]",
  6: "grid-cols-6 max-w-[22rem]",
};

function tileGrid(length: number) {
  return TILE_GRID[perRow(length)] ?? "grid-cols-6 max-w-[22rem]";
}

type Outcome = { gaveUp: boolean; correct: boolean; complete: boolean };

/** Clasa unui loc din cuvânt, pe stări — ramurile scoase din JSX. */
function slotClass(outcome: Outcome, filled: boolean) {
  if (outcome.gaveUp) return "border-indigo-200 bg-indigo-50 text-indigo-700";
  if (outcome.correct)
    return "motion-safe:animate-pop border-emerald-300 bg-emerald-50 text-emerald-800";
  if (outcome.complete) return "motion-safe:animate-shake border-red-300 bg-red-50 text-red-700";
  if (filled) return "border-gray-300 bg-gray-50 text-gray-900";
  return "border-dashed border-gray-300 bg-white";
}

function WordSlots(props: { word: string; picked: number[]; outcome: Outcome; columns: string }) {
  const { word, picked, outcome } = props;
  return (
    <div className={"mx-auto grid w-full gap-2 " + props.columns}>
      {word.split("").map((_, slot) => {
        const letterIndex = picked[slot];
        const filled = letterIndex !== undefined;
        return (
          <div key={slot} className={tile + " border-2 " + slotClass(outcome, filled)}>
            {outcome.gaveUp ? word[slot] : filled ? word[letterIndex] : ""}
          </div>
        );
      })}
    </div>
  );
}

function LetterTiles(props: {
  word: string;
  letters: number[];
  picked: number[];
  locked: boolean;
  columns: string;
  onPick: (letterIndex: number) => void;
}) {
  return (
    <div className={"mx-auto grid w-full gap-2 " + props.columns}>
      {props.letters.map((letterIndex) => {
        const used = props.picked.includes(letterIndex) || props.locked;
        return (
          <button
            key={letterIndex}
            type="button"
            disabled={used}
            onClick={() => props.onPick(letterIndex)}
            className={
              tile +
              " border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 " +
              (used
                ? "border-gray-200 bg-gray-100 text-gray-300"
                : "border-gray-300 bg-white text-gray-900 hover:border-indigo-400 hover:text-indigo-600")
            }
          >
            {props.word[letterIndex]}
          </button>
        );
      })}
    </div>
  );
}

function AnagramStatus(props: { word: string; hint: string; showHint: boolean; outcome: Outcome }) {
  const { outcome, word } = props;
  return (
    <p
      className="min-h-[3rem] max-w-[40ch] text-balance text-center leading-snug"
      aria-live="polite"
    >
      {outcome.gaveUp ? (
        <span className="font-semibold text-gray-700">
          Cuvântul era <span className="text-indigo-600">{word}</span>.
        </span>
      ) : outcome.correct ? (
        <span className="font-semibold text-emerald-700">🎉 Exact! {word}.</span>
      ) : outcome.complete ? (
        <span className="font-semibold text-red-700">
          Încă nu e bine. Șterge o literă și mai încearcă.
        </span>
      ) : props.showHint ? (
        <span className="text-gray-600">{props.hint}</span>
      ) : (
        <span className="text-gray-400">Apasă literele în ordinea potrivită.</span>
      )}
    </p>
  );
}

function AnagramControls(props: {
  canUndo: boolean;
  hint: boolean;
  locked: boolean;
  onUndo: () => void;
  onHintOrReveal: () => void;
  onNext: () => void;
}) {
  const small = " flex-1 basis-28 px-2 text-sm sm:flex-none sm:px-5 sm:text-base";
  return (
    <div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
      <button
        type="button"
        onClick={props.onUndo}
        disabled={!props.canUndo}
        className={btnGhost + small}
      >
        <span aria-hidden="true">⌫</span> Șterge
      </button>
      <button
        type="button"
        onClick={props.onHintOrReveal}
        disabled={props.locked}
        className={btnGhost + small}
      >
        {props.hint ? "Răspunsul" : "💡 Indiciu"}
      </button>
      <button type="button" onClick={props.onNext} className={btnPrimary + small}>
        Următorul
      </button>
    </div>
  );
}

function AnagramBoard(props: {
  word: string;
  hint: string;
  letters: number[];
  picked: number[];
  showHint: boolean;
  outcome: Outcome;
  onPick: (letterIndex: number) => void;
}) {
  const columns = tileGrid(props.word.length);
  const locked = props.outcome.gaveUp || props.outcome.correct;
  return (
    <div
      className={
        board + " mt-3 flex flex-col items-center justify-center gap-6 p-4 sm:gap-8 sm:p-8"
      }
    >
      <WordSlots
        word={props.word}
        picked={props.picked}
        outcome={props.outcome}
        columns={columns}
      />

      <LetterTiles
        word={props.word}
        letters={props.letters}
        picked={props.picked}
        locked={locked}
        columns={columns}
        onPick={props.onPick}
      />

      <AnagramStatus
        word={props.word}
        hint={props.hint}
        showHint={props.showHint}
        outcome={props.outcome}
      />
    </div>
  );
}

export default function AnagramsGame() {
  const deck = useDeck("anagrame", anagrams);
  const [letters, setLetters] = useState<number[]>([]);
  const [picked, setPicked] = useState<number[]>([]);
  const [hint, setHint] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);

  const entry = deck.chosen[0];
  const word = entry?.word ?? "";

  useEffect(() => {
    if (!word) return;
    setLetters(scrambleIndexes(word));
    setPicked([]);
    setHint(false);
    setGaveUp(false);
  }, [word]);

  const complete = picked.length === word.length;
  const correct = complete && picked.map((i) => word[i]).join("") === word;
  const outcome = { gaveUp, correct, complete };

  const undo = useCallback(() => setPicked((now) => now.slice(0, -1)), []);

  if (!deck.ready || !entry) return <GameSkeleton />;

  return (
    <div>
      <DeckHeader
        label="Cuvântul"
        seen={deck.seen}
        total={deck.total}
        round={deck.round}
        onRestart={() => deck.restart()}
      />

      <AnagramBoard
        word={word}
        hint={entry.hint}
        letters={letters}
        picked={picked}
        showHint={hint}
        outcome={outcome}
        onPick={(letterIndex) => setPicked((now) => [...now, letterIndex])}
      />

      <AnagramControls
        canUndo={picked.length > 0 && !gaveUp}
        hint={hint}
        locked={gaveUp || correct}
        onUndo={undo}
        onHintOrReveal={() => (hint ? setGaveUp(true) : setHint(true))}
        onNext={() => deck.next()}
      />
    </div>
  );
}
