/**
 * Sursa unică a mascotei (harnessul privat: ADR-017). Geometria = constante;
 * `mascotSvg(pose, phase)` randează o ipostază ca SVG DOAR cu atribute de
 * prezentare — canvas-ul video (resvg) ignoră CSS-ul, `href` simplu pe <use>
 * și `opacity` pe <use>, de-aia aripa (un desen în <defs>) e refolosită prin
 * <g class="aripa-…"><use xlink:href/></g>. Pe site, aceleași clase poartă
 * animațiile Tailwind (`motion-safe:group-data-[pose=…]:animate-…`); `phase`
 * (0..1) mișcă atributele pentru consumatorii fără CSS.
 */

export const POSES = ["liniste", "salut", "vorbeste", "bucurie", "gandeste"] as const;
export type Pose = (typeof POSES)[number];

const COLORS = {
  body: "#3E4394",
  wing: "#353A85",
  patch: "#3E93E9",
  black: "#15181D",
  pupil: "#121315",
  belly: "#81C5F4",
  crest: "#FF66A6",
  beak: "#FFC526",
  beakBottom: "#FEAB2B",
  mouth: "#E0405A",
  foot: "#FEBB24",
  footEdge: "#E9A11F",
  white: "#FFFFFF",
} as const;

/** Umărul aripii — pivotul rotației ipostazelor ridicate; oglinda față de axa 119,75. */
const SHOULDER = "66 112";
const MIRROR = "matrix(-1 0 0 1 239.5 0)";
const ANGLE_UP = 103;

const WING = "M64 112 C 46 117, 31 140, 35 160 C 37 171, 43 177, 49 174 C 59 168, 68 142, 64 112 Z";
const PATCH =
  "M40 141 C 34 151, 35 165, 44 174 C 50 171, 56 161, 58 149 C 54 142, 47 138, 40 141 Z";
const BODY =
  "M 119.8 48.4 C 113.9 48.4, 106.5 49.2, 102.1 50.0 C 97.8 50.8, 96.1 51.8, 93.5 53.0 C 91.0 54.2, 88.9 55.5, 86.8 57.0 C 84.8 58.5, 82.9 60.2, 81.2 62.0 C 79.4 63.8, 77.8 65.8, 76.2 68.0 C 74.7 70.2, 73.3 72.5, 72.0 75.0 C 70.7 77.5, 69.5 80.2, 68.4 83.0 C 67.3 85.8, 66.4 88.8, 65.5 92.0 C 64.6 95.2, 63.9 98.5, 63.2 102.0 C 62.6 105.5, 62.1 109.2, 61.7 113.0 C 61.2 116.8, 60.9 121.3, 60.7 125.0 C 60.5 128.7, 60.5 131.7, 60.4 135.0 C 60.3 138.3, 60.2 141.7, 60.4 145.0 C 60.5 148.3, 60.8 151.8, 61.5 155.0 C 62.2 158.2, 63.3 161.2, 64.6 164.0 C 65.8 166.8, 67.4 169.5, 69.2 172.0 C 71.0 174.5, 73.0 176.8, 75.2 179.0 C 77.4 181.2, 79.8 183.2, 82.4 185.0 C 85.1 186.8, 88.1 188.6, 91.0 190.0 C 94.0 191.4, 95.3 192.4, 100.1 193.5 C 104.9 194.6, 113.2 196.4, 119.8 196.4 C 126.3 196.4, 134.6 194.6, 139.4 193.5 C 144.2 192.4, 145.5 191.4, 148.5 190.0 C 151.4 188.6, 154.4 186.8, 157.1 185.0 C 159.7 183.2, 162.1 181.2, 164.3 179.0 C 166.5 176.8, 168.5 174.5, 170.3 172.0 C 172.1 169.5, 173.7 166.8, 174.9 164.0 C 176.2 161.2, 177.3 158.2, 178.0 155.0 C 178.7 151.8, 179.0 148.3, 179.2 145.0 C 179.3 141.7, 179.2 138.3, 179.1 135.0 C 179.0 131.7, 179.0 128.7, 178.8 125.0 C 178.6 121.3, 178.3 116.8, 177.8 113.0 C 177.4 109.2, 176.9 105.5, 176.3 102.0 C 175.6 98.5, 174.9 95.2, 174.0 92.0 C 173.1 88.8, 172.2 85.8, 171.1 83.0 C 170.0 80.2, 168.8 77.5, 167.5 75.0 C 166.2 72.5, 164.8 70.2, 163.3 68.0 C 161.7 65.8, 160.1 63.8, 158.3 62.0 C 156.6 60.2, 154.7 58.5, 152.7 57.0 C 150.6 55.5, 148.5 54.2, 146.0 53.0 C 143.4 51.8, 141.7 50.8, 137.4 50.0 C 133.0 49.2, 125.6 48.4, 119.8 48.4 Z";
