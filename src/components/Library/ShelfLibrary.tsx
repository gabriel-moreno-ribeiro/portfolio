// React shell for the shelf engine. Structure adapted from ProgressLibrary.tsx in
// "The Complete Shelf" (github.com/kabarza/bookshelf); styling follows the site.
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FiArrowLeft, FiArrowRight, FiArrowUpRight } from "react-icons/fi";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import { useReducedMotion } from "../../lib/motion";
import { useThemeStore } from "../../store/themeStore";
import type { Book } from "../../types/book";
import IndexDrawer from "./IndexDrawer";
import { ages, books, catalog, periodText, stars } from "./shelf/catalog";
import type { ShelfEngine, ShelfMode } from "./shelf/ShelfEngine";
import { siteConfig } from "./shelf/site-config";
import "../../styles/components/library/library.scss";

const pad = (n: number) => String(n).padStart(2, "0");
const EASE = [0.22, 1, 0.36, 1] as const;
const NO_WEBGL = "The 3D shelf needs WebGL. Use All books for the full list.";
const LAST = catalog.length - 1;
const clampIndex = (i: number) => Math.min(LAST, Math.max(0, i));

// "Read at 7, a favorite · 2014 to 2015": the favorite is one italic word in the line, not a tag
function ReadLine({ book: b }: { book: Book }) {
  const fav = b.favorite ? <>, <em>a favorite</em></> : null;
  if (b.status !== "reading") return <>Read at {b.readAge}{fav} · {periodText(b.readPeriod)}</>;
  const progress = b.progress > 0 && b.progress < 100 && b.pages ? ` · ${b.progress}% of ${b.pages} pages` : "";
  return <>Reading now{fav}{progress}</>;
}
const firstSentence = (text?: string) => (text ? text.match(/^(.+?[.!?])(\s|$)/)?.[1] ?? text : "");

// Ruler bars: 4px for one book up to 18px for the busiest age
const MAX_COUNT = Math.max(...ages.map((a) => a.count));
const barHeight = (count: number) => 4 + ((count - 1) / Math.max(1, MAX_COUNT - 1)) * 14;
const bookCount = (n: number) => `${n} ${n === 1 ? "book" : "books"}`;
const readableAges = ages.filter((a) => a.count > 0);

// Where the browse camera puts the plank (same numbers as ShelfEngine.handleResize),
// so the placeholder sits where the 3D shelf will fade in
function shelfBand(w: number, hFull: number, band: number, footer: number) {
  const h = Math.max(1, hFull - band - footer);
  const phone = w < 760;
  const cy = phone ? 1.5 : 1.42;
  const cz = phone ? 5.6 : 6.65;
  const ty = phone ? 1.0 : 1.28;
  const tan = Math.tan(((w < 600 ? 33 : w < 920 ? 30 : 27) * Math.PI) / 360);
  let a = ty - cy;
  let b = 0.15 - cz;
  const len = Math.hypot(a, b);
  a /= len;
  b /= len;
  const y = (py: number, pz: number) => {
    const vy = py - cy;
    const vz = pz - cz;
    return Math.round(((1 - (vy * -b + vz * a) / (vy * a + vz * b) / tan) / 2) * h);
  };
  return { top: band + y(0.31, -0.86), edge: band + y(0.32, 0.93), bottom: band + y(0.09, 0.86) };
}

// --lib-top / --lib-bottom: the bands the shelf stays clear of (see library.scss)
function pageBand(el: HTMLElement | null, name: string) {
  const v = el ? parseFloat(getComputedStyle(el).getPropertyValue(name)) : 0;
  return Number.isFinite(v) ? v : 0;
}

