import { withIds } from "./ids";

/** Cuvântul de descris FĂRĂ cele trei cuvinte interzise. */
export const tabooWords = withIds(
  [
    { word: "PISICĂ", forbidden: ["miau", "animal", "blană"] },
    { word: "SOARE", forbidden: ["cald", "cer", "galben"] },
    { word: "ÎNGHEȚATĂ", forbidden: ["rece", "dulce", "vară"] },
    { word: "ȘCOALĂ", forbidden: ["elevi", "teme", "carte"] },
    { word: "FOTBAL", forbidden: ["minge", "poartă", "gol"] },
    { word: "IARNĂ", forbidden: ["zăpadă", "frig", "sanie"] },
    { word: "BUNICA", forbidden: ["plăcinte", "bătrână", "mama"] },
    { word: "TELEFON", forbidden: ["suni", "ecran", "jocuri"] },
    { word: "CÂINE", forbidden: ["ham", "latră", "coadă"] },
    { word: "MARE", forbidden: ["apă", "plajă", "valuri"] },
    { word: "TORT", forbidden: ["lumânări", "dulce", "aniversare"] },
    { word: "PLOAIE", forbidden: ["apă", "umbrelă", "nori"] },
    { word: "SOMN", forbidden: ["noapte", "pat", "ochi"] },
    { word: "AVION", forbidden: ["zboară", "aripi", "cer"] },
    { word: "BIBLIOTECĂ", forbidden: ["cărți", "citit", "liniște"] },
    { word: "CIRC", forbidden: ["clovn", "cort", "acrobați"] },
    { word: "MUZICĂ", forbidden: ["cânți", "sunete", "dans"] },
    { word: "FURNICĂ", forbidden: ["mică", "insectă", "harnică"] },
    { word: "LUNĂ", forbidden: ["noapte", "cer", "rotundă"] },
    { word: "PIZZA", forbidden: ["brânză", "felii", "rotundă"] },
  ],
  (item) => item.word
);