const CREST =
  "M 116.7 62.5 C 115.3 62.2, 114.7 61.1, 113.9 60.5 C 113.1 59.9, 112.5 59.6, 111.8 59.1 C 111.1 58.6, 110.6 58.4, 109.7 57.7 C 108.8 57.0, 107.4 55.8, 106.4 54.8 C 105.4 53.8, 104.4 52.9, 103.6 52.0 C 102.8 51.1, 102.1 50.1, 101.5 49.2 C 100.9 48.3, 100.3 47.3, 99.8 46.4 C 99.3 45.5, 99.0 44.7, 98.7 43.6 C 98.4 42.5, 98.1 41.2, 98.0 40.0 C 97.9 38.8, 98.1 37.6, 98.2 36.6 C 98.3 35.6, 98.4 34.8, 98.7 33.8 C 99.0 32.8, 99.6 31.6, 100.1 30.9 C 100.6 30.1, 100.9 29.7, 101.6 29.3 C 102.2 28.9, 103.2 28.6, 104.0 28.6 C 104.8 28.6, 105.7 28.9, 106.4 29.5 C 107.1 30.1, 107.6 31.3, 108.0 32.3 C 108.4 33.2, 108.6 34.4, 108.8 35.2 C 109.0 36.0, 109.1 37.3, 109.4 37.2 C 109.7 37.1, 110.2 35.5, 110.4 34.5 C 110.6 33.5, 110.6 32.3, 110.8 31.5 C 111.0 30.7, 111.4 30.3, 111.8 29.5 C 112.2 28.7, 112.5 27.6, 113.0 26.7 C 113.5 25.8, 114.2 24.6, 114.8 23.9 C 115.3 23.2, 115.8 23.0, 116.3 22.5 C 116.8 22.0, 117.2 21.6, 117.7 21.1 C 118.2 20.6, 118.8 20.2, 119.5 19.7 C 120.2 19.2, 120.7 18.8, 121.6 18.3 C 122.5 17.8, 123.6 17.2, 124.9 16.9 C 126.2 16.5, 127.7 16.2, 129.2 16.2 C 130.6 16.2, 132.5 16.5, 133.6 16.9 C 134.7 17.2, 135.1 17.8, 135.7 18.3 C 136.2 18.9, 136.6 19.5, 136.9 20.2 C 137.2 20.9, 137.3 21.8, 137.3 22.5 C 137.3 23.2, 137.2 23.8, 137.0 24.5 C 136.8 25.2, 136.5 26.1, 136.2 26.7 C 135.9 27.3, 135.7 27.4, 135.2 28.1 C 134.7 28.8, 133.9 30.2, 133.4 30.9 C 132.9 31.6, 132.6 31.8, 132.2 32.3 C 131.8 32.8, 131.3 33.4, 131.0 34.0 C 130.7 34.6, 130.4 36.1, 130.6 36.2 C 130.8 36.3, 131.4 35.2, 132.0 34.8 C 132.6 34.4, 133.4 34.2, 134.3 33.8 C 135.2 33.4, 136.3 32.9, 137.5 32.6 C 138.7 32.3, 140.2 32.0, 141.5 32.0 C 142.8 32.0, 144.3 32.3, 145.5 32.6 C 146.7 32.9, 147.6 33.4, 148.4 33.8 C 149.2 34.2, 149.9 34.7, 150.5 35.2 C 151.1 35.7, 151.5 36.1, 151.9 36.6 C 152.3 37.1, 152.7 37.8, 152.9 38.5 C 153.1 39.2, 153.3 40.0, 153.3 40.8 C 153.3 41.5, 153.2 42.4, 152.9 43.0 C 152.6 43.6, 152.3 44.1, 151.5 44.6 C 150.7 45.1, 149.1 45.6, 148.0 45.9 C 146.9 46.2, 146.5 46.1, 145.1 46.4 C 143.7 46.7, 141.1 47.3, 139.7 47.8 C 138.2 48.3, 137.3 48.7, 136.4 49.2 C 135.5 49.7, 135.0 50.1, 134.3 50.6 C 133.6 51.1, 133.0 51.5, 132.4 52.0 C 131.8 52.5, 131.3 52.9, 130.8 53.4 C 130.3 53.9, 129.9 54.3, 129.4 54.8 C 128.9 55.3, 128.4 55.8, 128.0 56.3 C 127.6 56.8, 127.2 57.2, 126.8 57.7 C 126.4 58.2, 126.0 58.6, 125.6 59.1 C 125.2 59.6, 124.8 59.9, 124.2 60.5 C 123.6 61.1, 123.3 62.2, 122.1 62.5 C 120.8 62.8, 118.1 62.8, 116.7 62.5 Z";
