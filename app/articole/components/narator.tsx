"use client";

import { useState } from "react";
import Mascota from "@/app/components/mascota/mascota";
import ArticleAudio from "./article-audio";

/**
 * Naratorul articolului: mascota + semnătura de brand + player-ul, când
 * integrala există (ADR-014: apare doar cu set complet). Mascota vorbește cât
 * merge audio-ul și tace la pauză; nimic nu pornește singur.
 */
export default function Narator({ src }: { src?: string }) {
  const [activ, setActiv] = useState(false);

  return (
    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-pink-100 bg-pink-50/50 px-4 py-3">
      <Mascota stare={activ ? "vorbeste" : "liniste"} marime={64} />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-600">
          Îți povestește <strong className="text-gray-900">Gaița</strong>.
        </p>
        {src ? <ArticleAudio src={src} onRedare={setActiv} /> : null}
      </div>
    </div>
  );
}
