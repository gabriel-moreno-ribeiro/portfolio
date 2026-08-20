import { lazy, Suspense, useEffect, useRef, useState } from "react";
import FindMyWork from "../components/Home/FindMyWork";
import Hero from "../components/Home/Hero";
import NumbersAndStats from "../components/Home/Numbers";
import Research from "../components/Home/Research";
import Skills from "../components/Home/Skills";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Shared/Footer";
import { scrollToComponent } from "../utils/scrollToComponent";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import StickerPeel from "../components/ReactBits/StickerPeel";

const BackgroundGlobe = lazy(() => import("../components/Home/BackgroundGlobe"));
const HorizontalSkillsWrapper = lazy(() => import("../components/Home/HorizontalSkillsWrapper"));
const WorkExperience = lazy(() => import("../components/Home/WorkExperience"));

const NAV_SECTIONS = ['Header', 'Origins', 'Skills', 'Cool Things', 'Research', 'Professional Experience'];
const NAV_IDS      = ['main-content', 'background', 'skills', 'work', 'research', 'work-experience'];

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
    }, { threshold: 0.15, rootMargin: '-60px 0px -40% 0px' });

    NAV_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    observerRef.current = obs;
    return () => obs.disconnect();
  }, []);

  const handleNavClick = (index: number) => {
    scrollToComponent(NAV_IDS[index], 60);
  };

  return (
    <div className="home-wrapper" id="main-content">
      {/* Fixed side navigation */}
      <nav className="home-sidenav" aria-label="Page sections">
        {NAV_SECTIONS.map((label, i) => (
          <button
            key={label}
            className={`sidenav-item ${activeNav === i ? 'sidenav-item--active' : ''}`}
            onClick={() => handleNavClick(i)}
            aria-label={`Go to ${label} section`}
            aria-current={activeNav === i ? 'true' : undefined}
          >
            <span className="sidenav-item__line" />
            <span className="sidenav-item__label" aria-hidden="true">{label}</span>
          </button>
        ))}
      </nav>

      <Navbar />
      <Hero />
      <Suspense fallback={<div style={{ minHeight: 700 }} />}>
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

    </div>
  );
}

export default Home;
