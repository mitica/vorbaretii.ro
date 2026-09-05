"use client";

import { useState } from "react";
import Mascot from "@/app/components/mascot/mascot";
import ArticleAudio from "./article-audio";

/**
 * Naratorul articolului: mascota + semnătura de brand + player-ul, când
 * integrala există (ADR-033: apare doar cu set complet). Mascot vorbește cât
 * merge audio-ul și tace la pauză; nimic nu pornește singur.
 */
export default function Narrator({ src }: { src?: string }) {
  const [active, setActive] = useState(false);

  return (
    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-pink-100 bg-pink-50/50 px-4 py-3">
      <Mascot pose={active ? "vorbeste" : "liniste"} size={64} />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-600">
          Îți povestește <strong className="text-gray-900">Gaița</strong>.
        </p>
        {src ? <ArticleAudio src={src} onPlayback={setActive} /> : null}
      </div>
    </div>
  );
}
