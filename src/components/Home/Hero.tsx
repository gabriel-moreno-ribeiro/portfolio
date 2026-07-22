import { motion } from 'motion/react';
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { FiArrowRight, FiLink } from 'react-icons/fi';
import useIsMobile from '../../hooks/useIsMobile';
import { scrollToComponent } from '../../utils/scrollToComponent';
import CommonButton from '../Shared/CommonButton';
import HoverSwapText from '../Shared/HoverSwapText';
import ScrambleText from '../Shared/ScrambleText';

const CanvasComponent = lazy(() => import('../Canvas/CanvasComponent'));

// Delay before content starts appearing (lets background settle first)
const BG_SETTLE_DELAY = 0.7;

const bottomTexts = [
  `Gabriel is the Co-Founder & CEO of <span class="black"> HIBEEX </span> — building financial AI for SMBs.`,
  `He has won <span class="black"> 39 olympiad medals </span> (19 gold) across math, physics, chemistry, and more.`,
  `Admitted to <span class="black"> University of St Andrews </span> with a Global Merit Scholarship for CS & Economics.`,
  `Selected for <span class="black"> Fundacao Estudar PREP </span> — 70 of 10,000+ applicants (0.7% acceptance).`,
];

function Hero() {
  const isMobile = useIsMobile();
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [showRobot, setShowRobot] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const mountTimeRef = useRef(Date.now());

  const handleRobotReady = useCallback(() => {
    // Wait for at least BG_SETTLE_DELAY after mount so background has settled,
    // then wait one extra frame so the canvas has actually painted
    const elapsed = Date.now() - mountTimeRef.current;
    const remaining = Math.max(0, BG_SETTLE_DELAY * 1000 - elapsed);
    setTimeout(() => {
      requestAnimationFrame(() => setShowRobot(true));
    }, remaining);
  }, []);

  // Mark intro as done after all elements have faded in
  useEffect(() => {
    const timer = setTimeout(
      () => setIntroDone(true),
      (BG_SETTLE_DELAY + 1.2) * 1000,
    );
    return () => clearTimeout(timer);
  }, []);

  // Only start cycling bottom text after intro is complete
  useEffect(() => {
    if (!introDone) return;
    const interval = setInterval(() => {
      setCurrentTextIndex(prevIndex => (prevIndex + 1) % bottomTexts.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [introDone]);

  return (
    <div className="hero-section">
      <motion.div
        style={{ marginTop: '48px' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: showRobot ? 1 : 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <Suspense fallback={null}>
          <CanvasComponent onReady={handleRobotReady} />
        </Suspense>
      </motion.div>
      <div className="heading-section">
        <motion.div
          className="heading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: BG_SETTLE_DELAY,
            duration: 0.6,
            ease: 'easeOut',
          }}
          data-color-inverted={'true'}
        >
          <ScrambleText
            style={{
              fontSize: isMobile ? '36px' : '64px',
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              color: 'var(--primary-orange)',
            }}
            texts={['Founder', 'Builder', 'Researcher', 'Developer']}
            speed={100}
            pauseDuration={1000}
          />
          <h1 className="heading">
            <HoverSwapText
              original="& CEO."
              hovered="(addicted to Claude Code)"
            />
          </h1>
        </motion.div>
        <motion.p
          className="desc"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: BG_SETTLE_DELAY + 0.2,
            duration: 0.6,
            ease: 'easeOut',
          }}
        >
          <HoverSwapText original="18-year-old" hovered="(yes, actually 18)" />{' '}
          founder building{' '}
          <HoverSwapText original="financial AI" hovered="the future of accounting" />{' '}
          for SMBs.{' '}
          <HoverSwapText original="Researcher" hovered="Lab rat by choice" />{' '}
          in physics and chemistry.{' '}
          <HoverSwapText original="39 olympiad medals." hovered="I lost count too." />{' '}
          <HoverSwapText original="St Andrews scholar." hovered="Scotland here I come 🏴󠁧󠁢󠁳󠁣󠁴󠁿" />
        </motion.p>
        <motion.div
          className="btn-flex"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: BG_SETTLE_DELAY + 0.5,
            duration: 0.4,
            ease: 'easeOut',
          }}
        >
          <CommonButton
            text="Connect"
            Icon={<FiLink className="icon-link" />}
            iconPosition="right"
            onClick={() => window.open('https://linkedin.com/in/gabriel-moreno-ribeiro')}
          />
          <CommonButton
            text="See Work"
            variant="outline"
            Icon={<FiArrowRight className="icon-arrow" />}
            iconPosition="right"
            onClick={() => scrollToComponent('work')}
          />
        </motion.div>
        <motion.p
          key={currentTextIndex}
          className="bottom-text"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={
            introDone
              ? { duration: 0.5 }
              : { delay: BG_SETTLE_DELAY + 0.7, duration: 0.6, ease: 'easeOut' }
          }
          dangerouslySetInnerHTML={{ __html: bottomTexts[currentTextIndex] }}
        />
      </div>
    </div>
  );
}

export default Hero;
