/**
 * Piesele comune ale jocurilor: butoane, rama albă, rândul de progres.
 * Toate jocurile arată la fel pentru că se îmbracă de aici, nu pentru că
 * fiecare își copiază clasele.
 */

import { btn } from "@/app/components/ui";

/** Butoanele vin din limbajul comun al site-ului (app/components/ui.ts). */
export const btnPrimary = btn("primary");
export const btnSecondary = btn("secondary");
export const btnGhost = btn("ghost");

/** Rama albă în care stă tabla de joc. */
export const board = "rounded-2xl border border-gray-200 bg-white/90 shadow-sm backdrop-blur-sm";

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
  children,
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
      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${percent}%` }} />
    </div>
  );
}

/** Cronometrul jocurilor contra timp: cifre mari + bara care scade. */
export function Countdown({ remaining, total }: { remaining: number; total: number }) {
  const urgent = remaining <= 10;
  const clock = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;
  return (
    <div className="w-full max-w-xs">
      <p
        className={
          "text-2xl font-bold tabular-nums " + (urgent ? "text-pink-600" : "text-gray-900")
        }
      >
        {clock}
      </p>
      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-indigo-100">
        {/* Lățimea se calculează la fiecare secundă, deci nu poate fi o clasă. */}
        <div
          className={
            "h-full rounded-full transition-[width] duration-200 " +
            (urgent ? "bg-pink-600" : "bg-indigo-500")
          }
          style={{ width: `${(remaining / total) * 100}%` }}
        />
      </div>
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

/**
 * Perechea „Indiciu / Arată răspunsul” + butonul de mers mai departe —
 * comună jocurilor cu dezvăluire (ghicitori, rebus). `flex-wrap` + `basis`:
 * butoanele stau alături cât încap și trec unul sub altul când nu mai încap.
 */
export function RevealControls(props: {
  revealed: boolean;
  hint: boolean;
  nextLabel: string;
  onHint: () => void;
  onReveal: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-4 grid gap-3">
      {props.revealed ? null : (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={props.onHint}
            disabled={props.hint}
            className={btnGhost + " flex-1 basis-36"}
          >
            💡 Indiciu
          </button>
          <button
            type="button"
            onClick={props.onReveal}
            className={btnSecondary + " flex-1 basis-36"}
          >
            Arată răspunsul
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={props.onNext}
        className={props.revealed ? btnPrimary : btnGhost}
      >
        {props.nextLabel}
      </button>
    </div>
  );
}

/**
 * Antetul comun al jocurilor cu pachet: „<Eticheta> N din M (· runda R)” +
 * bara de progres; restartul apare doar după prima extragere.
 */
/** Antetul jocurilor cu pachet și acțiune proprie („Altă categorie"): status + bară. */
export function DeckStatus(props: {
  label: string;
  deck: { seen: number; total: number; round: number };
  action?: React.ReactNode;
}) {
  return (
    <>
      <GameStatus action={props.action}>
        {props.label} {props.deck.seen} din {props.deck.total}
        {props.deck.round > 1 ? ` · runda ${props.deck.round}` : ""}
      </GameStatus>

      <DeckBar seen={props.deck.seen} total={props.deck.total} />
    </>
  );
}

export function DeckHeader(props: {
  label: string;
  seen: number;
  total: number;
  round: number;
  onRestart?: () => void;
}) {
  return (
    <>
      <GameStatus
        action={
          props.onRestart && props.seen > 1 ? (
            <StatusAction onClick={props.onRestart}>Ia-o de la capăt</StatusAction>
          ) : undefined
        }
      >
        {props.label} {props.seen} din {props.total}
        {props.round > 1 ? ` · runda ${props.round}` : ""}
      </GameStatus>

      <DeckBar seen={props.seen} total={props.total} />
    </>
  );
}
