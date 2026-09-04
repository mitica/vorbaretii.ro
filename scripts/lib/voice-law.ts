/**
 * Nucleul legii vocii jocurilor (ADR-020) — pur: primește ce e pe disc și ce
 * ar trebui să fie, întoarce problemele. Citirea discului e separată, ca
 * testul să vadă roșu pe fixturi înainte de orice fișier real.
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { FILE_BUDGET, VOICE_DIR } from "../../app/jocuri/voice/settings";

export type VoiceDir = {
  /** Subdirectoarele (cheile de voce) găsite sub jocul respectiv. */
  keys: string[];
  /** Fișierele din cheia curentă. */
  files: { name: string; bytes: number }[];
};

export type VoiceCheck = {
  slug: string;
  /** Hash-urile rostirilor curente. */
  expected: string[];
  key: string;
  /** Curiozități: missing e tolerată (întrebările vin și pleacă), orfanul nu. */
  subset: boolean;
  /** `null` = jocul n-are dir: vocea e opt-in, trece. */
  dir: VoiceDir | null;
};

function fileName(hash: string): string {
  return `${hash}.mp3`;
}

export function checkVoice(v: VoiceCheck): string[] {
  if (!v.dir) return [];
  const problems: string[] = [];
  const command = `rulează /voce-jocuri ${v.slug}`;
  for (const key of v.dir.keys)
    if (key !== v.key)
      problems.push(`ADR-020 — ${v.slug}: key veche pe disc „${key}” — ${command}`);
  const expected = new Set(v.expected.map(fileName));
  const onDisk = new Set(v.dir.files.map((f) => f.name));
  for (const f of v.dir.files) {
    if (!expected.has(f.name))
      problems.push(
        `ADR-020 — ${v.slug}: fișier orphan „${f.name}” (text șters sau schimbat) — ${command}`
      );
    if (f.bytes > FILE_BUDGET)
      problems.push(`ADR-020 — ${v.slug}: „${f.name}” peste bugetul de ${FILE_BUDGET / 1024}KB`);
  }
  if (!v.subset)
    for (const name of expected)
      if (!onDisk.has(name))
        problems.push(`ADR-020 — ${v.slug}: utterance fără audio „${name}” — ${command}`);
  return problems;
}

/** Ce e pe disc pentru un joc: cheile și fișierele cheii cerute; `null` fără dir. */
export function readVoiceDir(slug: string, key?: string): VoiceDir | null {
  const root = join(process.cwd(), VOICE_DIR, slug);
  if (!existsSync(root)) return null;
  const keys = readdirSync(root).filter((d) => statSync(join(root, d)).isDirectory());
  const current = key ?? keys[0];
  const dir = current ? join(root, current) : null;
  const files =
    dir && existsSync(dir)
      ? readdirSync(dir).map((name) => ({ name, bytes: statSync(join(dir, name)).size }))
      : [];
  return { keys, files };
}
