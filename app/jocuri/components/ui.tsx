/**
 * Piesele comune ale jocurilor: butoane, rama albă, rândul de progres.
 * Toate jocurile arată la fel pentru că se îmbracă de aici, nu pentru că
 * fiecare își copiază clasele.
 */

const base =
  "tap inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-5 text-base font-semibold transition " +
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
    <div className="flex min-h-[28px] items-center justify-between gap-3">
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
      className="tap shrink-0 rounded-lg px-2 py-1 text-sm font-semibold text-indigo-600 transition hover:text-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
    >
      {children}
    </button>
  );
}

/** Ce se vede cât timp jocul citește din memoria browserului. */
export function GameSkeleton() {
  return (
    <div
      className={board + " flex flex-1 animate-pulse items-center justify-center"}
      aria-hidden="true"
    >
      <span className="text-3xl opacity-30">⋯</span>
    </div>
  );
}
