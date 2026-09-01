import { whatsappUrl } from "@/lib/contact";
import VIcon from "./icons/v-icon";

const links = [
  { href: "/#problema", label: "De ce noi", onMobile: false },
  { href: "/#club", label: "Clubul", onMobile: false },
  { href: "/jocuri", label: "Jocuri", onMobile: true }
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/60 bg-white/60 backdrop-blur">
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5"
        aria-label="Principal"
      >
        <a href="/" className="-m-1.5 shrink-0 p-1.5">
          <span className="sr-only">Vorbăreții</span>
          <span className="flex items-end gap-0 text-xl font-semibold">
            <VIcon className="h-7 w-7 text-pink-700" />
            <span className="tracking-tight text-gray-800">orbăreții.ro</span>
          </span>
        </a>

        <div className="flex gap-x-5 sm:gap-x-7">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={
                "text-sm font-medium leading-6 text-gray-600 transition hover:text-gray-900 " +
                (link.onMobile ? "" : "hidden sm:block")
              }
            >
              {link.label}
            </a>
          ))}
        </div>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-lg bg-pink-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-pink-500"
        >
          Rezervă demo
        </a>
      </nav>
    </header>
  );
}
