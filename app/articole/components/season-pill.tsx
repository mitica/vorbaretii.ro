"use client";

import { useEffect, useState } from "react";
import { pillSeason } from "@/app/components/ui";
import { inSeason, type Period } from "../season";

/**
 * Pastila „de sezon”: apare doar când data TELEFONULUI cade în perioada
 * articolului — decisă după hidratare (la SSR nu randează nimic; clipa fără
 * pastilă e acceptată). Fără perioadă, niciodată nimic — nu există „nu e sezonul”.
 */
export default function SeasonPill({ months, days }: Period) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(inSeason({ months, days }, new Date()));
  }, [months, days]);
  return on ? <span className={pillSeason}>de sezon</span> : null;
}
