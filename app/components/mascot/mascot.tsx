import { mascotSvg, type Pose } from "./mascot-svg";

const SIZES = { 56: "h-14 w-14", 64: "h-16 w-16" } as const;

type Props = {
  pose: Pose;
  size: keyof typeof SIZES;
};

/**
 * Mascot (harnessul privat: ADR-017): SVG-ul inline din sursa unică
 * `mascotSvg`, decorativ (`aria-hidden`) — sensul îl poartă textul de lângă ea.
 * `data-pose` pe wrapper armează animațiile Tailwind de pe părți
 * (`group-data-[pose=…]`); markup-ul e constantă proprie, generată la build,
 * fără nicio intrare externă — de-aia `dangerouslySetInnerHTML` e sigur aici.
 */
export default function Mascot({ pose, size }: Props) {
  return (
    <span
      aria-hidden="true"
      data-pose={pose}
      className={"group inline-block shrink-0 " + SIZES[size]}
      dangerouslySetInnerHTML={{ __html: mascotSvg(pose) }}
    />
  );
}
