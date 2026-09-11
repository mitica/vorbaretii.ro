"use client";

import { useState } from "react";
import AudioPlay from "@/app/components/audio-play";
import Mascot from "@/app/components/mascot/mascot";
import { RITUAL } from "./naming";

/**
 * Rândul „Ascultă cartea de azi”: mascota, o linie de text și player-ul, pe
 * cardul roz-pal al Naratorului. Se randează DOAR când ziua locală are episod în
 * fereastra paginii — ziua fără episod nu arată nimic aici: nici buton mort,
 * nici text de scuză (vezi `episodeWindow`, `app/azi/podcast.ts`).
 *
 * NU folosește vocea jocurilor (`app/jocuri/voice/context.tsx`): acolo vocea e
 * pornită implicit și citește singură la fiecare element nou — pe `/azi` asta ar
 * porni un episod de două minute nechemat, în casa cuiva. Aici sună doar ce a
 * cerut degetul.
 */
export default function EpisodeRow({ src }: { src: string }) {
  const [active, setActive] = useState(false);

  return (
    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-pink-100 bg-pink-50/50 px-4 py-3">
      <Mascot pose={active ? "vorbeste" : "liniste"} size={56} />
      <div className="min-w-0 flex-1 text-sm">
        <p className="text-pretty text-gray-600">
          {RITUAL.name}, <strong className="text-gray-900">cu voce</strong> — cinci minute, fără
          ecran.
        </p>
        <AudioPlay src={src} label="🔊 Ascultă cartea de azi" onPlayback={setActive} />
      </div>
    </div>
  );
}
