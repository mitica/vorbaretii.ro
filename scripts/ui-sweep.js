/**
 * Verificarea vizuală obligatorie înainte de publicare (vezi CLAUDE.md).
 *
 * Nu e un test automat cu dependențe — se lipește în consola browserului, pe o
 * pagină servită din `out/` (build de producție, cu `Cache-Control: no-store`).
 * Deschide fiecare pagină într-un iframe, la fiecare combinație de lățime și
 * mărime de font, și caută trei lucruri:
 *
 *   1. suprapuneri — un element care iese pe verticală din containerul lui;
 *   2. derulare laterală — pagina mai lată decât fereastra;
 *   3. ținte de apăsat sub 44px.
 *
 * Trebuie să scrie „CURAT". Orice altceva se repară înainte de commit.
 *
 *   yarn build
 *   python3 -m http.server --directory out
 *   # apoi, în consolă:  await uiSweep()
 */
async function uiSweep() {
  const routes = [
    "/",
    "/jocuri.html",
    "/jocuri/roata-cuvintelor",
    "/jocuri/ghicitori",
    "/jocuri/proverbe-pereche",
    "/jocuri/anagrame",
    "/jocuri/memorie"
  ];
  // [lățime, înălțime, font rădăcină]. Fontul mărit e obligatoriu: acolo au
  // apărut suprapunerile pe care „arată bine la mine" nu le prinde niciodată.
  const cases = [
    [390, 664, 16], [360, 640, 16], [320, 568, 16],
    [412, 690, 18], [343, 712, 20],
    [390, 664, 24], [320, 568, 24],
    [820, 1100, 16], [1080, 1200, 16], [1440, 900, 20]
  ];

  const bad = [];
  let n = 0;

  for (const [w, h, fs] of cases) {
    for (const route of routes) {
      const frame = document.createElement("iframe");
      frame.style.cssText = `position:fixed;left:-9999px;top:0;border:0;width:${w}px;height:${h}px`;
      document.body.appendChild(frame);
      frame.src = route + "?sweep=" + ++n;
      await new Promise((done) => {
        frame.onload = done;
        setTimeout(done, 5000);
      });
      frame.contentDocument.documentElement.style.fontSize = fs + "px";
      await new Promise((r) => setTimeout(r, 600));

      const doc = frame.contentDocument;
      const where = `${w}x${h}@${fs}px ${route}`;

      if (doc.documentElement.scrollWidth > w + 1) {
        bad.push({ where, derulareLaterala: doc.documentElement.scrollWidth });
      }

      const spill = [...doc.querySelectorAll("main *")].filter((el) => {
        const parent = el.parentElement;
        if (!parent || getComputedStyle(parent).overflow !== "visible") return false;
        const a = el.getBoundingClientRect();
        const b = parent.getBoundingClientRect();
        // 6px toleranță: o literă mare depășește normal rândul ei cu 2-3px.
        return a.height > 0 && a.bottom > b.bottom + 6;
      });
      if (spill.length) {
        bad.push({
          where,
          suprapuneri: spill.slice(0, 3).map((el) => el.tagName + "." + el.className)
        });
      }

      if (fs === 16) {
        const small = [...doc.querySelectorAll("main a, main button")]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.height > 0 && r.height < 44;
          })
          .map((el) => el.textContent.trim().slice(0, 26) + " = " + Math.round(el.getBoundingClientRect().height) + "px");
        if (small.length) bad.push({ where, tinteSub44: [...new Set(small)] });
      }

      frame.remove();
    }
  }

  if (bad.length) {
    console.table(bad);
    return `${bad.length} probleme din ${n} verificări`;
  }
  return `CURAT: ${n} verificări — fără suprapuneri, fără derulare laterală, nicio țintă sub 44px`;
}
