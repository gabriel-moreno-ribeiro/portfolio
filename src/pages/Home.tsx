import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Hero from "../components/Home/Hero";
import MomentsStrip from "../components/Home/MomentsStrip";
import SectionRail from "../components/Home/SectionRail";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Shared/Footer";
import { useVisible } from "../lib/motion";
import { scrollToComponent } from "../utils/scrollToComponent";

const BackgroundGlobe = lazy(() => import("../components/Home/BackgroundGlobe"));
const Skills = lazy(() => import("../components/Home/Skills"));
const FindMyWork = lazy(() => import("../components/Home/FindMyWork"));
const Research = lazy(() => import("../components/Home/Research"));
const NumbersAndStats = lazy(() => import("../components/Home/Numbers"));
const Experience = lazy(() => import("../components/Home/Experience/Experience"));
const ContactSection = lazy(() => import("../components/Home/ContactSection"));
// @ts-ignore
const StickerPeel = lazy(() => import("../components/ReactBits/StickerPeel"));

// "Experience" (not "Professional Experience"): the longest label must fit the 194px gutter left of the content column at 1440.
const SECTIONS = [
  { id: 'main-content', label: 'Top' },
  { id: 'background', label: 'Origins' },
  { id: 'work', label: 'Cool Things' },
  { id: 'research', label: 'Research' },
  { id: 'skills', label: 'Skills' },
  { id: 'work-experience', label: 'Experience' },
  { id: 'contact', label: 'Contact' },
];

// Gap left above a section reached through a URL hash (clears the navbar).
const HASH_OFFSET = 90;
const STOP_EVENTS = ['wheel', 'touchstart', 'keydown'];

// Lazy sections reserve roughly their final height, so the document doesn't
// grow in jumps as chunks arrive and nothing below reads as "blank" meanwhile.
function Reserve({ height }: { height: number }) {
  return <div style={{ minHeight: height }} aria-hidden="true" />;
}

// A section below the fold only mounts (and only downloads its chunk) once its
// reserved box comes within half a viewport of the screen. Mounting everything
// at load was the single biggest cost on the main thread. While unmounted the
// wrapper carries the section id, so the rail and hash links still find it.
function LazySection({ id, height, eager, children }: { id: string; height: number; eager: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const near = useVisible(ref, { rootMargin: '50% 0px', once: true });
  const mounted = eager || near;
  return (
    <div ref={ref} id={mounted ? undefined : id} style={mounted ? undefined : { minHeight: height }}>
      {mounted && <Suspense fallback={<Reserve height={height} />}>{children}</Suspense>}
    </div>
  );
}

function Home() {
  const location = useLocation();
  // A deep link (/#contact) needs its target in the DOM, so mount everything.
  const eager = location.hash.length > 1;

  // The peelable sticker is a toy (and pulls GSAP): it waits for the first
  // interaction, or 6 s, instead of competing with the hero for the main thread.
  const [showSticker, setShowSticker] = useState(false);
  useEffect(() => {
    const events = ['pointermove', 'keydown', 'touchstart', 'scroll'];
    const show = () => {
      setShowSticker(true);
      events.forEach((ev) => window.removeEventListener(ev, show));
      clearTimeout(timer);
    };
    const timer = window.setTimeout(show, 6000);
    events.forEach((ev) => window.addEventListener(ev, show, { passive: true, once: true }));
    return () => {
      clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, show));
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

  return (
    <main className="home-wrapper" id="main-content">
      <SectionRail sections={SECTIONS} />

      <Navbar />
      <Hero />
      <MomentsStrip />
      <LazySection id="background" height={700} eager={eager}>
        <BackgroundGlobe />
      </LazySection>
      <LazySection id="work" height={900} eager={eager}>
        <FindMyWork />
      </LazySection>
      <LazySection id="numbers" height={720} eager={eager}>
        <NumbersAndStats />
      </LazySection>
      <LazySection id="research" height={640} eager={eager}>
        <Research />
      </LazySection>
      <LazySection id="skills" height={560} eager={eager}>
        <Skills />
      </LazySection>
      <LazySection id="work-experience" height={3400} eager={eager}>
        <Experience />
      </LazySection>
      <LazySection id="contact" height={720} eager={eager}>
        <ContactSection />
      </LazySection>
      <Footer />

      {/* HIBEEX sticker */}
      <div className="sticker-stage">
        {showSticker && <Suspense fallback={null}>
        <StickerPeel
          imageSrc="/hibeex.webp"
          width={130}
          rotate={-8}
          peelBackHoverPct={22}
          peelBackActivePct={35}
          initialPosition={"center" as any}
          shadowIntensity={0.45}
          lightingIntensity={0.09}
        />
        </Suspense>}
      </div>

    </main>
  );
}

export default Home;
