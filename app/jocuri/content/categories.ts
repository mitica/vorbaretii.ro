import { withIds } from "./ids";

/** Se afișează cu „Spune” în față, deci toate încep cu „5 ”. */
export const categories = withIds(
  [
    { prompt: "5 animale care trăiesc în apă" },
    { prompt: "5 lucruri care se topesc" },
    { prompt: "5 lucruri roșii" },
    { prompt: "5 cuvinte care încep cu M" },
    { prompt: "5 lucruri din bucătărie" },
    { prompt: "5 animale mai mici decât o pisică" },
    { prompt: "5 lucruri care zboară" },
    { prompt: "5 mâncăruri românești" },
    { prompt: "5 lucruri rotunde" },
    { prompt: "5 meserii" },
    { prompt: "5 lucruri care fac zgomot" },
    { prompt: "5 fructe care nu sunt roșii" },
    { prompt: "5 lucruri dintr-un ghiozdan" },
    { prompt: "5 animale care sar" },
    { prompt: "5 lucruri reci" },
    { prompt: "5 cuvinte care rimează cu «floare»" },
    { prompt: "5 lucruri care luminează" },
    { prompt: "5 jucării" },
    { prompt: "5 lucruri moi" },
    { prompt: "5 orașe sau țări" },
    { prompt: "5 lucruri din baie" },
    { prompt: "5 personaje din povești" },
    { prompt: "5 lucruri dulci" },
    { prompt: "5 sporturi" },
  ],
  (item) => item.prompt
);

/* ------------------------------------------------------------- frământări */
