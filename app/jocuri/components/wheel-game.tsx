"use client";

import { useEffect, useRef, useState } from "react";
import { wheelDecks } from "../content";

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
const RADIUS = 150;

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
  const [result, setResult] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const deck = wheelDecks[deckIndex];
  const count = deck.prompts.length;
  const segment = 360 / count;

  function spin() {
    if (spinning) return;
    setSpinning(true);
    setResult(null);

    const index = Math.floor(Math.random() * count);
    const target = (360 - (index * segment + segment / 2) + 360) % 360;
    const current = ((rotation % 360) + 360) % 360;
    const delta = (target - current + 360) % 360;

    setRotation(rotation + 360 * 5 + delta);
    timer.current = setTimeout(() => {
      setResult(index);
      setSpinning(false);
    }, SPIN_MS);
  }

  function changeDeck(index: number) {
    if (spinning) return;
    setDeckIndex(index);
    setResult(null);
  }

  return (
    <div>
      <div
        className="inline-flex rounded-xl border border-gray-200 bg-white p-1"
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
              "rounded-lg px-4 py-2 text-sm font-semibold transition " +
              (index === deckIndex
                ? "bg-indigo-600 text-white"
                : "text-gray-600 hover:text-gray-900")
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center">
        <div className="relative w-full max-w-[320px]">
          <div
            className="absolute left-1/2 top-0 z-10 h-0 w-0 -translate-x-1/2 border-x-[12px] border-t-[20px] border-x-transparent border-t-gray-900"
            aria-hidden="true"
          />
          <svg
            viewBox="0 0 320 320"
            className="w-full"
            role="img"
            aria-label={`Roata cu ${count} întrebări`}
          >
            <g
              style={{
                transform: `rotate(${rotation}deg)`,
                transformOrigin: "50% 50%",
                transition: `transform ${SPIN_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`
              }}
            >
              {deck.prompts.map((prompt, index) => {
                const start = index * segment;
                const mid = ((start + segment / 2 - 90) * Math.PI) / 180;
                const x = CENTER + 115 * Math.cos(mid);
                const y = CENTER + 115 * Math.sin(mid);
                return (
                  <g key={prompt}>
                    <path
                      d={wedgePath(start, start + segment)}
                      fill={COLORS[index % COLORS.length]}
                      stroke="#FFFFFF"
                      strokeWidth="2"
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
              r="30"
              fill="#FFFFFF"
              stroke="#E5E7EB"
              strokeWidth="2"
            />
          </svg>
        </div>

        <button
          type="button"
          onClick={spin}
          disabled={spinning}
          className="mt-8 min-h-[52px] rounded-xl bg-pink-600 px-8 py-3 text-base font-semibold text-white transition hover:bg-pink-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {spinning ? "Se învârte…" : "Învârte roata"}
        </button>

        <div
          className="mt-8 w-full max-w-[46ch] rounded-2xl border border-gray-200 bg-white p-7 text-center"
          aria-live="polite"
        >
          {result === null ? (
            <p className="text-gray-500">
              {spinning
                ? "Hopa, unde se oprește?"
                : "Apasă butonul ca să afli întrebarea."}
            </p>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                Întrebarea {result + 1}
              </p>
              <p className="mt-3 text-balance text-xl font-semibold leading-snug text-gray-900">
                {deck.prompts[result]}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
