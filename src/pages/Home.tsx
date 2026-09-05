import { lazy, Suspense, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Hero from "../components/Home/Hero";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Shared/Footer";
import { scrollToComponent } from "../utils/scrollToComponent";

const BackgroundGlobe = lazy(() => import("../components/Home/BackgroundGlobe"));
const Skills = lazy(() => import("../components/Home/Skills"));
const FindMyWork = lazy(() => import("../components/Home/FindMyWork"));
const Research = lazy(() => import("../components/Home/Research"));
const NumbersAndStats = lazy(() => import("../components/Home/Numbers"));
const HorizontalSkillsWrapper = lazy(() => import("../components/Home/HorizontalSkillsWrapper"));
const WorkExperience = lazy(() => import("../components/Home/WorkExperience"));
const ContactSection = lazy(() => import("../components/Home/ContactSection"));
// @ts-ignore
const StickerPeel = lazy(() => import("../components/ReactBits/StickerPeel"));

const NAV_SECTIONS = ['Top', 'Origins', 'Skills', 'Cool Things', 'Research', 'Professional Experience', 'Contact'];
const NAV_IDS      = ['main-content', 'background', 'skills', 'work', 'research', 'work-experience', 'contact'];

// A section is "current" once its top crosses this line of the viewport.
const ACTIVE_LINE = 0.4;
// Gap left above a section reached through a URL hash (clears the navbar).
const HASH_OFFSET = 90;
const STOP_EVENTS = ['wheel', 'touchstart', 'keydown'];

function Home() {
  const [activeNav, setActiveNav] = useState(0);
  const location = useLocation();

  // Sections are lazy-loaded, so look them up on every scroll instead of
  // observing a snapshot of the DOM taken at mount.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const line = window.innerHeight * ACTIVE_LINE;
      let idx = 0;
      for (let i = 1; i < NAV_IDS.length; i++) {
        const el = document.getElementById(NAV_IDS[i]);
        if (el && el.getBoundingClientRect().top <= line) idx = i;
      }
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom) idx = NAV_IDS.length - 1;
      setActiveNav(idx);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(raf);
    };
  }, []);

  // /#contact (and the old /contact URL). In-page: smooth scroll. On a fresh
  // load the target is lazy and the sections above it keep growing as they
  // load, so keep re-aligning (instantly) until the layout settles or the
  // visitor takes over.
  useEffect(() => {
    const id = location.hash.slice(1);
    if (!id) return;
    if (document.getElementById(id)) {
      scrollToComponent(id, HASH_OFFSET);
      return;
    }
    let timer = 0;
    let stableTicks = 0;
    const start = performance.now();
    const stop = () => {
      clearTimeout(timer);
      STOP_EVENTS.forEach(ev => window.removeEventListener(ev, stop));
    };
    const tick = () => {
      const el = document.getElementById(id);
      if (el) {
        const drift = el.getBoundingClientRect().top - HASH_OFFSET;
        if (Math.abs(drift) > 2) {
          window.scrollTo({ top: window.scrollY + drift, behavior: 'instant' });
          stableTicks = 0;
        } else {
          stableTicks++;
        }
      }
      if (stableTicks >= 14 || performance.now() - start > 8000) return stop();
      timer = window.setTimeout(tick, 150);
    };
    STOP_EVENTS.forEach(ev => window.addEventListener(ev, stop, { passive: true }));
    tick();
    return stop;
  }, [location.hash, location.key]);

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
      <Suspense fallback={null}>
        <Skills />
      </Suspense>
      <Suspense fallback={null}>
        <FindMyWork />
      </Suspense>
      <Suspense fallback={null}>
        <Research />
      </Suspense>
      <Suspense fallback={null}>
        <NumbersAndStats />
      </Suspense>
      <Suspense fallback={null}>
        <HorizontalSkillsWrapper />
      </Suspense>
      <Suspense fallback={null}>
        <WorkExperience />
      </Suspense>
      <Suspense fallback={null}>
        <ContactSection />
      </Suspense>
      <Footer />

      {/* HIBEEX sticker */}
      <div className="sticker-stage">
        <Suspense fallback={null}>
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
        </Suspense>
      </div>

    </div>
  );
}

export default Home;
