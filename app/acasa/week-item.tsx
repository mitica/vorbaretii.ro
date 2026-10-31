"use client";

import { useState } from "react";
import { cardWhite, linkTapButton } from "@/app/components/ui";
import { currentUtterance, type WeekItem } from "./items";
import VoiceButton from "./voice-button";

type RevealProps = { reveal: NonNullable<WeekItem["reveal"]>; shown: boolean; onShow: () => void };

/** Răspunsul sau înțelesul: întâi butonul, apoi textul — pe care îl citește același buton de voce. */
function Reveal({ reveal, shown, onShow }: RevealProps) {
  if (!shown) {
    return (
      <button type="button" onClick={onShow} className={linkTapButton}>
        {reveal.label}
      </button>
    );
  }
  return (
    <p className="motion-safe:animate-pop mt-2 text-pretty text-base font-bold leading-snug text-indigo-600">
      {reveal.text}
    </p>
  );
}

/**
 * Un element al săptămânii = o mică tablă. Rândul de antet: emoji-ul tipului la
 * stânga, butonul de voce la dreapta — unul singur, care citește ce e pe tablă ACUM.
 * Dedesubt, textul pe toată lățimea și, la ghicitoare și la proverb, dezvăluirea.
 * Fără instrucțiuni: copiii știu ce e acolo.
 */
export default function WeekItemRow({
  item,
  voiced,
}: {
  item: WeekItem;
  voiced: readonly string[];
}) {
  const [shown, setShown] = useState(false);
  return (
    <li className={cardWhite + " p-5 sm:p-6"}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-3xl leading-none" aria-hidden="true">
          {item.emoji}
        </span>
        <VoiceButton slug={item.slug} text={currentUtterance(item, shown)} voiced={voiced} />
      </div>
      <p className="mt-2 text-pretty font-serif text-lg italic leading-snug text-gray-900 sm:text-xl">
        {item.prompt}
      </p>
      {item.reveal ? (
        <Reveal reveal={item.reveal} shown={shown} onShow={() => setShown(true)} />
      ) : null}
    </li>
  );
}
