import CourseItems from "@/app/components/course-items";
import SectionContainer from "@/app/components/section-container";

const windowSize = {
  width: 1920,
  height: 1080
};

function BgImage() {
  return (
    <SectionContainer className="w-full min-h-full justify-center flex items-center my-12 pb-80">
      <CourseItems className="flex-1" />
    </SectionContainer>
  );
}

export default function Page() {
  return BgImage();
}
