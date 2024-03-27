"use client";

import BoringToHappy, {
  ChildGender
} from "@/app/components/images/boring-to-happy";

type Props = {};

export default function ProactivImages({}: Props) {
  const child = (
    typeof window === "undefined"
      ? "boy"
      : new URL(window.location.href).searchParams.get("child") || "boy"
  ) as ChildGender;
  return <BoringToHappy child={child} />;
}
