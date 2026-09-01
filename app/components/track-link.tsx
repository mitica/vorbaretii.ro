"use client";

import { trackCta, type CtaEvent } from "@/lib/track";

type Props = {
  href: string;
  /** Ce se notează când cineva apasă. Numele spune și unde era butonul. */
  event: CtaEvent;
  className?: string;
  children: React.ReactNode;
};

/**
 * Legătură către WhatsApp/Messenger care notează apăsarea înainte de a pleca.
 * Deschide în filă nouă — așa evenimentul apucă să plece înainte ca pagina
 * să fie părăsită.
 */
export default function TrackLink({ href, event, className, children }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => trackCta(event)}
    >
      {children}
    </a>
  );
}