export default function ShelfLibrary() {
  const { bookId } = useParams<{ bookId?: string }>();
  const navigate = useNavigate();
  const { darkMode } = useThemeStore();
  const reduced = useReducedMotion();
  const mainRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ShelfEngine | null>(null);
  const themeRef = useRef<"light" | "dark">(darkMode ? "dark" : "light");
  const openerRef = useRef<HTMLElement | null>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const ageRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const initialIndex = useRef(Math.max(0, catalog.findIndex((b) => b.id === bookId))).current;
  const deepLinked = useRef(Boolean(bookId)).current;
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const activeRef = useRef(activeIndex);
  activeRef.current = activeIndex;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [mode, setMode] = useState<ShelfMode>("browse");
  const [ready, setReady] = useState(false);
  const [no3d, setNo3d] = useState(false);
  const [indexOpen, setIndexOpen] = useState(false);
  const [status, setStatus] = useState("Loading the shelf");
  const [rovingAge, setRovingAge] = useState<number | null>(null);
  const [band, setBand] = useState(() => shelfBand(window.innerWidth, window.innerHeight, window.innerWidth < 760 ? 124 : 96, window.innerWidth < 760 ? 270 : 0));

  const activeBook = catalog[activeIndex];
  const activeMeta = books[activeIndex];
  const activeAge = activeMeta.readAge;
  const review = firstSentence(activeMeta.review);
  const selectedBook = useMemo(() => (selectedIndex === null ? null : catalog[selectedIndex]), [selectedIndex]);
  const selectedMeta = selectedIndex === null ? null : books[selectedIndex];
  const isFocused = mode !== "browse";
  const tabAge = rovingAge ?? activeAge;

  // Before the engine exists (loading, or no WebGL) the card and ruler run on the data alone
  const goTo = (index: number, snap = false) => {
    const engine = engineRef.current;
    if (engine) {
      // snapTo reports the new book synchronously, so the card never waits on a frame
      if (snap) engine.snapTo(index);
      else engine.browseTo(index);
    } else {
      setActiveIndex(clampIndex(index));
    }
  };
  // The engine steps from where the shelf is heading, so held arrow keys keep moving
  const goBy = (step: number) => {
    if (engineRef.current) engineRef.current.browseBy(step);
    else setActiveIndex((i) => clampIndex(i + step));
  };

  const openIndex = (e: React.MouseEvent<HTMLButtonElement>) => {
    openerRef.current = e.currentTarget;
    setIndexOpen(true);
  };
  const closeIndex = () => {
    setIndexOpen(false);
    openerRef.current?.focus({ preventScroll: true });
  };

  // Engine lifecycle. The engine (and three.js) load after the page, so the card shows first.
  useEffect(() => {
    let cancelled = false;
    let engine: ShelfEngine | null = null;

    async function start() {
      if (!canvasRef.current) return;

      // No WebGL, or an engine that fails to build: the list takes over
      const fallBack = () => {
        setNo3d(true);
        setStatus(NO_WEBGL);
        setIndexOpen(true);
      };
      const probe = document.createElement("canvas");
      const gl = probe.getContext("webgl2") || probe.getContext("webgl");
      if (!gl) { fallBack(); return; }
      gl.getExtension("WEBGL_lose_context")?.loseContext();

      let Engine: typeof ShelfEngine;
      try {
        [{ ShelfEngine: Engine }] = await Promise.all([import("./shelf/ShelfEngine"), document.fonts.ready]);
      } catch (err) {
        console.error(err);
        if (!cancelled) fallBack();
        return;
      }
      if (cancelled || !canvasRef.current) return;

      try {
        engine = new Engine(canvasRef.current, catalog, {
          onActiveIndex: setActiveIndex,
          onMode: (nextMode, index) => {
            setMode(nextMode);
            setSelectedIndex(index);
            // The "Open it" button disables under the keyboard; land on the way back.
            if (nextMode === "inspect") requestAnimationFrame(() => backRef.current?.focus({ preventScroll: true }));
          },
          onStatus: setStatus,
          onReady: () => {
            setReady(true);
            setStatus(`${catalog.length} books`);
          },
        });
      } catch (err) {
        console.error(err);
        fallBack();
        return;
      }
      engine.setTheme(themeRef.current);
      engineRef.current = engine;
      // Whatever the card shows (deep link, or browsing while it loaded) is where the shelf opens
      const start = activeRef.current;
      if (start > 0) engine.snapTo(start);
      if (bookId) engine.focusBook(start);
    }

    void start();
    return () => {
      cancelled = true;
      engine?.dispose();
      engineRef.current = null;
    };
    // The engine owns navigation after mount; the URL only seeds the first book.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The placeholder plank follows the viewport until the shelf is up
  useEffect(() => {
    if (ready || no3d) return;
    const onResize = () => {
      const el = mainRef.current;
      if (el) setBand(shelfBand(el.clientWidth, el.clientHeight, pageBand(el, "--lib-top"), pageBand(el, "--lib-bottom")));
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [ready, no3d]);

  // Scene palette follows the site theme
  useEffect(() => {
    themeRef.current = darkMode ? "dark" : "light";
    engineRef.current?.setTheme(themeRef.current);
  }, [darkMode]);

  // URL + title follow the engine
  useEffect(() => {
    if (isFocused && selectedBook) {
      document.title = `${selectedBook.title} · Library`;
      navigate(`/library/${selectedBook.id}`, { replace: true });
    } else {
      document.title = siteConfig.title;
      navigate("/library", { replace: true });
    }
  }, [isFocused, selectedBook, navigate]);

  // Keyboard works without focusing the canvas first
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t === canvasRef.current || t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) return;
      if (indexOpen) {
        if (e.key === "Escape") closeIndex();
        return;
      }
      const engine = engineRef.current;
      if (engine && e.key === "Escape") engine.returnToShelf();
      else if (engine && isFocused) return;
      else if (e.key === "ArrowRight") { e.preventDefault(); goBy(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); goBy(-1); }
      else if (e.key === "Home") { e.preventDefault(); goTo(0, true); }
      else if (e.key === "End") { e.preventDefault(); goTo(LAST, true); }
      // Enter on a button or link is that control's click, not "open the book"
      else if (engine && e.key === "Enter" && !t?.closest("button, a, summary")) engine.focusBook();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // goTo, goBy and closeIndex only touch stable refs and setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indexOpen, isFocused]);

  // The ruler is one tab stop: arrows move between ages, Enter or click goes to that age
  const onRulerKey = (e: React.KeyboardEvent) => {
    const at = readableAges.findIndex((a) => a.age === tabAge);
    let next = -1;
    if (e.key === "ArrowRight") next = Math.min(readableAges.length - 1, at + 1);
    else if (e.key === "ArrowLeft") next = Math.max(0, at - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = readableAges.length - 1;
    if (next < 0) return;
    e.preventDefault();
    e.stopPropagation();
    const age = readableAges[next].age;
    setRovingAge(age);
    ageRefs.current[ages.findIndex((a) => a.age === age)]?.focus();
  };

  const cardMotion = reduced
    ? { initial: false as const, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, transition: { duration: 0 } }, transition: { duration: 0 } }
    : { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 }, transition: { duration: 0.25, ease: EASE } };

  return (
    <main
      ref={mainRef}
      className={`library ${ready ? "library--ready" : ""} ${isFocused ? "library--focused" : ""} ${no3d ? "library--no3d" : ""}`}
      id="main-content"
    >
      <div
        className="library__stage"
        aria-hidden="true"
        style={{ "--shelf-top": `${band.top}px`, "--shelf-edge": `${band.edge}px`, "--shelf-bottom": `${band.bottom}px` } as React.CSSProperties}
      />
      <canvas
        ref={canvasRef}
        className="library__canvas"
        role="application"
        tabIndex={0}
        data-drag-me={true}
        aria-label={`A shelf of ${catalog.length} books. Drag or use the arrow keys to browse. Press Enter to open the selected book.`}
      />
      {/* Fades the scene under the caption, so the words sit on a calm field
          instead of on spines and wood */}
      <div className="library__veil" aria-hidden="true" />

      <div className="library__nav">
        <Navbar />
      </div>

      <div className="library__eyebrow">
        <div className="library__crumb">
          <Link to="/" className="page-back"><FiArrowLeft aria-hidden="true" /> Home</Link>
          <h1 className="library__name">Library.</h1>
          <button type="button" className="library__textlink library__index-toggle" onClick={openIndex} disabled={isFocused} aria-haspopup="dialog" aria-expanded={indexOpen}>
            <span>All books</span>
          </button>
        </div>
        <p className="sr-only" role="status" aria-live="polite">{status}</p>
      </div>

      <section className="library__caption" aria-hidden={isFocused} aria-live="polite">
        <AnimatePresence initial={false}>
          <motion.div key={activeBook.id} className="library__caption-body" {...cardMotion}>
            {/* Each line sits on its own strip of paper, so the books show between the lines */}
            <h2 className="library__title"><span className="library__ink">{activeBook.title}</span></h2>
            <p className="library__author"><span className="library__ink">{activeBook.author}</span></p>
            <p className="library__read"><span className="library__ink"><ReadLine book={activeMeta} /></span></p>
            {review && <p className="library__review"><span className="library__ink">“{review}”</span></p>}
            {!no3d && (
              <button
                type="button"
                className="library__inspect"
                disabled={isFocused || !ready}
                onClick={() => engineRef.current?.focusBook(activeIndex)}
                aria-label={`Open ${activeBook.title}`}
              >
                Open it
                <FiArrowUpRight aria-hidden="true" />
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      <button type="button" className="library__arrow library__arrow--left" aria-label="Previous book" disabled={isFocused || activeIndex === 0} onClick={() => goBy(-1)}>
        <FiArrowLeft />
      </button>
      <button type="button" className="library__arrow library__arrow--right" aria-label="Next book" disabled={isFocused || activeIndex === LAST} onClick={() => goBy(1)}>
        <FiArrowRight />
      </button>
      <button type="button" className="library__textlink library__index-toggle library__index-toggle--float" onClick={openIndex} disabled={isFocused} aria-haspopup="dialog" aria-expanded={indexOpen}>
        <span>All books</span>
      </button>

      <nav className="library__index-bar" aria-label="Books by reading age">
        <div
          className="library__ages"
          role="toolbar"
          aria-label="Reading age"
          onKeyDown={onRulerKey}
          onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setRovingAge(null); }}
        >
          {ages.map(({ age, start, count }, i) =>
            count === 0 ? (
              <span key={age} className="library__age is-empty" aria-hidden="true">
                <span />
                <span className="library__age-label">{age}</span>
              </span>
            ) : (
              <button
                key={age}
                ref={(el) => { ageRefs.current[i] = el; }}
                type="button"
                className={`library__age ${age === activeAge ? "is-active" : ""}`}
                tabIndex={age === tabAge ? 0 : -1}
                aria-label={`Age ${age}, ${bookCount(count)}`}
                aria-current={age === activeAge ? "true" : undefined}
                disabled={isFocused}
                onFocus={() => setRovingAge(age)}
                onClick={() => goTo(start, true)}
              >
                <span className="library__age-bar" style={{ height: barHeight(count) }} />
                <span className="library__age-label">{age}</span>
                <span className="library__age-tip" aria-hidden="true">age {age} · {bookCount(count)}</span>
              </button>
            ),
          )}
        </div>
      </nav>

      <aside className="library__panel" aria-hidden={!isFocused} aria-label={selectedBook ? `Details for ${selectedBook.title}` : "Book details"}>
        {selectedBook && selectedMeta ? (
          <div className="library__panel-inner">
            <div className="library__panel-top">
              <button type="button" ref={backRef} className="library__pill library__back" onClick={() => engineRef.current?.returnToShelf()}>
                <FiArrowLeft aria-hidden="true" />
                Back to the shelf
              </button>
              <p className="library__panel-pos">
                {pad(selectedIndex! + 1)} / {pad(catalog.length)}
              </p>
            </div>

            <motion.div
              key={selectedBook.id}
              className="library__panel-copy"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE, delay: 0.12 }}
            >
              <h2 className="library__panel-title">{selectedBook.title}</h2>
              <p className="library__panel-author">{selectedBook.author}</p>
              <p className="library__panel-desc">{selectedBook.description}</p>

              {selectedBook.quote && (
                <blockquote className="library__quote">
                  <p>“{selectedBook.quote}”</p>
                  <cite>{selectedBook.quoteBy}</cite>
                </blockquote>
              )}

              <dl className="library__facts">
                <div>
                  <dt>Edition</dt>
                  <dd>{selectedBook.format}</dd>
                </div>
                <div>
                  <dt>Read</dt>
                  <dd>{selectedBook.availability}</dd>
                </div>
                <div>
                  <dt>Rating</dt>
                  <dd className="library__stars" aria-label={`${selectedMeta.rating ?? 0} out of 5`}>{stars(selectedMeta.rating)}</dd>
                </div>
                {selectedMeta.tags.length > 0 && (
                  <div>
                    <dt>Tags</dt>
                    <dd className="library__tags">
                      {selectedMeta.tags.map((t) => <span key={t}>{t}</span>)}
                    </dd>
                  </div>
                )}
              </dl>

              {selectedBook.url && (
                <a className="library__pill library__link" href={selectedBook.url} target="_blank" rel="noreferrer">
                  {selectedBook.linkLabel ?? siteConfig.bookLinkLabel}
                  <FiArrowUpRight aria-hidden="true" />
                </a>
              )}
            </motion.div>

            <div className="library__controls" aria-label="Inspection controls">
              <span>Drag to turn it</span>
              <span>Scroll to zoom</span>
              <button type="button" onClick={() => engineRef.current?.resetFocusView()}>Reset view</button>
            </div>
          </div>
        ) : null}
      </aside>

      <p className="library__credit">
        Shelf engine adapted from{" "}
        <a href="https://github.com/kabarza/bookshelf" target="_blank" rel="noreferrer">The Complete Shelf</a>
      </p>

      <div className={`library__scrim ${indexOpen ? "is-open" : ""}`} onClick={closeIndex} />
      <IndexDrawer
        open={indexOpen}
        fallback={no3d}
        activeIndex={activeIndex}
        expandIndex={deepLinked ? initialIndex : null}
        onClose={closeIndex}
        onBrowse={(index) => {
          goTo(index, true);
          if (!no3d) closeIndex();
        }}
        onOpen={(index) => {
          if (engineRef.current && ready) engineRef.current.focusBook(index);
          else goTo(index, true);
          closeIndex();
        }}
      />
    </main>
  );
}
