import classNames from "classnames";
import TrackLink from "./track-link";
import { messengerUrl, whatsappUrl } from "@/lib/contact";
import MessengerIcon from "./icons/messenger-icon";
import WhatsappIcon from "./icons/whatsapp-icon";

type Props = {
  className?: string;
  label?: string;
  /** "row" pune butoanele una lângă alta; "stack" le pune sub. */
  layout?: "row" | "stack";
};

export default function DemoCta({
  className,
  label = "Rezervă lecția demo gratuită",
  layout = "row"
}: Props) {
  return (
    <div
      className={classNames(
        "flex flex-col gap-3",
        layout === "row" && "sm:flex-row sm:items-center sm:gap-4",
        className
      )}
    >
      <TrackLink
        href={whatsappUrl}
        event="demo_hero_whatsapp"
        className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-xl bg-pink-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-pink-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600"
      >
        <WhatsappIcon className="h-5 w-5 shrink-0" />
        <span>{label}</span>
      </TrackLink>
      <TrackLink
        href={messengerUrl}
        event="demo_hero_messenger"
        className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-xl border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-700 transition hover:border-gray-400 hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
      >
        <MessengerIcon className="h-5 w-5 shrink-0" />
        <span>Messenger</span>
      </TrackLink>
    </div>
  );
}
