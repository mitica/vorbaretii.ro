import AboutCourseSection from "./components/about-course-section";
import ContactSection from "./components/contact-section";
import CourseGroupsSection from "./components/course-groups-section";
import HomeIntro from "./components/home-intro";
import ScopeSection from "./components/scope-section";

export default function Home() {
  return (
    <>
      <HomeIntro />
      <AboutCourseSection />
      <ScopeSection />
      <CourseGroupsSection />
      <ContactSection />
    </>
  );
}