const FOOT_LEFT =
  "M 94.0 203.6 C 91.3 203.7, 89.1 203.7, 87.4 204.0 C 85.7 204.3, 84.9 204.8, 84.0 205.3 C 83.1 205.8, 82.5 206.3, 82.0 207.0 C 81.5 207.7, 81.0 208.6, 80.7 209.4 C 80.4 210.2, 80.4 211.0, 80.4 211.8 C 80.5 212.6, 80.6 213.5, 81.0 214.2 C 81.4 214.9, 82.0 215.4, 82.6 215.8 C 83.2 216.2, 83.9 216.6, 84.6 216.6 C 85.3 216.6, 86.2 215.6, 86.8 215.6 C 87.4 215.6, 87.7 216.0, 88.2 216.4 C 88.7 216.8, 89.0 217.5, 89.6 218.0 C 90.2 218.5, 90.6 219.1, 91.6 219.3 C 92.6 219.5, 94.6 219.6, 95.6 219.4 C 96.6 219.2, 97.0 218.7, 97.6 218.2 C 98.2 217.7, 98.6 217.0, 99.2 216.6 C 99.8 216.2, 100.4 215.5, 101.0 215.5 C 101.6 215.5, 102.2 216.2, 102.8 216.4 C 103.4 216.6, 104.1 216.7, 104.8 216.6 C 105.5 216.5, 106.3 216.0, 107.0 215.6 C 107.7 215.2, 108.2 214.9, 108.8 214.3 C 109.3 213.8, 109.9 213.1, 110.3 212.3 C 110.7 211.6, 110.9 210.7, 110.9 209.8 C 110.9 209.0, 110.5 207.9, 110.1 207.2 C 109.7 206.4, 109.1 205.8, 108.4 205.3 C 107.7 204.8, 106.6 204.4, 105.8 204.1 C 105.0 203.8, 105.8 203.7, 103.8 203.6 C 101.8 203.5, 96.7 203.5, 94.0 203.6 Z";
const BROW_LEFT =
  "M86 74.6 C 87.2 71.8, 89.5 69.6, 93.5 68.9 C 96.8 68.4, 99.6 68.7, 100.8 69.6 C 100.6 71.3, 97.5 71.9, 93.8 72.2 C 90.8 72.6, 88.2 73.6, 86 74.6 Z";
const BROW_RIGHT =
  "M153.5 74.6 C 152.3 71.8, 150 69.6, 146 68.9 C 142.7 68.4, 139.9 68.7, 138.7 69.6 C 138.9 71.3, 142 71.9, 145.7 72.2 C 148.7 72.6, 151.3 73.6, 153.5 74.6 Z";
