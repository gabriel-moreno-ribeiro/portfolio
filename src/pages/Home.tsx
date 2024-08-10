import FindMyWork from "../components/Home/FindMyWork";
import Hero from "../components/Home/Hero";
import Skills from "../components/Home/Skills";
import Navbar from "../components/Navbar/Navbar";
function Home() {
  return (
    <>
      <div className="home-wrapper">
        <Navbar />
        <Hero />
        <Skills />
        <FindMyWork />
        {/* <VerticalSkills /> */}
        {/* <NumbersAndStats /> */}
        {/* <WorkCarousel /> */}
      </div>
      {/* Footer */}
    </>
  );
}

export default Home;
