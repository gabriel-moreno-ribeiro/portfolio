import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';

const SLIDE_DURATION = 6000;
const FADE_DISTANCE = 400;

const SLIDES: string[] = [
  '/assets/hero-slideshow/1.avif',
  '/assets/hero-slideshow/2.avif',
  '/assets/hero-slideshow/3.avif',
  '/assets/hero-slideshow/4.avif',
  '/assets/hero-slideshow/5.avif',
  '/assets/hero-slideshow/6.avif',
  '/assets/hero-slideshow/7.avif',
  '/assets/hero-slideshow/8.avif',
];

function HeroSlideshow() {
  const [index, setIndex] = useState(0);
  const [scrollOpacity, setScrollOpacity] = useState(1);
  const rafRef = useRef(0);

  const advance = useCallback(() => {
    setIndex(prev => (prev + 1) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (SLIDES.length < 2) return;
    const timer = setInterval(advance, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [advance]);

  useEffect(() => {
    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const y = window.scrollY;
        const opacity = Math.max(0, 1 - y / FADE_DISTANCE);
        setScrollOpacity(opacity);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (SLIDES.length === 0) return null;

  return (
    <div
      className="hero-slideshow"
      style={{ opacity: scrollOpacity, visibility: scrollOpacity === 0 ? 'hidden' : undefined }}
    >
      <AnimatePresence mode="popLayout">
        <motion.img
          key={SLIDES[index]}
          src={SLIDES[index]}
          alt=""
          className="hero-slideshow__img"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
          draggable={false}
        />
      </AnimatePresence>
    </div>
  );
}

export default HeroSlideshow;
