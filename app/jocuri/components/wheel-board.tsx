"use client";

/**
 * Tabla de roată, partajată: Roata cuvintelor și „Întrebări din povești” o
 * folosesc amândouă (a doua folosire = momentul extracției). Aici stau doar
 * desenul și mecanica învârtirii; fiecare joc își ține pachetul lui.
 */

import { useEffect, useRef, useState } from "react";

const COLORS = ["#EC4899", "#0EA5E9", "#EAB308", "#6366F1", "#22C55E", "#F97316"];
const SPIN_MS = 4200;
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

function Wedge(props: { index: number; segment: number; landed: number | null }) {
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

export function WheelSvg(props: {
  keys: readonly string[];
  label: string;
  rotation: number;
  spinMs: number;
  landed: number | null;
}) {
  const count = props.keys.length;
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
        {props.keys.map((key, index) => (
          <Wedge key={key} index={index} segment={segment} landed={props.landed} />
        ))}
      </g>
      <circle cx={CENTER} cy={CENTER} r="26" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="2" />
      <path d={`M ${CENTER - 11} 2 L ${CENTER + 11} 2 L ${CENTER} 30 Z`} fill="#111827" />
    </svg>
  );
}

/**
 * Mecanica învârtirii spre un sector anume: unghiul, aterizarea, atenuarea
 * mișcării. Jocul îi spune DOAR pe ce index să oprească — ce înseamnă indexul
 * rămâne treaba jocului.
 */
export function useSpinTo(count: number) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [landed, setLanded] = useState<number | null>(null);
  const [calm, setCalm] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCalm(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const spinMs = calm ? 0 : SPIN_MS;
  const segment = 360 / Math.max(1, count);

  function spinTo(index: number) {
    if (spinning) return;
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

  function clearLanded() {
    if (!spinning) setLanded(null);
  }

  return { rotation, spinning, landed, spinMs, spinTo, clearLanded };
}
