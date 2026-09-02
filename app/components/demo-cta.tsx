import classNames from "classnames";
import TrackLink from "./track-link";
import { messengerUrl, whatsappUrl } from "@/lib/contact";
import MessengerIcon from "./icons/messenger-icon";
import WhatsappIcon from "./icons/whatsapp-icon";
import { btn } from "./ui";

type Props = {
  className?: string;
  label?: string;
  /** "row" pune butoanele una lângă alta; "stack" le pune sub. */
  layout?: "row" | "stack";
};

export default function DemoCta({
  className,
  label = "Rezervă lecția demo gratuită",
  layout = "row",
}: Props) {
  return (
    <div
      className={classNames(
        "flex flex-col gap-3",
        layout === "row" && "sm:flex-row sm:items-center sm:gap-4",
        className
      )}
    >
      <TrackLink href={whatsappUrl} event="demo_hero_whatsapp" className={btn("primary", "lg")}>
        <WhatsappIcon className="h-5 w-5 shrink-0" />
        <span>{label}</span>
      </TrackLink>
      <TrackLink href={messengerUrl} event="demo_hero_messenger" className={btn("ghost", "lg")}>
        <MessengerIcon className="h-5 w-5 shrink-0" />
        <span>Messenger</span>
      </TrackLink>
    </div>
  );
}
