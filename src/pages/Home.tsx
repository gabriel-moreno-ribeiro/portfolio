import FindMyWork from "../components/Home/FindMyWork";
import Hero from "../components/Home/Hero";
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
        <FindMyWork />
        {/* <VerticalSkills /> */}

        <WorkCarousel />
      </div>
      {/* Footer */}
    </>
  );
}

export default Home;
