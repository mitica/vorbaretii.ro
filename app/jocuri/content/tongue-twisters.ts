import { withIds } from "./ids";

/** De spus de trei ori, repede. Fraza sub ~95 de caractere, ca să stea mare pe ecran. */
export const tongueTwisters = withIds(
  [
    { text: "Capra calcă piatra, piatra crapă-n patru." },
    { text: "Un vultur stă pe pisc c-un pix în plisc." },
    { text: "Șase sași în șase saci." },
    { text: "Știu că știu că știuca-i știucă și mai știu că știuca-i pește." },
    { text: "Un cocostârc s-a dus să se descocostârcărească." },
    { text: "Am o prepeliță pestriță cu paisprezece pui de prepeliță pestriți." },
    { text: "Domnule Dudău, dă-mi două dude din dudul dumitale." },
    { text: "Rică nu știa să zică râu, rățușcă, rămurică." },
    { text: "Stanca stă-n castan ca Stan." },
    { text: "Pe cap un capac, pe capac un ac." },
    { text: "Bucură-te cum s-a bucurat Bucuroaia de Bucurel bucuros." },
    { text: "Când am zis c-am zis c-oi zice, tot zic eu c-am zis c-oi zice." },
    { text: "Papagalul Panait poartă pălărie portocalie." },
    { text: "Fluturele flutură ușor prin flori de fluturaș." },
  ],
  (item) => item.text
);

/* ------------------------------------------------------------------ ascuns */
