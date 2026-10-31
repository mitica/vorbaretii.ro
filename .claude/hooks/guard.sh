#!/usr/bin/env bash
# Hook PreToolUse pe Bash: blochează comenzile distructive. Exit 2 = blocat (stderr ajunge la Claude).
# Apărare în adâncime în spatele listei deny din .claude/settings.json, nu un sandbox — scurt și
# auditabil. Potrivirea se face în node, pe comanda normalizată la spații simple, ca să nu fie
# păcălită de spații în plus, de o țeavă lipită sau de aliasurile scurte ale lui git.
# Portat din harness-ul vechi (guard.sh) la 2026-10-31, fără dependență de motorul au.
set -euo pipefail
input=$(cat)
out=$(printf '%s' "$input" | node -e '
  let d = "";
  process.stdin.on("data", (c) => { d += c; }).on("end", () => {
    let cmd;
    try { cmd = JSON.parse(d).tool_input?.command; } catch { cmd = undefined; }
    if (!cmd) return;
    const c = " " + String(cmd).replace(/[ \t]+/g, " ").trim() + " ";
    const rules = [
      ["force push",
        /\bpush\b/.test(c) &&
        (/\s--force\b/.test(c) || /\s-f\b/.test(c) || /\s\+\S/.test(c))],
      ["hard reset",
        /\breset\b/.test(c) && /\s--hard\b/.test(c)],
      // Aruncarea lucrului necomis: "git checkout ." și "git checkout -- <cale>" pierd schimbările
      // fără undo, aceeași clasă ca reset --hard. "git restore" (orice formă) se blochează
      // necondiționat. Operațiile pe branch ("checkout -b", "checkout main") nu folosesc "--" sau
      // un "." singur, deci rămân permise.
      ["working-tree discard",
        /\bgit\s+restore\b/.test(c) ||
        (/\bcheckout\b/.test(c) &&
          (/\scheckout\s+\.\s/.test(c) || /\s--\s/.test(c)))],
      ["hook bypass",
        /--no-verify\b/.test(c) ||
        (/\bgit\s+(commit|merge|am)\b/.test(c) && /\s-n\b/.test(c))],
      ["recursive rm outside repo",
        /\brm\b/.test(c) &&
        /(-rf|-fr|-r\s.*-f|-f\s.*-r)/.test(c) &&
        /\s(\/|~|\$HOME)\S*/.test(c)],
      // Co-apariție, nu doar un "|" literal: `sh <(curl …)`, `curl -o x; sh x`, `eval "$(curl …)"`
      // ajung la același rezultat (descarcă și execută) fără țeavă. Interpretoarele (python/node
      // one-liners) sunt deliberat în afara scopului.
      ["fetched-code execution",
        /\b(curl|wget)\b/.test(c) &&
        (/(?<![.\w])(ba|z|da)?sh\b/.test(c) || /\beval\b/.test(c) || /\bsource\b/.test(c))],
      // Secretele: .env nu se citește, nu se tipărește, nu se încarcă în shell (AGENTS.md).
      // Verbul și fișierul în ACEEAȘI comandă simplă (fără | ; & sau rând nou între ele), iar
      // .env ca argument de sine stătător — un `.env` pomenit într-un text (heredoc) nu declanșează.
      // Fără apostrof în regex: scriptul stă într-un șir bash cu ghilimele simple.
      ["reading .env",
        /\b(cat|less|more|head|tail|grep|rg|sed|awk|source|bat|open|code|xargs)\b[^|;&\n]*\s\.env(\.[\w-]+)?(?=[\s;&|)"]|$)/.test(c) ||
        /(^|[\s;&|(])\.\s+\.env(\.[\w-]+)?(?=[\s;&|)"]|$)/.test(c)],
    ];
    const hit = rules.find(([, matched]) => matched);
    process.stdout.write(hit ? "BLOCK:" + hit[0] : "ALLOW:" + cmd);
  });
')
if [[ "$out" == BLOCK:* ]]; then
  echo "guard: blocat — ${out#BLOCK:}" >&2
  exit 2
fi
cmd="${out#ALLOW:}"
[ -z "$cmd" ] && exit 0
if [[ "$cmd" == *"commit --amend"* ]]; then
  branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
  default=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's|.*/||' || echo "main")
  [ "$branch" = "${default:-main}" ] && { echo "guard: blocat — amend pe branch-ul implicit" >&2; exit 2; }
fi
exit 0
