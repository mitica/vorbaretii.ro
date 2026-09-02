import config from "@/lib/config";
import { DEMO_MESSAGE } from "@/lib/contact";
import TrackLink from "./track-link";
import { btn } from "./ui";
import MessengerIcon from "./icons/messenger-icon";
import WhatsappIcon from "./icons/whatsapp-icon";

const steps = [
  {
    n: "1",
    title: "Ne scrii",
    description:
      "Pe WhatsApp sau Messenger. Ne spui ce vârstă are copilul și în ce țară locuiește.",
  },
  {
    n: "2",
    title: "Alegem ora",
    description: "Seara, pe ora ta locală. Îți trimitem ziua și linkul.",
  },
  {
    n: "3",
    title: "Copilul vine la club",
    description: "O oră, gratuit. Apoi îl plasăm în grupul lui.",
  },
];

function StepsList() {
  return (
    <ol className="mt-10 grid max-w-4xl gap-6 sm:grid-cols-3">
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
  );
}

export default function ContactSection() {
  const text = encodeURIComponent(DEMO_MESSAGE);

  return (
    <section
      id="contact"
      className="scroll-mt-20 bg-gradient-to-b from-white via-white to-pink-100 py-16 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-balance text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Prima lecție e gratuită.
        </h2>

        {/* Pe telefon: bulina în stânga, iar titlul și descrierea pe aceeași
            margine, ca pasul să se citească drept un bloc. Pe ecran lat, cele
            trei coloane rămân stivuite: bulină, titlu, descriere. */}
        <StepsList />

        <div className="mt-10 grid max-w-md grid-cols-2 gap-3">
          <TrackLink
            href={`https://wa.me/${config.phoneNumber.replace(/\D/g, "")}?text=${text}`}
            event="demo_contact_whatsapp"
            className={btn("whatsapp")}
          >
            <WhatsappIcon className="h-5 w-5 shrink-0" />
            <span>WhatsApp</span>
          </TrackLink>
          <TrackLink
            href={`https://m.me/vorbaretii.ro?text=${text}`}
            event="demo_contact_messenger"
            className={btn("messenger")}
          >
            <MessengerIcon className="h-5 w-5 shrink-0" />
            <span>Messenger</span>
          </TrackLink>
        </div>

        <p className="mt-4 max-w-[52ch] text-sm text-gray-500">
          Fără plată acum. Despre abonament vorbim abia după ce copilul a fost la o oră de club.
        </p>
      </div>
    </section>
  );
}
