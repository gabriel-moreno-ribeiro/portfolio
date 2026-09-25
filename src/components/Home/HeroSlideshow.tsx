import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePageVisible, useReducedMotion } from '../../lib/motion';

const SLIDE_DURATION = 6000;
const FADE_DISTANCE = 400;
// Parallax: the fixed backdrop lags the page by at most 40px over the first 600px.
const PARALLAX_DISTANCE = 600;
const PARALLAX_MAX = 40;

const SLIDES: string[] = [
  '/assets/hero-slideshow/1-1920.avif',
  '/assets/hero-slideshow/3-1920.avif',
  '/assets/hero-slideshow/4-1920.avif',
  '/assets/hero-slideshow/6-1920.avif',
  '/assets/hero-slideshow/7-1920.avif',
  '/assets/hero-slideshow/8-1920.avif',
];

const skipSlideshow = typeof window !== 'undefined' && window.innerWidth < 768;

function HeroSlideshow() {
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotion();
  const pageVisible = usePageVisible();
  // The backdrop is faded out past FADE_DISTANCE; below that there is nothing to see.
  const [onScreen, setOnScreen] = useState(
    () => typeof window === 'undefined' || window.scrollY < FADE_DISTANCE,
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  const rafRef = useRef(0);

  const advance = useCallback(() => {
    isFirstRender.current = false;
    setIndex(prev => (prev + 1) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (skipSlideshow || SLIDES.length < 2 || reduced || !pageVisible || !onScreen) return;
    const timer = setInterval(advance, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [advance, reduced, pageVisible, onScreen]);

  // Warm the next slide so the crossfade never waits on the network.
  // Below 768px there is no slideshow at all, so nothing is fetched: these are
  // 1920px-wide desktop stills and a phone was downloading them for nothing.
  useEffect(() => {
    if (skipSlideshow || reduced) return;
    new Image().src = SLIDES[(index + 1) % SLIDES.length];
  }, [index, reduced]);

  useEffect(() => {
    if (skipSlideshow) return;
    const apply = () => {
      rafRef.current = 0;
      const el = rootRef.current;
      if (!el) return;
      const y = window.scrollY;
      const opacity = Math.max(0, 1 - y / FADE_DISTANCE);
      el.style.opacity = String(opacity);
      el.style.visibility = opacity === 0 ? 'hidden' : '';
      setOnScreen(opacity > 0);
      if (layerRef.current) {
        const shift = reduced
          ? 0
          : Math.min(1, y / PARALLAX_DISTANCE) * PARALLAX_MAX;
        layerRef.current.style.transform = `translate3d(0, ${-shift}px, 0)`;
      }
    };
    const onScroll = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [reduced]);

  if (SLIDES.length === 0 || skipSlideshow) return null;

  return (
    <div ref={rootRef} className="hero-slideshow">
      <div
        ref={layerRef}
        style={{ position: 'absolute', inset: 0, willChange: 'transform' }}
      >
        <AnimatePresence mode="popLayout">
          <motion.img
            key={SLIDES[index]}
            src={SLIDES[index]}
            alt=""
            width={1920}
            height={1080}
            className="hero-slideshow__img"
            initial={isFirstRender.current || reduced ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 1.5, ease: 'easeInOut' }}
            draggable={false}
            decoding="async"
          />
        </AnimatePresence>
      </div>
    </div>
  );
}

export default HeroSlideshow;
