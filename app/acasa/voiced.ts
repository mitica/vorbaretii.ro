/**
 * Vocea săptămânii, citită de pe disc LA BUILD (export static, ADR-050): doar
 * hash-urile rostirilor ei care au fișier, ca în browser să plece câteva șiruri,
 * nu tot discul. SERVER — nu se importă din componente client.
 */
import { hashId } from "../jocuri/content/ids";
import { availableUtterances } from "../jocuri/voice/available";
import { resolveWeek, utterancesOf, type VoicedWeek } from "./items";
import type { Week } from "./registry";

export function voicedWeek(week: Week): VoicedWeek {
  const resolved = resolveWeek(week);
  const voiced = resolved.items.flatMap((item) => {
    const available = availableUtterances(item.slug);
    const texts = utterancesOf({ prompt: item.prompt, reveal: item.reveal?.text });
    return texts.map(hashId).filter((hash) => available.has(hash));
  });
  return { ...resolved, voiced };
}
