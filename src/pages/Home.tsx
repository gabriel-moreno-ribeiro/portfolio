import CarCanvas from "../components/Canvas/BallCanvas";
import FindMyWork from "../components/Home/FindMyWork";
import Hero from "../components/Home/Hero";
import HorizontalSkillsWrapper from "../components/Home/HorizontalSkillsWrapper";
import NumbersAndStats from "../components/Home/Numbers";
import Skills from "../components/Home/Skills";
import WorkCarousel from "../components/Home/WorkCarousel";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Shared/Footer";
function Home() {
  return (
    <>
      <div className="home-wrapper">
        <Navbar />
        <Hero />
        <Skills />
        <FindMyWork />
        <NumbersAndStats />
        <HorizontalSkillsWrapper />
        <WorkCarousel />
        <Footer />
        <CarCanvas />
      </div>
    </>
  );
}

export default Home;
