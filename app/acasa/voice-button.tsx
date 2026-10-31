"use client";

import { useEffect, useRef, useState } from "react";
import StopIcon from "@/app/components/icons/stop-icon";
import VolumeIcon from "@/app/components/icons/volume-icon";
import { iconBtn } from "@/app/components/ui";
import { hashId } from "@/app/jocuri/content/ids";
import { audioPath } from "@/app/jocuri/voice/settings";

/** Începutul textului, în numele accesibil: fiecare buton de voce citește altceva. */
function opening(text: string): string {
  const words = text.split(/\s+/);
  return words.length > 5 ? `${words.slice(0, 5).join(" ")}…` : text;
}

/** Sunetul care se aude acum, oriunde pe pagină: unul singur odată. */
let current: HTMLAudioElement | null = null;

/** Redarea textului curent: pornire, oprire; text nou (dezvăluirea) = tăcere și sunet nou. */
function usePlayback(src: string): [boolean, () => void] {
  const [playing, setPlaying] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  useEffect(
    () => () => {
      audio.current?.pause();
      audio.current = null;
    },
    [src]
  );

  function toggle() {
    const sound = audio.current ?? new Audio(src);
    audio.current = sound;
    if (playing) {
      sound.pause();
      return;
    }
    if (current && current !== sound) current.pause();
    current = sound;
    sound.onpause = () => setPlaying(false);
    sound.onended = () => setPlaying(false);
    sound.currentTime = 0;
    setPlaying(true);
    sound.play().catch(() => setPlaying(false));
  }
  return [playing, toggle];
}

type Props = {
  slug: string;
  /** Ce e pe tablă acum: textul, sau — după dezvăluire — răspunsul / înțelesul. */
  text: string;
  /** Hash-urile rostirilor săptămânii care au fișier pe disc (citite la build). */
  voiced: readonly string[];
};

/**
 * Butonul de voce al tablei, în antetul ei: difuzorul cât tace, „stop” cât
 * citește. Pornește DOAR la apăsare (apăsarea e consimțământul) — fără contextul
 * jocurilor și fără setarea lor de auto-citire, fără nimic scris nicăieri;
 * `Audio` se naște la prima apăsare. Rostirea fără fișier (ADR-050): butonul
 * rămâne la locul lui, estompat și dezactivat.
 */
export default function VoiceButton({ slug, text, voiced }: Props) {
  const [playing, toggle] = usePlayback(audioPath(slug, text));
  // Aceeași lege ca `canSpeakFor` (ADR-050) — hash-ul textului are fișier —, dar
  // fără să tragă în pachet tot modulul de voce al jocurilor.
  const canSpeak = voiced.includes(hashId(text));
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!canSpeak}
      aria-label={playing ? "Oprește vocea" : `Citește cu voce: ${opening(text)}`}
      className={iconBtn}
    >
      {playing ? <StopIcon className="h-6 w-6" /> : <VolumeIcon className="h-6 w-6" />}
    </button>
  );
}
