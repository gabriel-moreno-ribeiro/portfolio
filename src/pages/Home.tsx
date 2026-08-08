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
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import StickerPeel from "../components/ReactBits/StickerPeel";

const CarCanvas = lazy(() => import("../components/Canvas/BallCanvas"));
const BackgroundGlobe = lazy(() => import("../components/Home/BackgroundGlobe"));
const HorizontalSkillsWrapper = lazy(() => import("../components/Home/HorizontalSkillsWrapper"));
const WorkExperience = lazy(() => import("../components/Home/WorkExperience"));

const NAV_SECTIONS = ['Origins', 'Skills', 'Work', 'Research', 'Books'];
const NAV_IDS      = ['background', 'skills', 'work', 'research', 'books'];

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
      <nav className="home-sidenav" aria-label="Page sections">
        {NAV_SECTIONS.map((label, i) => (
          <button
            key={label}
            className={`sidenav-item ${activeNav === i ? 'sidenav-item--active' : ''}`}
            onClick={() => handleNavClick(i)}
          >
            <span className="sidenav-item__line" />
            <span className="sidenav-item__label">{label}</span>
          </button>
        ))}
      </nav>

      <Navbar />
      <Hero />
      <Suspense fallback={null}>
        <BackgroundGlobe />
      </Suspense>
      <Skills />
      <FindMyWork />
      <Research />
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
      {/* HIBEEX sticker — replace /logo192.png with /hibeex-logo.png when available */}
      <div className="sticker-stage">
        <StickerPeel
          imageSrc="/hibeex.png"
          width={130}
          rotate={-8}
          peelBackHoverPct={22}
          peelBackActivePct={35}
          initialPosition={"center" as any}
          shadowIntensity={0.45}
          lightingIntensity={0.09}
        />
      </div>

      <Suspense fallback={null}>
        <CarCanvas />
      </Suspense>
    </div>
  );
}

export default Home;
