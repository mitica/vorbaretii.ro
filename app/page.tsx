import AboutCourse from "./components/about-course";
import ContactSection from "./components/contact-section";
import CourseGroups from "./components/course-groups";
import HomeIntro from "./components/home-intro";

export default function Home() {
  return (
    <>
      <HomeIntro />
      <AboutCourse />
      <CourseGroups />
      <ContactSection />
    </>
  );
}
