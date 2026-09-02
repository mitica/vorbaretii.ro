"use client";

import { useEffect, useRef, useState } from "react";
import { wheelDecks, wheelItems } from "../content";
import Tabs from "./tabs";
import { DeckBar, GameSkeleton, board, btnPrimary } from "./ui";
import { useDeck } from "./use-deck";

const COLORS = ["#EC4899", "#0EA5E9", "#EAB308", "#6366F1", "#22C55E", "#F97316"];

const SPIN_MS = 4200;

// Conținutul are mereu cel puțin un set; helperul face tipul onest sub
// noUncheckedIndexedAccess fără aserțiuni.
function mustFirst<T>(list: readonly T[], what: string): T {
  const first = list[0];
  if (first === undefined) throw new Error(`content.ts: ${what} gol`);
  return first;
}
const firstDeck = mustFirst(wheelDecks, "wheelDecks");
const firstItems = mustFirst(wheelItems, "wheelItems");
const CENTER = 160;
const RADIUS = 142;

function wedgePath(startAngle: number, endAngle: number) {
  const toXY = (angle: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return [CENTER + RADIUS * Math.cos(rad), CENTER + RADIUS * Math.sin(rad)] as const;
  };
  const [x1, y1] = toXY(startAngle);
  const [x2, y2] = toXY(endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${CENTER} ${CENTER} L ${x1.toFixed(2)} ${y1.toFixed(
    2
  )} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
}

function Wedge(props: { prompt: string; index: number; segment: number; landed: number | null }) {
  const start = props.index * props.segment;
  const mid = ((start + props.segment / 2 - 90) * Math.PI) / 180;
  const x = CENTER + 108 * Math.cos(mid);
  const y = CENTER + 108 * Math.sin(mid);
  return (
    <g>
      <path
        d={wedgePath(start, start + props.segment)}
        fill={COLORS[props.index % COLORS.length]}
        stroke={props.landed === props.index ? "#111827" : "#FFFFFF"}
        strokeWidth={props.landed === props.index ? 3 : 2}
      />
      <text
        x={x}
        y={y}
        transform={`rotate(${start + props.segment / 2} ${x} ${y})`}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#FFFFFF"
        fontSize="17"
        fontWeight="700"
      >
        {props.index + 1}
      </text>
    </g>
  );
}

function WheelSvg(props: {
  prompts: readonly string[];
  label: string;
  rotation: number;
  spinMs: number;
  landed: number | null;
}) {
  const count = props.prompts.length;
  const segment = 360 / count;
  return (
    <svg
      viewBox="0 0 320 320"
      className="w-full max-w-[280px] sm:max-w-[320px]"
      role="img"
      aria-label={`Roata cu ${count} întrebări din setul ${props.label}`}
    >
      {/* Singurul `style` din jocuri: unghiul se calculează la fiecare
          învârtire, deci nu poate fi o clasă. */}
      <g
        style={{
          transform: `rotate(${props.rotation}deg)`,
          transformOrigin: "50% 50%",
          transition: `transform ${props.spinMs}ms cubic-bezier(0.16, 1, 0.3, 1)`,
        }}
      >
        {props.prompts.map((prompt, index) => (
          <Wedge
            key={prompt}
            prompt={prompt}
            index={index}
            segment={segment}
            landed={props.landed}
          />
        ))}
      </g>
      <circle cx={CENTER} cy={CENTER} r="26" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="2" />
      <path d={`M ${CENTER - 11} 2 L ${CENTER + 11} 2 L ${CENTER} 30 Z`} fill="#111827" />
    </svg>
  );
}

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

/** Starea învârtirii: unghiul, aterizarea, atenuarea mișcării, schimbarea setului. */
function useWheelSpin() {
  const [deckIndex, setDeckIndex] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [landed, setLanded] = useState<number | null>(null);
  const [calm, setCalm] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const deck = wheelDecks[deckIndex] ?? firstDeck;
  const items = wheelItems[deckIndex] ?? firstItems;
  const rotor = useDeck(`roata.${deck.id}`, items, { drawOnMount: false });

  const segment = 360 / deck.prompts.length;
  const spinMs = calm ? 0 : SPIN_MS;

  useEffect(() => {
    setCalm(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function spin() {
    if (spinning) return;
    const [item] = rotor.next();
    if (!item) return;
    const index = items.findIndex((candidate) => candidate.id === item.id);
    if (index < 0) return;

    setSpinning(true);
    setLanded(null);

    const target = (360 - (index * segment + segment / 2) + 360) % 360;
    const current = ((rotation % 360) + 360) % 360;
    const delta = (target - current + 360) % 360;
    setRotation(rotation + 360 * (calm ? 0 : 5) + delta);

    timer.current = setTimeout(() => {
      setLanded(index);
      setSpinning(false);
    }, spinMs);
  }

  function changeDeck(index: number) {
    if (spinning) return;
    setDeckIndex(index);
    setLanded(null);
  }

  return { deck, rotor, spinMs, rotation, spinning, landed, spin, changeDeck };
}

export default function WheelGame() {
  const { deck, rotor, spinMs, rotation, spinning, landed, spin, changeDeck } = useWheelSpin();

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
          prompts={deck.prompts}
          label={deck.label}
          rotation={rotation}
          spinMs={spinMs}
          landed={landed}
        />
      </div>

      <LandedCard
        landed={landed}
        spinning={spinning}
        prompt={landed === null ? undefined : deck.prompts[landed]}
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
          disabled={spinning}
          className={btnPrimary + " w-full sm:w-64 sm:text-lg"}
        >
          {spinning ? "Se învârte…" : "Învârte roata"}
        </button>
      </div>
    </div>
  );
}
