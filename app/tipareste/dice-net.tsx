import { eyebrowMuted } from "@/app/components/ui";
import type { DiceCube, DiceFace } from "./dice";

/**
 * Desfășurata unui zar (ADR-044 în harness-ul privat): crucea latină cu șase
 * fețe de 25mm și șapte clape de lipit.
 *
 * De ce șapte: cubul are 12 muchii, desfășurata leagă 5 dintre ele prin plieri,
 * deci rămân 7 rosturi de lipit. Cu patru clape zarul pliat se deschide pe
 * patru rosturi — exact ce nu vrem pe masa copilului. Clapele fețelor din
 * aripi intră în celulele goale ale grilei, deci gabaritul rămâne 87×106mm.
 *
 * Solid negru = se taie (perimetrul și clapele). Punctat gri = se pliază — cele
 * cinci muchii dintre fețe, desenate din amândouă părțile. Nicio umplere de
 * fundal: la tipar rămân cerneala și liniile, care ies și cu „background
 * graphics" stins.
 *
 * Milimetrii trăiesc DOAR în varianta `print:`, ca la `cut-grid.tsx`: hârtia
 * are dimensiune fizică, ecranul n-are. Pe ecran aceleași fețe curg într-un
 * rând care se rupe — previzualizarea zarului, cuvintele grupate pe cub.
 */

type Side = "top" | "right" | "bottom" | "left";
/** Marginea unei fețe: se taie (continuu) sau se pliază (punctat). */
type Edge = "cut" | "fold";

type NetFace = {
  /** Locul în cruce, la tipar. */
  place: string;
  edges: Record<Side, Edge>;
  flaps: Side[];
};

const SIDES: Side[] = ["top", "right", "bottom", "left"];

/** Tăiere: 0,4mm continuu negru. */
const CUT: Record<Side, string> = {
  top: "print:border-t-[0.4mm] print:border-t-black",
  right: "print:border-r-[0.4mm] print:border-r-black",
  bottom: "print:border-b-[0.4mm] print:border-b-black",
  left: "print:border-l-[0.4mm] print:border-l-black",
};

/** Pliere: 0,35mm punctat gri. */
const FOLD: Record<Side, string> = {
  top: "print:border-t-[0.35mm] print:border-t-gray-500 print:[border-top-style:dashed]",
  right: "print:border-r-[0.35mm] print:border-r-gray-500 print:[border-right-style:dashed]",
  bottom: "print:border-b-[0.35mm] print:border-b-gray-500 print:[border-bottom-style:dashed]",
  left: "print:border-l-[0.35mm] print:border-l-gray-500 print:[border-left-style:dashed]",
};

/** Clapa: 6mm, lipită pe latura ei, cu a patra latură deschisă spre față. */
const FLAP: Record<Side, string> = {
  top: "print:inset-x-[3mm] print:top-[-6mm] print:h-[6mm] print:border-[0.4mm] print:border-b-0 print:border-black",
  bottom:
    "print:inset-x-[3mm] print:bottom-[-6mm] print:h-[6mm] print:border-[0.4mm] print:border-t-0 print:border-black",
  left: "print:inset-y-[3mm] print:left-[-6mm] print:w-[6mm] print:border-[0.4mm] print:border-r-0 print:border-black",
  right:
    "print:inset-y-[3mm] print:right-[-6mm] print:w-[6mm] print:border-[0.4mm] print:border-l-0 print:border-black",
};

/**
 * Tabelul geometriei, transcris din macheta aprobată — nu se recalculează.
 * Ordinea E ordinea cuvintelor din `dice.ts`: sus · față · jos · fund, apoi
 * aripa stângă și aripa dreaptă.
 */
const FACES: NetFace[] = [
  {
    place: "print:col-start-2 print:row-start-1",
    edges: { top: "cut", right: "cut", bottom: "fold", left: "cut" },
    flaps: ["top"],
  },
  {
    place: "print:col-start-2 print:row-start-2",
    edges: { top: "fold", right: "fold", bottom: "fold", left: "fold" },
    flaps: [],
  },
  {
    place: "print:col-start-2 print:row-start-3",
    edges: { top: "fold", right: "cut", bottom: "fold", left: "cut" },
    flaps: [],
  },
  {
    place: "print:col-start-2 print:row-start-4",
    edges: { top: "fold", right: "cut", bottom: "cut", left: "cut" },
    flaps: [],
  },
  {
    place: "print:col-start-1 print:row-start-2",
    edges: { top: "cut", right: "fold", bottom: "cut", left: "cut" },
    flaps: ["top", "bottom", "left"],
  },
  {
    place: "print:col-start-3 print:row-start-2",
    edges: { top: "cut", right: "cut", bottom: "cut", left: "fold" },
    flaps: ["top", "bottom", "right"],
  },
];

function edgeClasses(edges: Record<Side, Edge>): string {
  return SIDES.map((side) => (edges[side] === "cut" ? CUT[side] : FOLD[side])).join(" ");
}

/** Cele două tabele merg pas cu pas; dacă nu mai merg, foaia se oprește aici. */
function shapeAt(index: number): NetFace {
  const shape = FACES[index];
  if (!shape) {
    throw new Error(`Desfășurata are ${FACES.length} fețe; cubul o cere pe a ${index + 1}-a.`);
  }
  return shape;
}

/**
 * O față: emoji-ul și cuvântul, iar la tipar cele patru margini ale ei și
 * clapele care ies în afară. `data-face` poartă cuvântul, `data-flap` clapa —
 * așa se măsoară desfășurata pe hârtie, altfel geometria n-are martor.
 */
function NetFaceCell({ face, shape }: { face: DiceFace; shape: NetFace }) {
  return (
    <div
      data-face={face.word}
      className={`relative flex flex-col items-center justify-center gap-0.5 text-center print:gap-[1mm] ${shape.place} ${edgeClasses(shape.edges)}`}
    >
      {shape.flaps.map((side) => (
        <span
          key={side}
          data-flap={side}
          className={`hidden print:absolute print:block ${FLAP[side]}`}
        />
      ))}
      <span className="text-2xl leading-none print:text-[17pt]">{face.emoji}</span>
      <span className="text-sm text-gray-700 print:text-[8pt] print:text-black">{face.word}</span>
    </div>
  );
}

export default function DiceNet({ cube }: { cube: DiceCube }) {
  return (
    <div data-net={cube.label}>
      <p className={`${eyebrowMuted} text-xs print:pb-[2mm] print:text-[8pt]`}>{cube.label}</p>
      <div className="mt-2 flex flex-wrap gap-3 print:mt-[6mm] print:grid print:grid-cols-[repeat(3,25mm)] print:grid-rows-[repeat(4,25mm)] print:ml-[6mm] print:gap-0">
        {cube.faces.map((face, index) => (
          <NetFaceCell key={face.word} face={face} shape={shapeAt(index)} />
        ))}
      </div>
    </div>
  );
}
