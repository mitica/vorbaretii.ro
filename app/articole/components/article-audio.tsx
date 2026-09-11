"use client";

import AudioPlay from "@/app/components/audio-play";

type Props = {
  src: string;
  /** Raportează redarea: `true` la Play, `false` la pauză sau la sfârșit. */
  onPlayback?: (activ: boolean) => void;
};

/**
 * Player-ul articolului: integrala, nimic încărcat până la Play (ADR-033).
 * Markup-ul și comportamentul sunt ale lui `AudioPlay`; aici rămâne doar ce e al
 * articolului — eticheta lui.
 */
export default function ArticleAudio({ src, onPlayback }: Props) {
  return <AudioPlay src={src} label="🔊 Ascultă articolul" onPlayback={onPlayback} />;
}
