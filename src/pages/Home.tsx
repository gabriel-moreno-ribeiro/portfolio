import { lazy, Suspense } from "react";
import Books from "../components/Home/Books";
import FindMyWork from "../components/Home/FindMyWork";
import Hero from "../components/Home/Hero";
import NumbersAndStats from "../components/Home/Numbers";
import Research from "../components/Home/Research";
import Skills from "../components/Home/Skills";
import Timeline from "../components/Home/Timeline";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Shared/Footer";

const CarCanvas = lazy(() => import("../components/Canvas/BallCanvas"));
const BackgroundGlobe = lazy(() => import("../components/Home/BackgroundGlobe"));
const HorizontalSkillsWrapper = lazy(() => import("../components/Home/HorizontalSkillsWrapper"));
const WorkExperience = lazy(() => import("../components/Home/WorkExperience"));

function Home() {
  return (
    <div className="home-wrapper">
      <Navbar />
      <Hero />
      <Suspense fallback={null}>
        <BackgroundGlobe />
      </Suspense>
      <Skills />
      <FindMyWork />
      <NumbersAndStats />
      <Suspense fallback={null}>
        <HorizontalSkillsWrapper />
      </Suspense>
      <Suspense fallback={null}>
        <WorkExperience />
      </Suspense>
      <Research />
      <Books />
      <Timeline />
      <Footer />
      <Suspense fallback={null}>
        <CarCanvas />
      </Suspense>
    </div>
  );
}

export default Home;
