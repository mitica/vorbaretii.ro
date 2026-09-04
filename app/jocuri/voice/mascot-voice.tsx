"use client";

import Mascot from "@/app/components/mascot/mascot";
import { useMascotVoice } from "./context";

const BADGE =
  "absolute -bottom-1 -right-1 flex h-[22px] w-[22px] items-center justify-center rounded-full text-xs shadow-md ";

/**
 * Gaița ca buton „taci / vorbește", în antetul jocurilor cu voce: cât citește,
 * apăsarea o oprește și trece vocea pe OFF (🔇); când e tăcută, apăsarea trece
 * vocea pe ON (🔊) și citește imediat elementul de pe ecran.
 */
export default function MascotVoice() {
  const voice = useMascotVoice();
  if (!voice) return <Mascot pose="liniste" size={56} />;
  const label = voice.enabled
    ? "Gaița citește — apasă ca să tacă"
    : "Gaița tace — apasă ca să citească";
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={voice.enabled}
      onClick={voice.toggle}
      className="relative shrink-0 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
    >
      <Mascot pose={voice.pose} size={56} />
      <span
        aria-hidden="true"
        className={BADGE + (voice.playing ? "bg-pink-600 text-white" : "bg-white")}
      >
        {voice.enabled ? "🔊" : "🔇"}
      </span>
    </button>
  );
}
