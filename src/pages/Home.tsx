import { lazy, Suspense, useEffect, useRef, useState } from "react";
import Books from "../components/Home/Books";
import FindMyWork from "../components/Home/FindMyWork";
import Hero from "../components/Home/Hero";
import NumbersAndStats from "../components/Home/Numbers";
import Research from "../components/Home/Research";
import Skills from "../components/Home/Skills";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Shared/Footer";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import LineSidebar from "../components/ReactBits/LineSidebar";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import StickerPeel from "../components/ReactBits/StickerPeel";

const CarCanvas = lazy(() => import("../components/Canvas/BallCanvas"));
const BackgroundGlobe = lazy(() => import("../components/Home/BackgroundGlobe"));
const HorizontalSkillsWrapper = lazy(() => import("../components/Home/HorizontalSkillsWrapper"));
const WorkExperience = lazy(() => import("../components/Home/WorkExperience"));

const NAV_SECTIONS = ['Work', 'Research', 'Origins', 'Skills', 'Books'];
const NAV_IDS      = ['work',  'research', 'background', 'skills', 'books'];

function Home() {
  const [activeNav, setActiveNav] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current?.disconnect();
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = NAV_IDS.indexOf(entry.target.id);
          if (idx !== -1) setActiveNav(idx);
        }
      });
    }, { threshold: 0.3 });

    NAV_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    observerRef.current = obs;
    return () => obs.disconnect();
  }, []);

  const handleNavClick = (index: number) => {
    const el = document.getElementById(NAV_IDS[index]);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="home-wrapper">
      {/* Fixed side navigation */}
      <div className="home-sidenav">
        <LineSidebar
          items={NAV_SECTIONS as any}
          defaultActive={activeNav}
          onItemClick={handleNavClick}
          accentColor="#f0732d"
          textColor="#999"
          markerColor="#ccc"
          markerLength={36}
          itemGap={22}
          fontSize={0.78}
          showIndex={false}
          showMarker
          maxShift={16}
          proximityRadius={80}
        />
      </div>

      <Navbar />
      <Hero />
      <Research />
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
      <Books />
      <Footer />

      {/* HIBEEX draggable sticker */}
      <div className="sticker-stage">
        <StickerPeel
          imageSrc="/logo192.png"
          width={120}
          rotate={-12}
          peelBackHoverPct={25}
          peelBackActivePct={38}
          initialPosition={"bottom-right" as any}
          shadowIntensity={0.5}
          lightingIntensity={0.1}
        />
      </div>

      <Suspense fallback={null}>
        <CarCanvas />
      </Suspense>
    </div>
  );
}

export default Home;
