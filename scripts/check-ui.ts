/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
// Tipurile DOM sunt pentru codul din `page.evaluate`, care rulează în browser,
// nu în Node. tsconfig.base.json nu le include, așa că le cerem doar aici.

/**
 * Verificarea vizuală obligatorie. Rulează pe build-ul de producție din `out/`.
 *
 *   yarn build && yarn check-ui
 *
 * Deschide fiecare pagină la fiecare combinație de lățime și mărime de font și
 * caută trei lucruri, în ordinea în care ne-au stricat site-ul:
 *
 *   1. suprapuneri — un element care iese pe verticală din containerul lui;
 *   2. derulare laterală — pagina mai lată decât fereastra;
 *   3. ținte de apăsat sub 44px — pe toată pagina, inclusiv header și footer.
 *
 * Fontul mărit e obligatoriu în matrice: acolo au apărut suprapunerile pe care
 * „arată bine la mine" nu le prinde niciodată. Vezi CLAUDE.md § Reguli de UI.
 */

import { createServer, type Server } from "http";
import { existsSync, statSync, createReadStream } from "fs";
import { extname, join, normalize } from "path";
import { chromium, type Browser } from "playwright";
import { articles } from "../app/articole/articles";
import { games } from "../app/jocuri/games";

const OUT = join(__dirname, "..", "out");
const PORT = 4321;

const ROUTES = [
  "/",
  "/jocuri",
  "/articole",
  ...articles.map((a) => `/articole/${a.slug}`),
  ...games.map((g) => `/jocuri/${g.slug}`),
];

/** [lățime, înălțime, font rădăcină] */
const CASES: [number, number, number][] = [
  [390, 664, 16],
  [360, 640, 16],
  [320, 568, 16],
  [412, 690, 18],
  [343, 712, 20],
  [390, 664, 24],
  [320, 568, 24],
  [820, 1100, 16],
  [1080, 1200, 16],
  [1440, 900, 20],
];

/** Ținta minimă pentru un deget, în px. */
const MIN_TAP = 44;

/** O literă mare depășește normal rândul ei cu 2-3px. Sub atât nu e suprapunere. */
const SPILL_TOLERANCE = 6;

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

/**
 * Serverul static, ca GitHub Pages: `/jocuri` → `out/jocuri.html`.
 * Trimite `no-store`, altfel browserul servește HTML vechi și verifici o
 * versiune care nu mai există (ni s-a întâmplat).
 */
function resolveFile(rawUrl: string): string {
  let url = rawUrl.split("?")[0] ?? "/";
  // GitHub Pages decodează %5Bslug%5D → [slug]; serverul de test trebuie să
  // facă la fel, altfel chunk-ul paginii dinamice dă 404, jocurile nu se
  // hidratează și fiecare verificare așteaptă degeaba timeout-ul de schelet.
  try {
    url = decodeURIComponent(url);
  } catch {
    /* URL stricat — se caută ca atare și dă 404 */
  }
  let file = join(OUT, normalize(url).replace(/^(\.\.[/\\])+/, ""));
  if (url === "/") file = join(OUT, "index.html");
  else if (existsSync(file + ".html")) file = file + ".html";
  else if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  return file;
}

function serve(): Promise<Server> {
  const server = createServer((req, res) => {
    const file = resolveFile(req.url || "/");
    res.setHeader("Cache-Control", "no-store");
    if (!existsSync(file) || statSync(file).isDirectory()) {
      res.writeHead(404).end("nu există");
      return;
    }
    res.writeHead(200, {
      "Content-Type": TYPES[extname(file)] || "application/octet-stream",
    });
    createReadStream(file).pipe(res);
  });
  return new Promise((done) => server.listen(PORT, () => done(server)));
}

type Problem = { where: string; what: string; detail: string };
type ScanParams = { minTap: number; tolerance: number; viewportWidth: number; checkTaps: boolean };

