/**
 * Rostirile cu fișier pe disc, pentru cheia curentă a unui joc (ADR-043).
 * SERVER/SCRIPT — citește discul; nu se importă din componente client
 * (ADR-006, export static: discul se citește doar la build).
 */
import { readVoiceDir } from "../../../scripts/lib/voice-law";
import { voiceKey } from "./settings";

/** Hash-urile rostirilor care au fișier mp3 pe disc, pentru cheia curentă. */
export function availableUtterances(slug: string): Set<string> {
  const dir = readVoiceDir(slug, voiceKey(slug));
  if (!dir) return new Set();
  return new Set(dir.files.filter((f) => f.name.endsWith(".mp3")).map((f) => f.name.slice(0, -4)));
}
