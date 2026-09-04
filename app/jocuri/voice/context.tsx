"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { Pose } from "@/app/components/mascot/mascot-svg";
import { loadJson, saveJson } from "../components/storage";
import { hashId } from "../content/ids";
import { audioPath } from "./settings";

/**
 * Vocea unui joc: jocul spune ce rostire e pe ecran (`useUtterance`) și ce
 * reacție vizuală merită momentul (`useReactionWhen`, `useCheerOn`). Vocea e
 * PORNITĂ implicit: după prima atingere a paginii (browserele nu lasă sunet
 * fără un gest), Gaița citește singură fiecare element nou. Gaița e butonul
 * „taci / vorbește": cât vorbește, apăsarea o oprește și trece vocea pe OFF;
 * când e tăcută, apăsarea trece vocea pe ON și citește imediat. Setarea stă
 * în memoria locală a jocurilor, ca progresul. Nimic nu se aude la încărcare.
 */

type Reaction = "bucurie" | "gandeste" | null;
type Voice = { say: (text: string | null) => void; react: Dispatch<SetStateAction<Reaction>> };
type MascotState = { pose: Pose; enabled: boolean; playing: boolean; toggle: () => void };

const NOOP: Voice = { say: () => undefined, react: () => undefined };
const VoiceContext = createContext<Voice>(NOOP);
const MascotContext = createContext<MascotState | null>(null);
/** Cheia setării (docs/games.md: `vorbaretii.jocuri.voce`), implicit pornită. */
const SETTING_KEY = "voce";
/** Un WAV mut, de o clipă: deblochează elementul audio la prima atingere. */
const SILENT = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";

/** Reacția „bucurie" ține 1,2 s; „gândește" ține cât o cere jocul. */
function useReaction(): [Reaction, Dispatch<SetStateAction<Reaction>>] {
  const [reaction, setReaction] = useState<Reaction>(null);
  useEffect(() => {
    if (reaction !== "bucurie") return;
    const timer = setTimeout(() => setReaction(null), 1200);
    return () => clearTimeout(timer);
  }, [reaction]);
  return [reaction, setReaction];
}

/** Un singur element audio pe joc, creat și deblocat la prima atingere a paginii. */
function usePlayer() {
  const element = useRef<HTMLAudioElement | null>(null);
  const unlockedRef = useRef(false);
  const generation = useRef(0);
  const [playing, setPlaying] = useState(false);

  const stop = useCallback(() => {
    element.current?.pause();
    setPlaying(false);
  }, []);

  const unlock = useCallback((): HTMLAudioElement => {
    if (element.current) return element.current;
    const audio = new Audio(SILENT);
    audio.onended = () => setPlaying(false);
    audio.onerror = () => setPlaying(false);
    element.current = audio;
    // Gestul deblochează elementul; redarea mută poate fi întreruptă imediat de un
    // `pause()` (AbortError) — nu contează, deblocarea a avut loc.
    audio.play().catch(() => undefined);
    unlockedRef.current = true;
    return audio;
  }, []);

  useEffect(() => {
    window.addEventListener("pointerdown", unlock, { once: true, passive: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, [unlock]);

  const play = useCallback(
    (url: string) => {
      const audio = unlock();
      const id = ++generation.current;
      audio.src = url;
      setPlaying(true);
      // O redare întreruptă de următoarea nu are voie să-i reseteze starea.
      audio.play().catch(() => {
        if (generation.current === id) setPlaying(false);
      });
    },
    [unlock]
  );

  const isUnlocked = useCallback(() => unlockedRef.current, []);
  return { playing, play, stop, isUnlocked };
}

/** Setarea „voce", citită după montare (pe server e implicit pornită). */
function useVoiceSetting(): [boolean, (on: boolean) => void] {
  const [enabled, setEnabled] = useState(true);
  useEffect(() => setEnabled(loadJson(SETTING_KEY, true)), []);
  const update = useCallback((on: boolean) => {
    setEnabled(on);
    saveJson(SETTING_KEY, on);
  }, []);
  return [enabled, update];
}

type GameVoiceProps = { slug: string; available: string[]; children: ReactNode };

export function GameVoice({ slug, available, children }: GameVoiceProps) {
  const [utterance, setUtterance] = useState<string | null>(null);
  const [reaction, setReaction] = useReaction();
  const [enabled, setEnabled] = useVoiceSetting();
  const player = usePlayer();
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const ready = utterance !== null && available.includes(hashId(utterance));
  const url = ready && utterance ? audioPath(slug, utterance) : null;

  // Element nou → tace; dacă vocea e pornită și sunetul deblocat, îl citește singură.
  const { stop, play, isUnlocked } = player;
  useEffect(() => {
    stop();
    if (url && isUnlocked() && enabledRef.current) play(url);
  }, [url, stop, play, isUnlocked]);

  function toggle() {
    if (player.playing) {
      player.stop();
      setEnabled(false);
      return;
    }
    setEnabled(true);
    if (url) player.play(url);
  }

  const voice = useMemo<Voice>(() => ({ say: setUtterance, react: setReaction }), [setReaction]);
  const pose: Pose = player.playing ? "vorbeste" : (reaction ?? "liniste");
  const mascot: MascotState = { pose, enabled, playing: player.playing, toggle };
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
    else if (pose === "gandeste") react((current) => (current === "gandeste" ? null : current));
  }, [active, pose, react]);
}

/** Bucurie la fiecare creștere a unui număr (perechi găsite). */
export function useCheerOn(count: number): void {
  const { react } = useContext(VoiceContext);
  useEffect(() => {
    if (count > 0) react("bucurie");
  }, [count, react]);
}
