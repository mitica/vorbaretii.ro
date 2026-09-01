import { messengerUrl, whatsappUrl } from "@/lib/contact";
import TrackLink from "./track-link";
import VIcon from "./icons/v-icon";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
        <p className="leading-relaxed">
          <VIcon className="mr-1.5 inline-block h-4 w-4 -translate-y-px align-middle text-pink-700" />
          <span className="font-semibold text-gray-700">Vorbăreții</span> · club
          de socializare în română pentru copiii din diaspora
        </p>
        <p className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <a href="/jocuri" className="font-medium hover:text-gray-800">
            Jocuri
          </a>
          <TrackLink
            href={whatsappUrl}
            event="demo_footer_whatsapp"
            className="font-medium hover:text-gray-800"
          >
            WhatsApp
          </TrackLink>
          <TrackLink
            href={messengerUrl}
            event="demo_footer_messenger"
            className="font-medium hover:text-gray-800"
          >
            Messenger
          </TrackLink>
        </p>
      </div>
    </footer>
  );
}
