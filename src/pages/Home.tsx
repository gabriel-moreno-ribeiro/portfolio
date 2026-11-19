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
const Wardrobe = lazy(() => import("../components/Home/Wardrobe").then((m) => ({ default: m.Wardrobe })));
const FindMyWork = lazy(() => import("../components/Home/FindMyWork"));
const Research = lazy(() => import("../components/Home/Research"));
const Experience = lazy(() => import("../components/Home/Experience/Experience"));
const ContactSection = lazy(() => import("../components/Home/ContactSection"));
// @ts-ignore
const StickerPeel = lazy(() => import("../components/ReactBits/StickerPeel"));

// "Experience" (not "Professional Experience"): the longest label must fit the 194px gutter left of the content column at 1440.
const SECTIONS = [
  { id: 'main-content', label: 'Top' },
  { id: 'background', label: 'Origins' },
  { id: 'wardrobe', label: 'Wardrobe' },
  { id: 'work', label: 'Cool Things' },
  { id: 'research', label: 'Research' },
  { id: 'skills', label: 'Skills' },
  { id: 'work-experience', label: 'Experience' },
  { id: 'contact', label: 'Contact' },
];

// Heights measured at 1440, 768 and 390 (desktop, tablet, phone). Close enough
// that swapping the box for the real section barely moves what's below; the
// tablet column matters most, because a deep link to #contact mounts everything
// above it at once.
const RESERVE: Record<string, [desktop: number, tablet: number, mobile: number]> = {
  background: [959, 1384, 936],
  wardrobe: [600, 518, 516],
  work: [3664, 5207, 4224],
  research: [2467, 3245, 4081],
  skills: [1000, 1000, 496],
  'work-experience': [5707, 6147, 2931],
  contact: [386, 783, 872],
};
const LAZY_IDS = new Set(Object.keys(RESERVE));

// Gap left above a section reached through a URL hash or the rail (clears the navbar).
const HASH_OFFSET = 90;
// pointerdown: a drag on the scroll bar (no wheel event) must also hand the page back to the visitor.
const STOP_EVENTS = ['wheel', 'touchstart', 'keydown', 'pointerdown'];

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
  const tablet = useIsMobile(900);
  const height = RESERVE[id][mobile ? 2 : tablet ? 1 : 0];
  const placeholder = <Reserve id={id} label={label} height={height} />;
  return (
    <div ref={ref}>
      {eager || near ? <Suspense fallback={placeholder}>{children}</Suspense> : placeholder}
    </div>
  );
}

function Home() {
  // The clay 3D stories in Cool Things need three.js and their scenes (~1 MB). Fetch them
  // once the page is idle on desktops that will play them, so they start as soon as they scroll in.
  useEffect(() => {
    const plays = matchMedia('(min-width: 900px) and (hover: hover) and (prefers-reduced-motion: no-preference)').matches;
    if (!plays) return;
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 2000));
    const id = idle(() => { import('../components/Home/Clay/ClayStage').catch(() => {}); });
    return () => (window.cancelIdleCallback ?? window.clearTimeout)(id);
  }, []);
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
    let timer = 0;
    let pending: (() => void) | null = null;
    const onNavigate = (e: Event) => {
      const { id, offset } = (e as CustomEvent<NavigateDetail>).detail;
      // Any new navigation cancels a re-alignment still running for the previous target.
      stopAlign.current();
      clearTimeout(timer);
      if (pending) window.removeEventListener('scrollend', pending);
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
      pending = begin;
      window.addEventListener('scrollend', begin, { once: true });
      timer = window.setTimeout(begin, 1200); // browsers without scrollend
    };
    window.addEventListener(NAVIGATE_EVENT, onNavigate);
    // Leaving the page (or a rail click within 1.2 s of leaving) must not keep
    // a scroll loop alive for the next visit.
    return () => {
      window.removeEventListener(NAVIGATE_EVENT, onNavigate);
      clearTimeout(timer);
      if (pending) window.removeEventListener('scrollend', pending);
      stopAlign.current();
    };
  }, [alignTo]);

  useEffect(() => {
    if (mountAll) return;
    // Tab only: arrow keys and Space scroll, and scrolling mounts sections as they come.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') setMountAll(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mountAll]);

  // The peelable sticker is a toy (and pulls GSAP): it waits for the first
  // interaction, or 6 s, instead of competing with the hero for the main thread.
  const [showSticker, setShowSticker] = useState(false);
  // No mobile o sticker fica 0x0 escondido: nem monta (evita 600 ms de módulo no meio da rolagem).
  // Below 1200px there is no left gutter, so the sticker would sit on the content.
  const stickerMobile = useIsMobile(1200);
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
      <LazySection id="wardrobe" label="What I wore, growing up" eager={mountAll}>
        <Wardrobe id="wardrobe" />
      </LazySection>
      <LazySection id="work" label="Cool things" eager={mountAll}>
        <FindMyWork />
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
