import BoringToHappy from "./images/boring-to-happy";
import SectionContainer from "./section-container";

export default function ScopeSection() {
  return (
    <SectionContainer className="bg-white">
      <a id="scop"></a>
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Scopuri
              </h2>
              <div className="mt-6 text-lg leading-8 text-gray-600">
                <ul>
                  <li>
                    <span className="font-semibold">
                      &#183; Copii proactivi
                    </span>
                    : ajutăm copiii să-și dezvolte abilitățile înnăscute și să
                    descopere noi talente.
                  </li>
                  <li>
                    <span className="font-semibold">&#183; Copii creativi</span>
                    : încurajăm creativitatea și gândirea critică.
                  </li>
                  <li>
                    <span className="font-semibold">
                      &#183; Copii sociabili
                    </span>
                    : îi ajutăm să comunice eficient și să colaboreze cu
                    ceilalți.
                  </li>
                  <li>
                    <span className="font-semibold">&#183; Limba română</span>:
                    ideal pentru copiii care trăiesc în afara țării și vor să nu
                    uite limba română.
                  </li>
                </ul>
              </div>
            </div>
            <div className="w-full h-72 md:h-80">
              <BoringToHappy child="boy" />
            </div>
            <div className="w-full h-72 md:h-80 hidden lg:block">
              <BoringToHappy child="girl" />
            </div>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
