"use client";

import { useEffect, useState } from "react";
import type { Game } from "../games";
import { readLastVisit, readProgress, writeLastVisit } from "../progress";
import { numeralDe } from "./format";

/** După o oră, vizita e una nouă — atunci merită un salut. */
const RETURN_AFTER_MS = 60 * 60 * 1000;

/**
 * Un rând cald pentru copilul care revine: dovada că jocul l-a ținut minte.
 * Se calculează după montare (localStorage nu există la export) și apare doar
 * când chiar are ceva de spus — altfel nu ocupă loc.
 */
export default function WelcomeBack({ game }: { game: Game }) {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const previous = readLastVisit();
    writeLastVisit(game.slug);
    if (!previous || Date.now() - previous.at < RETURN_AFTER_MS) return;

    const progress = readProgress(game.slug);
    if (!progress || progress.seen === 0) return;

    const remaining = progress.total - progress.seen;
    if (progress.round > 1) {
      setMessage(
        `👋 Bine ai revenit! Le-ai văzut pe toate — acum e runda ${progress.round}.`
      );
    } else if (remaining >= 2) {
      setMessage(
        `👋 Bine ai revenit! Te așteaptă ${numeralDe(remaining)} ${game.itemsLabel} noi.`
      );
    }
  }, [game.slug, game.itemsLabel]);

  if (message === null) return null;

  return <p className="mt-3 text-sm font-semibold text-pink-600">{message}</p>;
}
