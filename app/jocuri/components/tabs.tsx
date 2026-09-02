"use client";

/**
 * Taburi pe UN singur rând: când nu încap, lista derulează orizontal în
 * containerul ei — nu împinge pagina (CLAUDE.md regula 4) — cu marginile
 * scoase până la buza ecranului pe telefon. Fără cutie albă în jur: fiecare
 * tab e o pastilă de sine stătătoare.
 */

export type TabItem = { id: string; label: string };

type Props = {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  /** Numele listei, pentru cititoarele de ecran. */
  label: string;
};

export default function Tabs({ items, activeId, onChange, label }: Props) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
    >
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={
              "touch-manipulation inline-flex min-h-[44px] shrink-0 items-center whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 " +
              (active
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-gray-300 bg-white text-gray-600 hover:border-indigo-400 hover:text-gray-900")
            }
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
