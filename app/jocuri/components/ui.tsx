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

function GameStatus({ children, action }: StatusProps) {
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
function DeckBar({ seen, total }: { seen: number; total: number }) {
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
    <div className="mt-4 grid gap-3" data-game-action>
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

/** Textul implicit al rândului: „Ghicitoarea 4 din 30 · runda 2". */
function DeckCount(props: { label?: string; seen: number; total: number; round: number }) {
  return (
    <>
      {props.label ? `${props.label} ` : ""}
      {props.seen} din {props.total}
      {props.round > 1 ? ` · runda ${props.round}` : ""}
    </>
  );
}

/** „Ia-o de la capăt" — abia după primele extrageri, când chiar e ce relua. */
function RestartAction(props: { seen: number; after: number; onRestart?: () => void }) {
  const { onRestart } = props;
  if (!onRestart || props.seen <= props.after) return null;
  return <StatusAction onClick={onRestart}>Ia-o de la capăt</StatusAction>;
}

/**
 * Antetul comun al tuturor jocurilor cu pachet: rândul de progres + bara.
 * Textul implicit e „<Eticheta> N din M (· runda R)”; jocurile care numără
 * altceva (perechi găsite, încercări) își scriu rândul ca `children`, iar cele
 * care merg mai departe în loc să reia dau `action` în locul restartului.
 */
export function DeckHeader(props: {
  seen: number;
  total: number;
  /** Eticheta dinaintea numerelor („Ghicitoarea"); lipsește când rândul e `children`. */
  label?: string;
  round?: number;
  /** Ce scrie înainte de prima extragere, la jocurile care nu trag la deschidere
   *  („12 întrebări" e onest; „Întrebarea 0 din 12" nu). */
  emptyLabel?: string;
  /** Rândul scris de joc, când progresul nu e „N din M"; are întâietate. */
  children?: React.ReactNode;
  onRestart?: () => void;
  /** După câte extrageri apare restartul (implicit 1; la zaruri, după primele 3). */
  restartAfter?: number;
  /** Acțiunea proprie din dreapta („Alt cuvânt", „Joc nou"), în locul restartului. */
  action?: React.ReactNode;
}) {
  const empty = props.seen === 0 && props.emptyLabel !== undefined;
  return (
    <>
      <GameStatus
        action={
          props.action ?? (
            <RestartAction
              seen={props.seen}
              after={props.restartAfter ?? 1}
              onRestart={props.onRestart}
            />
          )
        }
      >
        {props.children ??
          (empty ? (
            props.emptyLabel
          ) : (
            <DeckCount
              label={props.label}
              seen={props.seen}
              total={props.total}
              round={props.round ?? 1}
            />
          ))}
      </GameStatus>

      <DeckBar seen={props.seen} total={props.total} />
    </>
  );
}
