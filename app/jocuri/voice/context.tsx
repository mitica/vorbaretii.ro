"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Pose } from "@/app/components/mascot/mascot-svg";
import { hashId } from "../content/ids";
import { audioPath } from "./settings";

/**
 * Vocea unui joc: jocul spune ce rostire e pe ecran (`useUtterance`) și ce
 * reacție vizuală merită momentul (`useReactionWhen`, `useCheerOn`); mascota
 * din antet citește rostirea DOAR la apăsare. Nimic nu pornește singur, nimic
 * nu se încarcă înainte de apăsare — `Audio` se creează în handler.
 */

type Reaction = "bucurie" | "gandeste" | null;
type Voice = { say: (text: string | null) => void; react: (reaction: Reaction) => void };
type MascotState = { pose: Pose; ready: boolean; playing: boolean; toggle: () => void };

const NOOP: Voice = { say: () => undefined, react: () => undefined };
const VoiceContext = createContext<Voice>(NOOP);
const MascotContext = createContext<MascotState | null>(null);

/** Reacția „bucurie" ține 1,2 s; „gândește" ține cât o cere jocul. */
function useReaction(): [Reaction, (reaction: Reaction) => void] {
  const [reaction, setReaction] = useState<Reaction>(null);
  useEffect(() => {
    if (reaction !== "bucurie") return;
    const timer = setTimeout(() => setReaction(null), 1200);
    return () => clearTimeout(timer);
  }, [reaction]);
  return [reaction, setReaction];
}

/** Un singur audio odată; se oprește când rostirea se schimbă sau la a doua apăsare. */
function usePlayback(slug: string, utterance: string | null) {
  const [playing, setPlaying] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const stop = useCallback(() => {
    audio.current?.pause();
    audio.current = null;
    setPlaying(false);
  }, []);
  useEffect(() => stop, [utterance, stop]);

  function startPlayback() {
    if (playing) {
      stop();
      return;
    }
    if (!utterance) return;
    const element = new Audio(audioPath(slug, utterance));
    audio.current = element;
    element.onended = stop;
    element.onerror = stop;
    setPlaying(true);
    element.play().catch(stop);
  }
  return { playing, startPlayback };
}

type GameVoiceProps = { slug: string; available: string[]; children: ReactNode };

export function GameVoice({ slug, available, children }: GameVoiceProps) {
  const [utterance, setUtterance] = useState<string | null>(null);
  const [reaction, setReaction] = useReaction();
  const { playing, startPlayback } = usePlayback(slug, utterance);
  const ready = utterance !== null && available.includes(hashId(utterance));
  const voice = useMemo<Voice>(() => ({ say: setUtterance, react: setReaction }), [setReaction]);
  const pose: Pose = playing ? "vorbeste" : (reaction ?? "liniste");
  const mascot: MascotState = { pose, ready, playing, toggle: startPlayback };
  return (
    <VoiceContext.Provider value={voice}>
      <MascotContext.Provider value={mascot}>{children}</MascotContext.Provider>
    </VoiceContext.Provider>
  );
}

export function useMascotVoice(): MascotState | null {
  return useContext(MascotContext);
}

/** Jocul raportează rostirea de pe ecran (sau `null` când nu e nimic de citit). */
export function useUtterance(text: string | null): void {
  const { say } = useContext(VoiceContext);
  useEffect(() => {
    say(text);
    return () => say(null);
  }, [text, say]);
}

/** Reacție vizuală cât `active` e adevărat (bucuria se stinge singură). */
export function useReactionWhen(active: boolean, pose: "bucurie" | "gandeste"): void {
  const { react } = useContext(VoiceContext);
  useEffect(() => {
    if (active) react(pose);
    else if (pose === "gandeste") react(null);
  }, [active, pose, react]);
}

/** Bucurie la fiecare creștere a unui număr (perechi găsite). */
export function useCheerOn(count: number): void {
  const { react } = useContext(VoiceContext);
  useEffect(() => {
    if (count > 0) react("bucurie");
  }, [count, react]);
}
