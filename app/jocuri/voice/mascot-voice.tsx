"use client";

import Mascot from "@/app/components/mascot/mascot";
import { useMascotVoice } from "./context";

/**
 * Gaița ca buton de rostit, în colțul din dreapta-sus al spațiului de joc: cât
 * citește, apăsarea o oprește; tăcută, apăsarea o pornește și citește ce e pe
 * ecran. Ce poate face apăsarea se vede pe BURTA ei — săgeata de play cât tace
 * (sau înainte de prima rostire), peteculul obișnuit cât citește. Fără insignă
 * lipită peste ea: mascota însăși e semnul.
 */
/**
 * Locul ei implicit: cocoțată pe colțul din dreapta-sus al tablei — deasupra
 * marginii, ca să nu treacă niciodată peste text. Jocul căruia nu-i vine bine
 * așa (grila de perechi) o așază singur, în flux.
 */
const CORNER = "absolute -top-3 right-1 z-10";

export default function MascotVoice({ className = CORNER }: { className?: string }) {
  const voice = useMascotVoice();
  if (!voice) return null;
  // Fără ce rosti (roata, înainte de prima învârtire), Gaița stă la locul ei cu
  // peticul obișnuit: nu promite o apăsare care n-ar face nimic.
  const silent = !voice.enabled || !voice.spoke;
  return (
    <button
      type="button"
      aria-label={voice.playing ? "Oprește-o pe Gaița" : "Gaița îți citește"}
      aria-pressed={voice.enabled}
      disabled={!voice.canSpeak}
      onClick={voice.toggle}
      className={
        className +
        " touch-manipulation rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      }
    >
      <Mascot pose={voice.pose} size={56} belly={voice.canSpeak && silent ? "play" : "patch"} />
    </button>
  );
}
