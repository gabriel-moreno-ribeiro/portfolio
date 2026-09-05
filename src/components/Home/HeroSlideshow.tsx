import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';

const SLIDE_DURATION = 6000;
const FADE_DISTANCE = 400;

const SLIDES: string[] = [
  '/assets/hero-slideshow/1.avif',
  '/assets/hero-slideshow/3.avif',
  '/assets/hero-slideshow/4.avif',
  '/assets/hero-slideshow/6.avif',
  '/assets/hero-slideshow/7.avif',
  '/assets/hero-slideshow/8.avif',
];

const skipSlideshow = typeof window !== 'undefined' && window.innerWidth < 768;

function HeroSlideshow() {
  const [index, setIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  const rafRef = useRef(0);

  const advance = useCallback(() => {
    isFirstRender.current = false;
    setIndex(prev => (prev + 1) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (SLIDES.length < 2) return;
    const timer = setInterval(advance, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [advance]);

  // Warm the next slide so the crossfade never waits on the network
  useEffect(() => {
    new Image().src = SLIDES[(index + 1) % SLIDES.length];
  }, [index]);

  useEffect(() => {
    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const el = rootRef.current;
        if (!el) return;
        const opacity = Math.max(0, 1 - window.scrollY / FADE_DISTANCE);
        el.style.opacity = String(opacity);
        el.style.visibility = opacity === 0 ? 'hidden' : '';
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (SLIDES.length === 0 || skipSlideshow) return null;

  return (
    <div ref={rootRef} className="hero-slideshow">
      <AnimatePresence mode="popLayout">
        <motion.img
          key={SLIDES[index]}
          src={SLIDES[index]}
          alt=""
          className="hero-slideshow__img"
          initial={isFirstRender.current ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
          draggable={false}
          decoding="async"
        />
      </AnimatePresence>
    </div>
  );
}

export default HeroSlideshow;
