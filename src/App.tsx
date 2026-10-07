import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import CustomMouse from "./components/Shared/CustomMouse";
import DarkModeButton from "./components/Shared/DarkModeButton";
import HandsfreeButton from "./components/Shared/HandsfreeButton";
import BackToTop from "./components/Shared/BackToTop";
import EasterEggs from "./components/Shared/EasterEggs";
import HorizontalScroller from "./components/Shared/HorizontalScroller";
import TerminalButton from "./components/Shared/TerminalButton";
import TerminalModal from "./components/Terminal/TerminalModal";
import WindowRenderer from "./components/WindowManager/WindowRenderer";
import { useHandsfreeCamera } from "./hooks/useHandsfreeCamera";
import useIsMobile from "./hooks/useIsMobile";
import MobileStickyCTA from "./components/Shared/MobileStickyCTA";
import Home from "./pages/Home";
import {
  startMouseInputProvider,
  stopMouseInputProvider,
} from "./providers/MouseInputProvider";
import { useHandsfreeStore } from "./store/handsfreeStore";
import { useWindowManagerStore } from "./store/windowManagerStore";
import { dismissPreloader } from "./lib/preloader";

const HandsfreeUI = lazy(() => import("./components/Shared/HandsfreeUI"));
const HeroSlideshow = lazy(() => import("./components/Home/HeroSlideshow"));
const LibraryPage = lazy(() => import("./pages/Library"));
const BlogPage = lazy(() => import("./pages/Blog"));
const NewsPage = lazy(() => import("./pages/News"));
const StoryPage = lazy(() => import("./pages/Story"));
const ProjectPage = lazy(() => import("./pages/Project"));
const FilesPage = lazy(() => import("./pages/Files"));
const ContactPage = lazy(() => import("./pages/Contact"));
const ThankYouPage = lazy(() => import("./pages/ThankYou"));
const NotFoundPage = lazy(() => import("./pages/NotFound"));

function App() {
  useEffect(() => {
    dismissPreloader();
    startMouseInputProvider();
    return () => {
      stopMouseInputProvider();
    };
  }, []);

  useHandsfreeCamera();

  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isLibrary = location.pathname.startsWith("/library");
  // Páginas de leitura: sem a barra fixa de CTA no mobile (o e-mail está no rodapé).
  const isReading = isLibrary || location.pathname.startsWith("/news");

  // New page, start at the top (hash links are handled by the page itself)
  useEffect(() => {
    if (location.hash) return;
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname, location.hash]);
  const isMobile = useIsMobile();
  const handsfreeFlags = useHandsfreeStore((s) => s.isEnabled || s.showIntroModal);
  const handsfreeWindow = useWindowManagerStore((s) => !!s.windows["handsfree-intro"] || !!s.windows["gesture-tutorial"]);
  const handsfreeActive = handsfreeFlags || handsfreeWindow;
  const [tip, setTip] = useState(false);

  // Page change: the new page rises in. Not on the first paint (the loader is
  // doing the entrance) and not between books or projects (same section key).
  const reduced = useReducedMotion();
  const sectionKey = location.pathname.split("/")[1] || "home";
  const firstKey = useRef(sectionKey);
  const entering = !reduced && sectionKey !== firstKey.current;

  useEffect(() => {
    if (isMobile || window.innerWidth <= 1024 || sessionStorage.getItem("showedToast")) return;
    const show = setTimeout(() => {
      setTip(true);
      sessionStorage.setItem("showedToast", "true");
    }, 3000);
    const hide = setTimeout(() => setTip(false), 13000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, [isMobile]);

  return (
    <div className="app">
      {isHome && (
        <Suspense fallback={null}>
          <HeroSlideshow />
        </Suspense>
      )}
      {isHome && <HorizontalScroller />}
      <motion.div
        key={sectionKey}
        className="page-enter"
        initial={entering ? { opacity: 0, y: 14 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: "easeOut" }}
      >
      <Suspense fallback={!isHome ? <div style={{ width: "100%", height: "100dvh", background: "var(--bg)" }} /> : null}>
        <Routes>
          <Route path="/library/:bookId?" element={<LibraryPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/story" element={<StoryPage />} />
          <Route path="/work/:slug" element={<ProjectPage />} />
          <Route path="/files" element={<FilesPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/obrigado" element={<ThankYouPage />} />
          <Route path="/" element={<Home />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      </motion.div>
      <HandsfreeButton />
      <DarkModeButton />
      <TerminalButton />
      <TerminalModal />
      <WindowRenderer />
      {handsfreeActive && (
        <Suspense fallback={null}>
          <HandsfreeUI />
        </Suspense>
      )}
      <CustomMouse />
      <EasterEggs />
      {!isReading && <MobileStickyCTA />}
      {!isLibrary && <BackToTop />}
      {tip && isHome && (
        <button type="button" className="tip-toast" onClick={() => setTip(false)}>
          Just for fun, try pressing Ctrl + K!
        </button>
      )}
    </div>
  );
}

export default App;
