import Hero from "../components/Home/Hero";
import Skills from "../components/Home/Skills";
import VerticalSkills from "../components/Home/VerticalSkills";
import Navbar from "../components/Navbar/Navbar";
function Home() {
  return (
    <>
      <div className="home-wrapper">
        <Navbar />
        <Hero />
        <Skills />
        <VerticalSkills />
        {/* <NumbersAndStats />
        <WorkCarousel /> */}
      </div>
      {/* Footer */}
    </>
  );
}

export default Home;
