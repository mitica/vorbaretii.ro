import config from "@/lib/config";
import { DEMO_MESSAGE } from "@/lib/contact";
import TrackLink from "./track-link";
import MessengerIcon from "./icons/messenger-icon";
import WhatsappIcon from "./icons/whatsapp-icon";

const steps = [
  {
    n: "1",
    title: "Ne scrii",
    description: "Pe WhatsApp sau Messenger. Ne spui ce vârstă are copilul și în ce țară locuiește."
  },
  {
    n: "2",
    title: "Alegem ora",
    description: "Seara, pe ora ta locală. Îți trimitem ziua și linkul."
  },
  {
    n: "3",
    title: "Copilul vine la club",
    description: "O oră, gratuit. Apoi îl plasăm în grupul lui."
  }
];

export default function ContactSection() {
  const text = encodeURIComponent(DEMO_MESSAGE);

  return (
    <section
      id="contact"
      className="scroll-mt-20 bg-gradient-to-b from-white via-white to-pink-100 py-16 sm:py-24"
    >
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-balance text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Prima lecție e gratuită.
        </h2>

        {/* Pe telefon: bulina în stânga, iar titlul și descrierea pe aceeași
            margine, ca pasul să se citească drept un bloc. Pe ecran lat, cele
            trei coloane rămân stivuite: bulină, titlu, descriere. */}
        <ol className="mt-10 grid gap-6 text-left sm:grid-cols-3">
          {steps.map((step) => (
            <li key={step.n} className="flex gap-3 sm:block">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white sm:mb-3">
                {step.n}
              </span>
              <div>
                <h3 className="font-semibold leading-8 text-gray-900 sm:leading-normal">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 grid grid-cols-2 gap-x-4 text-center lg:gap-x-10">
          <TrackLink
            href={`https://wa.me/${config.phoneNumber.replace(
              /\D/g,
              ""
            )}?text=${text}`}
            event="demo_contact_whatsapp"
            className="flex min-h-[48px] items-center justify-center rounded-xl bg-green-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
          >
            <WhatsappIcon className="h-5 w-5" />
            <span className="ml-2">WhatsApp</span>
          </TrackLink>
          <TrackLink
            href={`https://m.me/vorbaretii.ro?text=${text}`}
            event="demo_contact_messenger"
            className="flex min-h-[48px] items-center justify-center rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <MessengerIcon className="h-5 w-5" />
            <span className="ml-2">Messenger</span>
          </TrackLink>
        </div>

        <p className="mt-5 text-sm text-gray-500">
          Fără plată acum. Despre abonament vorbim abia după ce copilul a fost
          la o oră de club.
        </p>
      </div>
    </section>
  );
}
