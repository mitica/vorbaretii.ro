/**
 * Piesele comune ale jocurilor: butoane, rama albă, rândul de progres.
 * Toate jocurile arată la fel pentru că se îmbracă de aici, nu pentru că
 * fiecare își copiază clasele.
 */

/** `touch-manipulation` peste tot unde se apasă: fără zoom la dublu-tap. */
const base =
  "touch-manipulation inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-5 text-base font-semibold transition " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed";

export const btnPrimary =
  base +
  " bg-pink-600 text-white shadow-sm hover:bg-pink-500 focus-visible:outline-pink-600 disabled:opacity-50";

export const btnSecondary =
  base +
  " bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-indigo-600 disabled:opacity-50";

export const btnGhost =
  base +
  " border border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:text-gray-900 focus-visible:outline-indigo-600 disabled:opacity-40";

/** Rama albă în care stă tabla de joc. */
export const board =
  "rounded-2xl border border-gray-200 bg-white/90 shadow-sm backdrop-blur-sm";

type StatusProps = {
  /** Unde am ajuns: „Ghicitoarea 4 din 30". */
  children: React.ReactNode;
  /** Acțiunea din dreapta: „Joc nou", „Runda următoare". */
  action?: React.ReactNode;
};

export function GameStatus({ children, action }: StatusProps) {
  return (
    <div className="flex min-h-[44px] flex-wrap items-center justify-between gap-x-3 gap-y-1">
      <p className="text-sm font-semibold text-gray-500">{children}</p>
      {action}
    </div>
  );
}

/** Buton discret de acțiune, pentru colțul rândului de progres. */
export function StatusAction({
  onClick,
  children
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="-mr-2 inline-flex min-h-[44px] shrink-0 touch-manipulation items-center rounded-lg px-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
    >
      {children}
    </button>
  );
}

/** Bara subțire de progres a jocului: cât s-a văzut din tot conținutul. */
export function DeckBar({ seen, total }: { seen: number; total: number }) {
  const percent = total > 0 ? Math.round((seen / total) * 100) : 0;
  return (
    <div
      className="mt-1 h-1 w-full overflow-hidden rounded-full bg-indigo-100"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={seen}
      aria-label={`${seen} din ${total}`}
    >
      {/* Lățimea se calculează la rulare, deci nu poate fi o clasă. */}
      <div
        className="h-full rounded-full bg-indigo-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

/** Ce se vede cât timp jocul citește din memoria browserului. */
export function GameSkeleton() {
  return (
    <div
      className={board + " flex min-h-[18rem] animate-pulse items-center justify-center"}
      aria-hidden="true"
    >
      <span className="text-3xl opacity-30">⋯</span>
    </div>
  );
}
