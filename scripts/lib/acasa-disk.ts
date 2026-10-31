/**
 * Vocea de pe disc, în forma pe care o cer legea și manivela Vorbăreți Acasă:
 * o întrebare „are rostirea asta fișier?”, cu răspunsul legii butonului
 * (`canSpeakFor`, ADR-050). Citește discul — doar în scripturi.
 *
 * `canSpeakFor` stă în `context.tsx`, care pomenește tipuri DOM (`Audio`,
 * `window`) fără să le ruleze la import; ts-node le verifică totuși, iar
 * tsconfig.base.json nu le are — de-aia referința de mai jos (precedentul:
 * scripts/test-game-audio.ts).
 */
/// <reference lib="dom" />
import { availableUtterances } from "../../app/jocuri/voice/available";
import { canSpeakFor } from "../../app/jocuri/voice/context";
import type { Voiced } from "./acasa-law";

export function diskVoiced(): Voiced {
  const cache = new Map<string, Set<string>>();
  return (slug, text) => {
    const available = cache.get(slug) ?? availableUtterances(slug);
    cache.set(slug, available);
    return canSpeakFor(available, text);
  };
}
