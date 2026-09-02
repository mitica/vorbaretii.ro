import config from "./config";

/** Mesaj pre-completat cu care părintele deschide conversația pentru lecția demo. */
export const DEMO_MESSAGE =
  "Bună! Am văzut Vorbăreții.ro și vreau să rezerv o lecție demo gratuită pentru copilul meu.";

export const whatsappUrl = `https://wa.me/${config.phoneNumber.replace(
  /\D/g,
  ""
)}?text=${encodeURIComponent(DEMO_MESSAGE)}`;

export const messengerUrl = `https://m.me/vorbaretii.ro?text=${encodeURIComponent(DEMO_MESSAGE)}`;
