import { lazy, Suspense, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Hero from "../components/Home/Hero";
import MomentsStrip from "../components/Home/MomentsStrip";
import SectionRail from "../components/Home/SectionRail";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Shared/Footer";
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

function Home() {
  const location = useLocation();

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
      <Suspense fallback={<Reserve height={700} />}>
        <BackgroundGlobe />
      </Suspense>
      <Suspense fallback={<Reserve height={900} />}>
        <FindMyWork />
      </Suspense>
      <Suspense fallback={<Reserve height={720} />}>
        <NumbersAndStats />
      </Suspense>
      <Suspense fallback={<Reserve height={640} />}>
        <Research />
      </Suspense>
      <Suspense fallback={<Reserve height={560} />}>
        <Skills />
      </Suspense>
      <Suspense fallback={<Reserve height={3400} />}>
        <Experience />
      </Suspense>
      <Suspense fallback={<Reserve height={720} />}>
        <ContactSection />
      </Suspense>
      <Footer />

      {/* HIBEEX sticker */}
      <div className="sticker-stage">
        <Suspense fallback={null}>
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
        </Suspense>
      </div>

    </main>
  );
}

export default Home;