/** Rulează ÎN browser (page.evaluate) — self-contained, fără closure-uri. */
function scanInBrowser({ minTap, tolerance, viewportWidth, checkTaps }: ScanParams) {
  const problems: { what: string; detail: string }[] = [];

  if (document.documentElement.scrollWidth > viewportWidth + 1) {
    problems.push({
      what: "derulare laterală",
      detail: `${document.documentElement.scrollWidth}px pe ${viewportWidth}px`,
    });
  }

  const spill = Array.from(document.querySelectorAll("main *")).filter((el) => {
    const parent = el.parentElement;
    if (!parent || getComputedStyle(parent).overflow !== "visible") return false;
    const a = el.getBoundingClientRect();
    const b = parent.getBoundingClientRect();
    return a.height > 0 && a.bottom > b.bottom + tolerance;
  });
  for (const el of spill.slice(0, 3)) {
    problems.push({
      what: "suprapunere",
      detail: `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)}`,
    });
  }

  if (checkTaps) {
    const small = new Set(
      Array.from(document.querySelectorAll("a, button"))
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.height > 0 && r.height < minTap;
        })
        .map(
          (el) =>
            `${(el.textContent || "").trim().slice(0, 26)} = ${Math.round(
              el.getBoundingClientRect().height
            )}px`
        )
    );
    for (const detail of small) problems.push({ what: "țintă mică", detail });
  }

  return problems;
}

async function inspect(
  browser: Browser,
  route: string,
  [width, height, fontSize]: [number, number, number]
): Promise<Problem[]> {
  const page = await browser.newPage({ viewport: { width, height } });
  try {
    await page.goto(`http://127.0.0.1:${PORT}${route}`, {
      waitUntil: "domcontentloaded",
    });
    // Jocurile arată un schelet până se montează; fără asta am verifica scheletul.
    // Iar dacă scheletul NU dispare, pagina nu s-a hidratat — problemă de
    // raportat, nu de înghițit: altfel rulăm 70 de timeout-uri în tăcere.
    const stuck = await page
      .waitForFunction(() => !document.querySelector("main .animate-pulse"), {
        timeout: 10_000,
      })
      .then(() => false)
      .catch(() => true);
    if (stuck) {
      return [
        {
          where: `${width}×${height} @${fontSize}px  ${route}`,
          what: "schelet blocat",
          detail: "pagina nu s-a hidratat în 10s (eroare de JS sau resursă 404?)",
        },
      ];
    }
    await page.evaluate(
      (size) => (document.documentElement.style.fontSize = `${size}px`),
      fontSize
    );
    await page.waitForTimeout(300);

    const found = await page.evaluate(scanInBrowser, {
      minTap: MIN_TAP,
      tolerance: SPILL_TOLERANCE,
      viewportWidth: width,
      // Ținta se măsoară o dată, la fontul implicit: la font mărit crește oricum.
      checkTaps: fontSize === 16,
    });

    return found.map((p) => ({
      where: `${width}×${height} @${fontSize}px  ${route}`,
      ...p,
    }));
  } finally {
    await page.close();
  }
}

async function main() {
  if (!existsSync(join(OUT, "index.html"))) {
    console.error("Nu găsesc build-ul în out/. Rulează întâi `yarn build`.");
    process.exit(1);
  }

  const server = await serve();
  const browser = await chromium.launch();
  const problems: Problem[] = [];
  let checks = 0;

  try {
    for (const size of CASES) {
      for (const route of ROUTES) {
        problems.push(...(await inspect(browser, route, size)));
        checks++;
      }
    }
  } finally {
    await browser.close();
    server.close();
  }

  if (problems.length) {
    console.error(`\n${problems.length} probleme din ${checks} verificări:\n`);
    console.table(problems);
    process.exit(1);
  }

  console.log(
    `CURAT: ${checks} verificări — fără suprapuneri, fără derulare laterală, nicio țintă sub ${MIN_TAP}px`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
