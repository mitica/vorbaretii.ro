import { messengerUrl, whatsappUrl } from "@/lib/contact";
import TrackLink from "./track-link";
import VIcon from "./icons/v-icon";

const linkClass = "inline-flex min-h-[44px] items-center font-medium hover:text-gray-900";

const links = [
  { href: "/jocuri", label: "Jocuri" },
  { href: "/articole", label: "Articole" },
  { href: "/tipareste", label: "Tipărește" },
  { href: "/azi", label: "Azi" },
];

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 py-10 print:hidden">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
        <p className="leading-relaxed">
          <VIcon className="mr-1.5 inline-block h-4 w-4 -translate-y-px align-middle text-pink-700" />
          <span className="font-semibold text-gray-600">Vorbăreții</span> · club de socializare în
          română pentru copiii din diaspora
        </p>
        <p className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {links.map((link) => (
            <a key={link.href} href={link.href} className={linkClass}>
              {link.label}
            </a>
          ))}
          <TrackLink href={whatsappUrl} event="demo_footer_whatsapp" className={linkClass}>
            WhatsApp
          </TrackLink>
          <TrackLink href={messengerUrl} event="demo_footer_messenger" className={linkClass}>
            Messenger
          </TrackLink>
        </p>
      </div>
    </footer>
  );
}
