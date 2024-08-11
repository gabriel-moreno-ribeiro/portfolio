import FindMyWork from "../components/Home/FindMyWork";
import Hero from "../components/Home/Hero";
import HorizontalSkillsWrapper from "../components/Home/HorizontalSkillsWrapper";
import NumbersAndStats from "../components/Home/Numbers";
import Skills from "../components/Home/Skills";
import WorkCarousel from "../components/Home/WorkCarousel";
import Navbar from "../components/Navbar/Navbar";
function Home() {
  return (
    <>
      <div className="home-wrapper">
        <Navbar />
        <Hero />
        <Skills />
        <NumbersAndStats />
        <HorizontalSkillsWrapper />
        <FindMyWork />
        {/* <VerticalSkills /> */}

        <WorkCarousel />
      </div>
      {/* Footer */}
    </>
  );
}

export default Home;
