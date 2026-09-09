"use client";

import { useEffect, useState } from "react";
import { btn, cardWhite, eyebrowMuted, linkTap } from "@/app/components/ui";
import { trackCta } from "@/lib/track";
import { cardText, todayCard, type RitualCard } from "./card";
import { copyText, type CopyResult } from "./copy";
import RitualItemRow from "./ritual-item";

type CopyState = CopyResult | "idle";

/** Emojiurile celor trei elemente, în ordinea cărții — scheletul le arată deja. */
const SKELETON_EMOJIS = ["🔮", "🎡", "👅"];

/**
 * Ce se vede până se știe ce zi e. `animate-pulse` NU e decor: `yarn check-ui`
 * așteaptă dispariția lui ca singură barieră de hidratare — fără el ar măsura
 * cartea goală și ar da verde degeaba.
 */
function CardSkeleton() {
  return (
    <section className={cardWhite + " mt-5 animate-pulse p-5 sm:p-6"} aria-hidden="true">
      <div className="min-h-[0.75rem] w-40 rounded bg-gray-100" />
      <ul className="mt-3">
        {SKELETON_EMOJIS.map((emoji, i) => (
          <li
            key={emoji}
            className="flex gap-3 border-t border-gray-100 py-4 first:border-t-0 first:pt-3"
          >
            <span className="text-2xl leading-tight opacity-30">{emoji}</span>
            <div className="min-w-0 flex-1 space-y-2">
              {/* Două rânduri de text pe telefon, unul pe ecran lat — atât ocupă
                  întrebarea în realitate, deci atât se ține de-o parte. */}
              <div className="min-h-[1.5rem] rounded bg-gray-100" />
              <div className="min-h-[1.5rem] w-5/6 rounded bg-gray-100 sm:hidden" />
              <div className="min-h-[1.25rem] w-2/3 rounded bg-gray-100" />
              {i === 0 ? <div className="min-h-[2.75rem] w-36 rounded bg-gray-50" /> : null}
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-5 min-h-[52px] w-52 rounded-xl bg-gray-100" />
    </section>
  );
}

/** Ce se spune după apăsare: confirmarea, sau drumul de rezervă cu textul de ținut apăsat. */
function CopyNote({ state, text }: { state: CopyState; text: string }) {
  if (state === "idle") return null;
  return (
    <div aria-live="polite">
      <p className="mt-3 text-pretty text-sm leading-relaxed text-gray-500">
        {state === "ok" ? "Lipește-o în grupul familiei." : "Ține apăsat pe text și copiază-l:"}
      </p>
      {state === "manual" ? (
        <p className="mt-2 select-all whitespace-pre-wrap rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">
          {text}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Cartea zilei, cu butonul care o dă mai departe. Ziua se află abia după
 * montare: la export static nu există „azi", deci HTML-ul livrat poartă
 * scheletul, iar `useEffect` pune cartea. Nimic nu se scrie nicăieri —
 * fără cont, fără serii, fără vină (N4).
 */
export default function DailyCard() {
  const [card, setCard] = useState<RitualCard | null>(null);
  const [copied, setCopied] = useState<CopyState>("idle");

  useEffect(() => {
    setCard(todayCard(new Date()));
  }, []);

  if (!card) return <CardSkeleton />;

  const text = cardText(card);

  return (
    <section className={cardWhite + " mt-5 p-5 sm:p-6"}>
      <p className={eyebrowMuted + " text-xs"}>{card.date}</p>
      <ul className="mt-3">
        {card.items.map((item) => (
          <RitualItemRow key={item.kind} item={item} />
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={async () => {
            trackCta("copiaza_cartea");
            setCopied(await copyText(text));
          }}
          className={btn("primary", "lg")}
        >
          {copied === "ok" ? "✓ Copiat" : "📋 Copiază cartea"}
        </button>
        <a href="/jocuri" className={linkTap + " text-sm"}>
          Toate jocurile &rarr;
        </a>
      </div>
      <CopyNote state={copied} text={text} />
    </section>
  );
}
