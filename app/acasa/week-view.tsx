"use client";

import { useState } from "react";
import { copyText, type CopyResult } from "@/app/azi/copy";
import { btn } from "@/app/components/ui";
import { trackCta } from "@/lib/track";
import AcasaHeader from "./acasa-header";
import { weekLink } from "./copy-week";
import type { VoicedWeek } from "./items";
import WeekItemRow from "./week-item";

type CopyState = CopyResult | "idle";

/**
 * După copiere: confirmarea, sau — clipboard refuzat — linkul de ținut apăsat.
 * Regiunea `aria-live` e montată MEREU (goală cât nu s-a apăsat): o regiune
 * născută odată cu mesajul nu e anunțată de toate cititoarele de ecran.
 */
function CopyFallback({ state, text }: { state: CopyState; text: string }) {
  const manual = state === "manual";
  return (
    <div aria-live="polite" className="text-pretty text-sm leading-relaxed text-gray-500">
      {state === "idle" ? null : (
        <p className="mt-3">
          {manual ? "Ține apăsat pe link și copiază-l:" : "Lipește-l pe grup."}
        </p>
      )}
      {manual ? (
        <p className="mt-2 select-all break-all rounded-xl border border-gray-200 bg-gray-50 p-4 text-gray-700">
          {text}
        </p>
      ) : null}
    </div>
  );
}

/** Un singur buton: linkul săptămânii afișate, de lipit în orice conversație. */
function CopyLink({ link }: { link: string }) {
  const [copied, setCopied] = useState<CopyState>("idle");
  return (
    <>
      <div className="mt-6 flex">
        <button
          type="button"
          onClick={async () => {
            trackCta("copiaza_saptamana");
            setCopied(await copyText(link));
          }}
          className={btn("primary", "lg") + " text-left"}
        >
          {copied === "ok" ? "Linkul e copiat" : "Copiază linkul"}
        </button>
      </div>
      <CopyFallback state={copied} text={link} />
    </>
  );
}

/**
 * O săptămână Vorbăreți Acasă: titlul cu data, cele patru elemente cu vocea lor
 * și butonul care îi copiază linkul. Aceeași pentru `/acasa` (săptămâna
 * curentă) și pentru linkul pe dată. Nimic nu se salvează.
 */
export default function WeekView({ week }: { week: VoicedWeek }) {
  return (
    <>
      <AcasaHeader label={week.label} />
      {/* Fiecare element e tabla lui. */}
      <ul className="mt-6 space-y-5">
        {week.items.map((item) => (
          <WeekItemRow key={item.kind} item={item} voiced={week.voiced} />
        ))}
      </ul>
      <CopyLink link={weekLink(week.monday)} />
    </>
  );
}
