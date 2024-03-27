"use client";

type Props = {};

export default function ProactivText({}: Props) {
  const i =
    typeof window === "undefined"
      ? 0
      : parseInt(new URL(window.location.href).searchParams.get("i") || "0");
  const w = window.innerWidth;
  const textSize = w > 700 ? "text-4xl" : "text-2xl";

  const items = [
    [
      "Copii Proactivi",
      "Ajutăm copiii să devină proactivi",
      "Curs online de socializare și dezvoltare"
    ]
  ];
  const lines = items[i] || [];
  const lineClassName = [
    `font-semibold ${textSize}`,
    "rounded-md bg-pink-600 px-3.5 py-1.5 text-sm md:text-md font-semibold text-white shadow-sm hover:bg-pink-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600",
    "fond-medium text-gray-600"
  ];
  return lines.map((line, i) => (
    <p key={i} className={lineClassName[i]}>
      {line}
    </p>
  ));
}
