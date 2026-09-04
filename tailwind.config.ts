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
        /** Mascota (app/components/mascota): respiră. */
        legana: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-3px)" },
        },
        /** Mascota: clipește — pleoapele apar o clipă. */
        clipit: { "0%, 90%, 100%": { opacity: "0" }, "94%": { opacity: "1" } },
        /** Mascota: aripa ridicată flutură (unghiuri absolute în jurul lui 100°, pivot 66,112). */
        flutura: {
          "0%, 100%": { transform: "rotate(92deg)" },
          "50%": { transform: "rotate(114deg)" },
        },
        /** Mascota: ciocul se deschide pe ritmul vorbirii. */
        vorbeste: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "50%": { transform: "rotate(22deg) translateY(3px)" },
        },
        /** Mascota: capul (tot corpul) se leagănă ușor când vorbește. */
        "cap-vorbeste": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-2px)" },
        },
        /** Mascota: saltul de bucurie. */
        sare: {
          "0%, 100%": { transform: "translateY(0)" },
          "45%": { transform: "translateY(-16px)" },
        },
        /** Mascota: aripile ridicate la bucurie — stânga în jurul umărului. */
        "aripi-sus-st": {
          "0%, 100%": { transform: "rotate(94deg)" },
          "45%": { transform: "rotate(116deg)" },
        },
        /** Mascota: aripa dreaptă = oglinda stângii, deci lista de transformări poartă oglinda. */
        "aripi-sus-dr": {
          "0%, 100%": {
            transform:
              "matrix(-1,0,0,1,239.5,0) translate(66px,112px) rotate(94deg) translate(-66px,-112px)",
          },
          "45%": {
            transform:
              "matrix(-1,0,0,1,239.5,0) translate(66px,112px) rotate(116deg) translate(-66px,-112px)",
          },
        },
      },
      animation: {
        rise: "rise 0.55s cubic-bezier(0.2, 0.7, 0.3, 1) both",
        pop: "pop 0.4s cubic-bezier(0.2, 0.9, 0.3, 1.4)",
        shake: "shake 0.4s ease-in-out",
        legana: "legana 3.2s ease-in-out infinite",
        clipit: "clipit 4.6s ease-in-out infinite",
        flutura: "flutura 1.1s ease-in-out infinite",
        vorbeste: "vorbeste 0.26s ease-in-out infinite",
        "cap-vorbeste": "cap-vorbeste 0.52s ease-in-out infinite",
        sare: "sare 0.9s cubic-bezier(0.3, 0.9, 0.4, 1) infinite",
        "aripi-sus-st": "aripi-sus-st 0.9s ease-in-out infinite",
        "aripi-sus-dr": "aripi-sus-dr 0.9s ease-in-out infinite",
      },
    },
  },
  plugins: [],
  darkMode: "class",
};
export default config;
