"use client";

import { useEffect, useRef, useState } from "react";
import { wheelDecks, wheelItems } from "../content";
import { GameSkeleton, board, btnPrimary } from "./ui";
import { useDeck } from "./use-deck";

const COLORS = [
  "#EC4899",
  "#0EA5E9",
  "#EAB308",
  "#6366F1",
  "#22C55E",
  "#F97316"
];

const SPIN_MS = 4200;
const CENTER = 160;
const RADIUS = 142;

function wedgePath(startAngle: number, endAngle: number) {
  const toXY = (angle: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return [
      CENTER + RADIUS * Math.cos(rad),
      CENTER + RADIUS * Math.sin(rad)
    ] as const;
  };
  const [x1, y1] = toXY(startAngle);
  const [x2, y2] = toXY(endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${CENTER} ${CENTER} L ${x1.toFixed(2)} ${y1.toFixed(
    2
  )} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
}

export default function WheelGame() {
  const [deckIndex, setDeckIndex] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [landed, setLanded] = useState<number | null>(null);
  const [calm, setCalm] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const deck = wheelDecks[deckIndex];
  const items = wheelItems[deckIndex];
  const rotor = useDeck(`roata.${deck.id}`, items, 1, false);

  const count = deck.prompts.length;
  const segment = 360 / count;
  const spinMs = calm ? 0 : SPIN_MS;

  useEffect(() => {
    setCalm(
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
    );
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

  if (!rotor.ready) return <GameSkeleton />;

  return (
    <div>
      {/* Patru seturi nu mai încap pe un rând pe telefon: grilă 2×2, iar de la
          `sm` un singur rând. Ce nu încape se rupe pe rânduri, nu împinge pagina. */}
      <div
        className="grid grid-cols-2 gap-1 rounded-xl border border-gray-200 bg-white p-1 sm:grid-cols-4"
        role="group"
        aria-label="Setul de întrebări"
      >
        {wheelDecks.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => changeDeck(index)}
            aria-pressed={index === deckIndex}
            className={
              "touch-manipulation min-h-[44px] rounded-lg px-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm " +
              (index === deckIndex
                ? "bg-indigo-600 text-white"
                : "text-gray-600 hover:text-gray-900")
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex justify-center">
        <svg
          viewBox="0 0 320 320"
          className="w-full max-w-[280px] sm:max-w-[320px]"
          role="img"
          aria-label={`Roata cu ${count} întrebări din setul ${deck.label}`}
        >
          {/* Singurul `style` din jocuri: unghiul se calculează la fiecare
              învârtire, deci nu poate fi o clasă. */}
          <g
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: "50% 50%",
              transition: `transform ${spinMs}ms cubic-bezier(0.16, 1, 0.3, 1)`
            }}
          >
            {deck.prompts.map((prompt, index) => {
              const start = index * segment;
              const mid = ((start + segment / 2 - 90) * Math.PI) / 180;
              const x = CENTER + 108 * Math.cos(mid);
              const y = CENTER + 108 * Math.sin(mid);
              return (
                <g key={prompt}>
                  <path
                    d={wedgePath(start, start + segment)}
                    fill={COLORS[index % COLORS.length]}
                    stroke={landed === index ? "#111827" : "#FFFFFF"}
                    strokeWidth={landed === index ? 3 : 2}
                  />
                  <text
                    x={x}
                    y={y}
                    transform={`rotate(${start + segment / 2} ${x} ${y})`}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#FFFFFF"
                    fontSize="17"
                    fontWeight="700"
                  >
                    {index + 1}
                  </text>
                </g>
              );
            })}
          </g>
          <circle
            cx={CENTER}
            cy={CENTER}
            r="26"
            fill="#FFFFFF"
            stroke="#E5E7EB"
            strokeWidth="2"
          />
          <path
            d={`M ${CENTER - 11} 2 L ${CENTER + 11} 2 L ${CENTER} 30 Z`}
            fill="#111827"
          />
        </svg>
      </div>

      <div
        className={board + " mx-auto mt-4 flex min-h-[104px] w-full max-w-xl flex-col justify-center p-4 text-center"}
        aria-live="polite"
      >
        {landed === null ? (
          <p className="text-gray-500">
            {spinning
              ? "Hopa, unde se oprește?"
              : "Apasă butonul și vezi ce întrebare îți iese."}
          </p>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
              Întrebarea {rotor.seen} din {rotor.total}
              {rotor.round > 1 ? ` · runda ${rotor.round}` : ""}
            </p>
            <p className="motion-safe:animate-pop mt-2 text-balance text-lg font-semibold leading-snug text-gray-900 sm:text-xl">
              {deck.prompts[landed]}
            </p>
          </>
        )}
      </div>

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
