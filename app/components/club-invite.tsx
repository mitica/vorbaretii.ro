import TrackLink from "./track-link";
import { btn, cardBand } from "./ui";
import { whatsappUrl } from "@/lib/contact";
import type { CtaEvent } from "@/lib/track";

/**
 * Invitația la club — aceeași bandă pe paginile de jocuri și de articole
 * (singurul element de conversie de acolo, D16). Titlul și textul le dă
 * pagina; butonul și ținuta sunt mereu aceleași.
 */
export default function ClubInvite(props: { title: string; body: string; event: CtaEvent }) {
  return (
    <div className={cardBand + " p-6 sm:p-7"}>
      <h2 className="text-lg font-bold text-gray-900">{props.title}</h2>
      <p className="mt-2 max-w-[52ch] text-pretty text-gray-600">{props.body}</p>
      <TrackLink
        href={whatsappUrl}
        event={props.event}
        className={btn("primary") + " mt-5 w-full text-center sm:w-auto"}
      >
        Rezervă lecția demo gratuită
      </TrackLink>
    </div>
  );
}
