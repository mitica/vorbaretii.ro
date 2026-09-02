import type { Config } from "tailwindcss";

/**
 * Singurul loc cu CSS scris de mână.
 *
 * Regula proiectului e „doar clase Tailwind" (vezi CLAUDE.md). Animațiile sunt
 * excepția tehnică: `@keyframes` nu poate fi o clasă utilitară. Le declarăm
 * aici și le folosim din markup ca `motion-safe:animate-<nume>`, ca să respecte
 * automat setarea „mai puțină mișcare" a utilizatorului.
 */
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      keyframes: {
        /** Intrarea replicii din hero. */
        rise: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "none" },
        },
        /** Confirmare scurtă: un răspuns corect, o pereche găsită. */
        pop: {
          "0%": { transform: "scale(0.9)" },
          "60%": { transform: "scale(1.04)" },
          "100%": { transform: "scale(1)" },
        },
        /** „Nu e asta." */
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-5px)" },
          "75%": { transform: "translateX(5px)" },
        },
      },
      animation: {
        rise: "rise 0.55s cubic-bezier(0.2, 0.7, 0.3, 1) both",
        pop: "pop 0.4s cubic-bezier(0.2, 0.9, 0.3, 1.4)",
        shake: "shake 0.4s ease-in-out",
      },
    },
  },
  plugins: [],
  darkMode: "class",
};
export default config;
