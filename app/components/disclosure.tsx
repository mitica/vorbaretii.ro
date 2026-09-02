"use client";

import { useState } from "react";

/**
 * Caseta pliabilă a site-ului („Mai mult, pentru curioși” la articole; FAQ-ul
 * de mâine). Buton controlat, nu `<details>`: la export static + hidratare,
 * `<details>` închis a lăsat conținutul să curgă peste ce urmează (prins de
 * check-ui) — aici starea e explicită.
 */
export default function Disclosure({
  summary,
  children,
}: {
  summary: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="my-4 rounded-2xl border border-pink-100 bg-gradient-to-br from-white to-pink-50">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((now) => !now)}
        className="flex min-h-[44px] w-full items-center gap-2.5 px-4 py-3 text-left font-semibold text-pink-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600"
      >
        <span
          aria-hidden="true"
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-600 font-bold text-white"
        >
          {open ? "–" : "+"}
        </span>
        {summary}
      </button>
      {open ? <div className="px-4 pb-4 text-gray-600">{children}</div> : null}
    </div>
  );
}
