import { linkNav } from "@/app/components/ui";
import { whatsappUrl } from "@/lib/contact";
import TrackLink from "./track-link";
import VIcon from "./icons/v-icon";
import { btn } from "./ui";

const links = [
  { href: "/#problema", label: "De ce noi", onMobile: false },
  { href: "/#club", label: "Clubul", onMobile: false },
  { href: "/jocuri", label: "Jocuri", onMobile: true },
  // Pe telefon încape un singur link lângă butonul demo: al doilea îl împinge
  // pe rândul de jos (măsurat: antet 113px în loc de 65px la 360-390px).
  // Articole și Tipărește au ieșit din antet; rămân în footer.
  { href: "/acasa", label: "Acasă", onMobile: false },
  { href: "/azi", label: "Azi", onMobile: false },
];

/** Clasa de vizibilitate: mereu sau, linkurile care nu încap pe telefon, de la `sm`. */
function visibility(link: { onMobile: boolean }): string {
  return link.onMobile ? "" : "hidden sm:inline-flex";
}

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/60 bg-white/60 backdrop-blur print:hidden">
      <nav
        className="mx-auto flex min-h-[4rem] max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2 sm:gap-x-4 sm:px-6"
        aria-label="Principal"
      >
        <a href="/" className="-m-1.5 flex min-h-[44px] shrink-0 items-center p-1.5">
          <span className="sr-only">Vorbăreții</span>
          <span className="flex items-end gap-0 text-lg font-semibold sm:text-xl">
            <VIcon className="h-7 w-7 text-pink-700" />
            <span className="tracking-tight text-gray-900">orbăreții.ro</span>
          </span>
        </a>

        <div className="flex shrink-0 gap-x-5 sm:gap-x-7">
          {links.map((link) => (
            <a key={link.href} href={link.href} className={linkNav + " " + visibility(link)}>
              {link.label}
            </a>
          ))}
        </div>

        <TrackLink
          href={whatsappUrl}
          event="demo_header"
          className={btn("primary", "sm") + " shrink-0 whitespace-nowrap"}
        >
          Rezervă demo
        </TrackLink>
      </nav>
    </header>
  );
}