const WHISKER_LEFT =
  "M110 105.5 C 104 106.2, 96.5 110, 91 115 C 94 117.8, 100 118.2, 105 116.8 C 107 116.2, 109 115.7, 110 115.2 Z";
const WHISKER_RIGHT =
  "M129.5 105.5 C 135.5 106.2, 143 110, 148.5 115 C 145.5 117.8, 139.5 118.2, 134.5 116.8 C 132.5 116.2, 130.5 115.7, 129.5 115.2 Z";
const BEAK_TOP =
  "M 119.8 98.2 C 118.8 98.2, 117.7 98.7, 117.0 98.9 C 116.3 99.1, 116.3 99.3, 115.8 99.6 C 115.3 99.9, 114.6 100.4, 114.1 100.8 C 113.6 101.2, 113.3 101.6, 113.0 102.0 C 112.7 102.4, 112.3 102.7, 112.0 103.1 C 111.7 103.5, 111.4 103.9, 111.1 104.3 C 110.8 104.7, 110.6 105.1, 110.4 105.5 C 110.2 105.9, 110.1 106.2, 109.9 106.6 C 109.8 107.0, 109.6 107.4, 109.5 107.8 C 109.4 108.2, 109.4 108.6, 109.5 109.0 C 109.6 109.4, 109.9 109.7, 110.2 110.0 C 110.5 110.3, 110.6 110.4, 111.3 110.6 C 112.0 110.8, 113.4 111.1, 114.4 111.3 C 115.4 111.5, 116.6 111.6, 117.5 111.7 C 118.4 111.8, 119.1 111.8, 119.9 111.8 C 120.7 111.8, 121.4 111.8, 122.3 111.7 C 123.2 111.6, 124.4 111.5, 125.4 111.3 C 126.4 111.1, 127.8 110.8, 128.5 110.6 C 129.2 110.4, 129.3 110.3, 129.6 110.0 C 129.9 109.7, 130.2 109.4, 130.3 109.0 C 130.4 108.6, 130.4 108.2, 130.3 107.8 C 130.2 107.4, 130.1 107.0, 129.9 106.6 C 129.8 106.2, 129.6 105.9, 129.4 105.5 C 129.2 105.1, 129.0 104.7, 128.7 104.3 C 128.4 103.9, 128.1 103.5, 127.8 103.1 C 127.5 102.7, 127.2 102.4, 126.8 102.0 C 126.5 101.6, 126.2 101.2, 125.7 100.8 C 125.2 100.4, 124.5 99.9, 124.0 99.6 C 123.5 99.3, 123.5 99.1, 122.8 98.9 C 122.1 98.7, 120.8 98.2, 119.8 98.2 Z";
const BEAK_BOTTOM =
  "M 111.8 112.4 C 109.1 112.6, 111.8 113.1, 111.9 113.5 C 112.1 113.9, 112.4 114.4, 112.7 114.8 C 113.0 115.2, 113.3 115.6, 113.7 116.0 C 114.1 116.4, 114.6 116.8, 115.3 117.2 C 116.0 117.6, 117.1 118.1, 117.9 118.4 C 118.7 118.7, 119.2 118.8, 119.9 118.8 C 120.6 118.8, 121.1 118.7, 121.9 118.4 C 122.7 118.1, 123.8 117.6, 124.5 117.2 C 125.2 116.8, 125.7 116.4, 126.1 116.0 C 126.5 115.6, 126.8 115.2, 127.1 114.8 C 127.4 114.4, 127.8 113.9, 127.9 113.5 C 128.1 113.1, 130.7 112.6, 128.0 112.4 C 125.3 112.2, 114.5 112.2, 111.8 112.4 Z";

