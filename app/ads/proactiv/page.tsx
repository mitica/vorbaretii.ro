import SectionContainer from "@/app/components/section-container";
import ProactivImages from "./proactiv-images";
import ProactivText from "./proactiv-text";

export default function Page() {
  return (
    <SectionContainer className="w-full h-full min-h-full h-screen">
      <div className="w-full h-full flex flex-col items-center justify-center space-y-2 md:space-y-4">
        <div className="flex-1 min-h-2 container py-4 pt-6">
          <ProactivImages />
        </div>
        <div className="w-full flex flex-col items-center justify-center py-1 space-y-2 md:space-y-4">
          <ProactivText />
        </div>
      </div>
    </SectionContainer>
  );
}
