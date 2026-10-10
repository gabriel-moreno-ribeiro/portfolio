import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Hero from "../components/Home/Hero";
import MomentsStrip from "../components/Home/MomentsStrip";
import SectionRail from "../components/Home/SectionRail";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Shared/Footer";
import useIsMobile from "../hooks/useIsMobile";
import { useVisible } from "../lib/motion";
import { NAVIGATE_EVENT, type NavigateDetail } from "../utils/scrollToComponent";

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

// Heights measured at 1440 and 390 after the October rebuild (city tour with a
// fixed text height, Skills without canvas). Close enough that swapping the box
// for the real section barely moves what's below.
const RESERVE: Record<string, [desktop: number, mobile: number]> = {
  background: [955, 975],
  work: [2250, 2350],
  numbers: [460, 240],
  research: [1120, 1640],
  skills: [1000, 525],
  'work-experience': [2450, 2250],
  contact: [480, 872],
};
const LAZY_IDS = new Set(Object.keys(RESERVE));

// Gap left above a section reached through a URL hash or the rail (clears the navbar).
const HASH_OFFSET = 90;
const STOP_EVENTS = ['wheel', 'touchstart', 'keydown'];

// Placeholder for a section that hasn't mounted (or is still downloading).
// It carries the section id, so the rail, hash links and the active-section
// probe find it, and a hidden heading so a screen reader knows what's there.
function Reserve({ id, label, height }: { id: string; label: string; height: number }) {
  return (
    <div id={id} style={{ minHeight: height }}>
      <h2 className="sr-only">{label}</h2>
    </div>
  );
}

// A section below the fold only mounts (and only downloads its chunk) once
// its reserved box comes within half a viewport of the screen. Mounting the
// whole page at load was the single biggest cost on the main thread.
function LazySection({ id, label, eager, children }: { id: string; label: string; eager: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const near = useVisible(ref, { rootMargin: '50% 0px', once: true });
  const mobile = useIsMobile(600);
  const height = RESERVE[id][mobile ? 1 : 0];
  const placeholder = <Reserve id={id} label={label} height={height} />;
  return (
    <div ref={ref}>
      {eager || near ? <Suspense fallback={placeholder}>{children}</Suspense> : placeholder}
    </div>
  );
}

function Home() {
  const location = useLocation();
  // Everything mounts at once for a deep link, the first keypress (so Tab
  // reaches the whole page) and any in-page navigation.
  const [mountAll, setMountAll] = useState(() => location.hash.length > 1);
  const stopAlign = useRef<() => void>(() => {});

  // Keep re-aligning (instantly) to a target whose position drifts while the
  // sections above it load, until the layout settles or the visitor takes over.
  const alignTo = useCallback((id: string, offset: number) => {
    stopAlign.current();
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
        const drift = el.getBoundingClientRect().top - offset;
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
    stopAlign.current = stop;
    return stop;
  }, []);

  // /#contact (and the old /contact URL).
  useEffect(() => {
    const id = location.hash.slice(1);
    if (!id) return;
    setMountAll(true);
    return alignTo(id, HASH_OFFSET);
  }, [location.hash, location.key, alignTo]);

  // Rail clicks and "See Work": mount everything, scroll smoothly to where the
  // target is now, then correct the drift once the smooth scroll has ended.
  useEffect(() => {
    const onNavigate = (e: Event) => {
      const { id, offset } = (e as CustomEvent<NavigateDetail>).detail;
      // Any new navigation cancels a re-alignment still running for the previous target.
      stopAlign.current();
      if (!LAZY_IDS.has(id)) return;
      e.preventDefault();
      setMountAll(true);
      const el = document.getElementById(id);
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
      let started = false;
      const begin = () => {
        if (started) return;
        started = true;
        window.removeEventListener('scrollend', begin);
        alignTo(id, offset);
      };
      window.addEventListener('scrollend', begin, { once: true });
      window.setTimeout(begin, 1200); // browsers without scrollend
    };
    window.addEventListener(NAVIGATE_EVENT, onNavigate);
    return () => window.removeEventListener(NAVIGATE_EVENT, onNavigate);
  }, [alignTo]);

  useEffect(() => {
    if (mountAll) return;
    const onKey = () => setMountAll(true);
    window.addEventListener('keydown', onKey, { once: true });
    return () => window.removeEventListener('keydown', onKey);
  }, [mountAll]);

  // The peelable sticker is a toy (and pulls GSAP): it waits for the first
  // interaction, or 6 s, instead of competing with the hero for the main thread.
  const [showSticker, setShowSticker] = useState(false);
  // No mobile o sticker fica 0x0 escondido: nem monta (evita 600 ms de módulo no meio da rolagem).
  const stickerMobile = useIsMobile(600);
  useEffect(() => {
    const events = ['pointermove', 'keydown', 'touchstart', 'scroll'];
    const show = () => {
      // Depois da interação, ainda espera a thread ficar ociosa: o módulo do sticker
      // (GSAP) não pode cair no meio de um frame de rolagem.
      const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
      if (idle) idle(() => setShowSticker(true), { timeout: 3000 }); else setTimeout(() => setShowSticker(true), 800);
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

  return (
    <main className="home-wrapper" id="main-content">
      <SectionRail sections={SECTIONS} />

      <Navbar />
      <Hero />
      <MomentsStrip />
      <LazySection id="background" label="Where I come from" eager={mountAll}>
        <BackgroundGlobe />
      </LazySection>
      <LazySection id="work" label="Cool things" eager={mountAll}>
        <FindMyWork />
      </LazySection>
      <LazySection id="numbers" label="By the numbers" eager={mountAll}>
        <NumbersAndStats />
      </LazySection>
      <LazySection id="research" label="Research" eager={mountAll}>
        <Research />
      </LazySection>
      <LazySection id="skills" label="Skills" eager={mountAll}>
        <Skills />
      </LazySection>
      <LazySection id="work-experience" label="Professional experience" eager={mountAll}>
        <Experience />
      </LazySection>
      <LazySection id="contact" label="Contact" eager={mountAll}>
        <ContactSection />
      </LazySection>
      <Footer />

      {/* HIBEEX sticker */}
      <div className="sticker-stage">
        {showSticker && !stickerMobile && <Suspense fallback={null}>
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
