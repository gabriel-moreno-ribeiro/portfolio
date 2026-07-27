import { lazy, Suspense } from "react";
import FindMyWork from "../components/Home/FindMyWork";
import Hero from "../components/Home/Hero";
import Honors from "../components/Home/Honors";
import HorizontalSkillsWrapper from "../components/Home/HorizontalSkillsWrapper";
import NumbersAndStats from "../components/Home/Numbers";
import Skills from "../components/Home/Skills";
import Timeline from "../components/Home/Timeline";
import WorkExperience from "../components/Home/WorkExperience";
import WorkflowPlayground from "../components/Home/WorkflowPlayground";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Shared/Footer";

const CarCanvas = lazy(() => import("../components/Canvas/BallCanvas"));
const BackgroundGlobe = lazy(() => import("../components/Home/BackgroundGlobe"));

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
      <HorizontalSkillsWrapper />
      <WorkExperience />
      <WorkflowPlayground />
      <Honors />
      <Timeline />
      <Footer />
      <Suspense fallback={null}>
        <CarCanvas />
      </Suspense>
    </div>
  );
}

export default Home;