/** Clasele Tailwind ale animațiilor de pe site — text scanat de Tailwind din acest fișier. */
const ANIM = {
  whole:
    "motion-safe:group-data-[pose=liniste]:animate-sway motion-safe:group-data-[pose=vorbeste]:animate-head-talk motion-safe:group-data-[pose=bucurie]:animate-hop",
  eyelids: "motion-safe:animate-blink",
  wingLeftUp:
    "origin-[66px_112px] motion-safe:group-data-[pose=salut]:animate-flap motion-safe:group-data-[pose=bucurie]:animate-wings-up-left",
  wingRightUp: "origin-[0px_0px] motion-safe:group-data-[pose=bucurie]:animate-wings-up-right",
  beakBottom: "origin-[120px_112px] motion-safe:group-data-[pose=vorbeste]:animate-talk",
} as const;

const op = (visible: boolean) => (visible ? "1" : "0");
const path = (d: string, attrs: string) => `<path d="${d}" ${attrs}/>`;
const group = (attrs: string, inner: string) => `<g ${attrs}>${inner}</g>`;

/** Aripile: un desen (defs) plasat de patru ori — jos/sus × stânga/dreapta. */
function wings(pose: Pose, phase: number): string {
  const raised = pose === "salut" || pose === "bucurie";
  const both = pose === "bucurie";
  const angle = (ANGLE_UP + 11 * Math.sin(2 * Math.PI * phase)).toFixed(1);
  const thinking = pose === "gandeste" ? " rotate(24 66 112)" : "";
  const use = '<use href="#aripa" xlink:href="#aripa"/>';
  const def = group(
    'id="aripa"',
    path(WING, `fill="${COLORS.wing}"`) +
      path(PATCH, `fill="${COLORS.patch}"`) +
      `<path d="M38 148 L 54 153" stroke="${COLORS.black}" stroke-width="4.6" stroke-linecap="round"/>` +
      `<path d="M37 159 L 51 163" stroke="${COLORS.black}" stroke-width="4.6" stroke-linecap="round"/>`
  );
  return (
    `<defs>${def}</defs>` +
    group(`class="aripa-st-jos" opacity="${op(!raised)}"`, use) +
    group(
      `class="aripa-st-sus ${ANIM.wingLeftUp}" opacity="${op(raised)}" transform="rotate(${angle} ${SHOULDER})"`,
      use
    ) +
    group(`class="aripa-dr-jos" opacity="${op(!both)}" transform="${MIRROR}${thinking}"`, use) +
    group(
      `class="aripa-dr-sus ${ANIM.wingRightUp}" opacity="${op(both)}" transform="${MIRROR} rotate(${angle} ${SHOULDER})"`,
      use
    )
  );
}

/** Picioarele: gambe sub corp + labe cu trei degete și margine subțire; dreapta = oglinda. */
function feet(): string {
  const feetPaths = path(FOOT_LEFT, "") + path(FOOT_LEFT, `transform="${MIRROR}"`);
  return group(
    `fill="${COLORS.foot}" stroke="${COLORS.footEdge}" stroke-width="1.2" stroke-linejoin="round"`,
    '<rect x="94.2" y="188" width="9.6" height="17" rx="3.5" stroke="none"/>' +
      '<rect x="135.9" y="188" width="9.6" height="17" rx="3.5" stroke="none"/>' +
      feetPaths
  );
}

/** Corpul, burta și creasta — statice în toate ipostazele. */
function body(): string {
  return (
    path(BODY, `fill="${COLORS.body}"`) +
    `<circle cx="120" cy="155" r="27" fill="${COLORS.belly}"/>` +
    path(CREST, `class="mot" fill="${COLORS.crest}"`)
  );
}

/** Sprâncenele: sus la bucurie; stânga sus la gândește. */
function brows(pose: Pose): string {
  const groupT = pose === "bucurie" ? ' transform="translate(0 -5)"' : "";
  const leftT = pose === "gandeste" ? ' transform="translate(0 -6)"' : "";
  return group(
    `class="sprancene" fill="${COLORS.black}"${groupT}`,
    `<path class="spranceana-st" d="${BROW_LEFT}"${leftT}/>` +
      `<path class="spranceana-dr" d="${BROW_RIGHT}"/>`
  );
}

