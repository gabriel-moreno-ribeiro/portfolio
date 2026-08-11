import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';

const SLIDE_DURATION = 6000;

const SLIDES: string[] = [
  // Add photos/videos here — paths relative to public/
  // e.g. '/assets/hero-slideshow/salvador-01.jpg'
];

function HeroSlideshow() {
  const [index, setIndex] = useState(0);

  const advance = useCallback(() => {
    setIndex(prev => (prev + 1) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (SLIDES.length < 2) return;
    const timer = setInterval(advance, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [advance]);

  if (SLIDES.length === 0) return null;

  return (
    <div className="hero-slideshow">
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
