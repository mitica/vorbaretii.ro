"use client";

import Mascota from "@/app/components/mascota/mascota";
import { useMascotVoice } from "./context";

const BADGE =
  "absolute -bottom-1 -right-1 flex h-[22px] w-[22px] items-center justify-center rounded-full text-xs shadow-md ";

/**
 * Mascota ca buton, în antetul jocurilor cu voce: apeși, Gaița citește rostirea
 * de pe ecran și „vorbește" cât se aude. Insigna 🔊 apare doar când rostirea
 * curentă are fișier; fără nimic de citit, butonul e dezactivat și fără insignă.
 */
export default function MascotVoice() {
  const voice = useMascotVoice();
  if (!voice) return <Mascota stare="liniste" marime={56} />;
  const active = voice.ready || voice.playing;
  return (
    <button
      type="button"
      aria-label="Gaița îți citește"
      disabled={!active}
      onClick={voice.toggle}
      className="relative shrink-0 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-default"
    >
      <Mascota stare={voice.pose} marime={56} />
      {active ? (
        <span
          aria-hidden="true"
          className={BADGE + (voice.playing ? "bg-pink-600 text-white" : "bg-white")}
        >
          🔊
        </span>
      ) : null}
    </button>
  );
}