/** Un ochi deschis: alb, pupilă, lucire — pupila și lucirea privesc în sus la gândește. */
function eye(cx: number, gaze: string): string {
  const px = cx + 2.2;
  const lx = cx - 1.6;
  return (
    `<circle cx="${cx}" cy="93.8" r="14.3" fill="${COLORS.white}"/>` +
    `<circle class="pupila" cx="${px}" cy="94.5" r="10.6" fill="${COLORS.pupil}"${gaze}/>` +
    `<circle class="lucire" cx="${lx}" cy="91" r="3.3" fill="${COLORS.white}"${gaze}/>`
  );
}

/** Ochii: deschiși (cu pleoapele care clipesc) sau fericiți — ambele grupuri, comutate prin opacitate. */
function eyes(pose: Pose, phase: number): string {
  const happy = pose === "bucurie";
  const blinking = pose === "liniste" && phase >= 0.92 && phase < 0.96;
  const gaze = pose === "gandeste" ? ' transform="translate(-4 -5)"' : "";
  const eyelids = group(
    `class="pleoape ${ANIM.eyelids}" fill="${COLORS.body}" opacity="${op(blinking)}"`,
    '<circle cx="94.8" cy="93.8" r="15.3"/><circle cx="144.7" cy="93.8" r="15.3"/>'
  );
  const opened = group(
    `class="ochi-deschisi" opacity="${op(!happy)}"`,
    eye(94.8, gaze) + eye(144.7, gaze) + eyelids
  );
  const arcs = group(
    `class="ochi-fericiti" opacity="${op(happy)}" stroke="${COLORS.pupil}" stroke-width="4.5" stroke-linecap="round" fill="none"`,
    '<path d="M82 97 Q94.8 84 107.5 97"/><path d="M132 97 Q144.7 84 157.5 97"/>'
  );
  return opened + arcs;
}

/** Mustățile sub cioc, apoi ciocul (mărit 10%): gura roșie, partea de sus, mandibula care se deschide. */
function beak(pose: Pose, phase: number): string {
  const open = pose === "vorbeste" && phase > 0 && phase < 0.5;
  const mandible = open ? ' transform="rotate(22 120 112) translate(0 3)"' : "";
  return (
    path(WHISKER_LEFT, `fill="${COLORS.black}"`) +
    path(WHISKER_RIGHT, `fill="${COLORS.black}"`) +
    group(
      'transform="translate(120 108) scale(1.1) translate(-120 -108)"',
      `<path d="M113 111.2 L127 111.2 L120 116.5 Z" fill="${COLORS.mouth}"/>` +
        path(BEAK_TOP, `fill="${COLORS.beak}"`) +
        group(
          `class="cioc-jos ${ANIM.beakBottom}"${mandible}`,
          path(BEAK_BOTTOM, `fill="${COLORS.beakBottom}"`)
        )
    )
  );
}

/** Mișcarea întregului corp din fază: respirația, legănatul vorbirii, saltul de bucurie. */
function wholeMotion(pose: Pose, phase: number): string {
  if (pose === "bucurie") return `translate(0 ${(-16 * Math.sin(Math.PI * phase)).toFixed(1)})`;
  if (pose === "vorbeste") return `translate(0 ${(-2 * Math.sin(2 * Math.PI * phase)).toFixed(1)})`;
  if (pose === "liniste") return `translate(0 ${(-3 * Math.sin(2 * Math.PI * phase)).toFixed(1)})`;
  return "translate(0 0)";
}

/** Ipostaza `pose` la phase `phase` (0..1), ca SVG doar cu atribute de prezentare. */
export function mascotSvg(pose: Pose, phase = 0): string {
  const whole = group(
    `class="tot ${ANIM.whole}" transform="${wholeMotion(pose, phase)}"`,
    wings(pose, phase) + feet() + body() + brows(pose) + eyes(pose, phase) + beak(pose, phase)
  );
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ' +
    `viewBox="0 0 240 240" aria-hidden="true" focusable="false">${whole}</svg>`
  );
}
