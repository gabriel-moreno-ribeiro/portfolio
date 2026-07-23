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
import ScrambleText from '../Shared/ScrambleText';

const CanvasComponent = lazy(() => import('../Canvas/CanvasComponent'));

const BG_SETTLE_DELAY = 0.7;

const bottomTexts = [
  `<span data-fun="oi">Gabriel</span> is the <span class="black" data-fun="caffeine CEO">Co-Founder & CEO</span> of <span class="black" data-fun="still in beta">HIBEEX</span> — building <span data-fun="fancy excel">financial AI</span> for SMBs.`,
  `He has won <span class="black" data-fun="no shelf left">39 olympiad medals</span> (19 gold) across <span data-fun="nerd bingo">math, physics, chemistry</span>, and more.`,
  `Admitted to <span class="black" data-fun="cold weather">University of St Andrews</span> with a <span data-fun="free tuition">Global Merit Scholarship</span> for CS & Economics.`,
  `Selected for <span class="black" data-fun="lottery odds">Fundacao Estudar PREP</span> — 70 of 10,000+ applicants.`,
];

function Hero() {
  const isMobile = useIsMobile();
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [showRobot, setShowRobot] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const mountTimeRef = useRef(Date.now());

  const handleRobotReady = useCallback(() => {
    const elapsed = Date.now() - mountTimeRef.current;
    const remaining = Math.max(0, BG_SETTLE_DELAY * 1000 - elapsed);
    setTimeout(() => {
      requestAnimationFrame(() => setShowRobot(true));
    }, remaining);
  }, []);

  useEffect(() => {
    const timer = setTimeout(
      () => setIntroDone(true),
      (BG_SETTLE_DELAY + 1.2) * 1000,
    );
    return () => clearTimeout(timer);
  }, []);

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
            <span data-fun="& coffee addict">& CEO.</span>
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
          <span data-fun="feels 30 tbh">18-year-old</span>{' '}
          <span data-fun="chaos manager">founder</span> building{' '}
          <span data-fun="fancy excel">financial AI</span>{' '}
          for SMBs.{' '}
          <span data-fun="lab rat">Researcher</span>{' '}
          in physics and chemistry.{' '}
          <span data-fun="no shelf left">39 olympiad medals.</span>{' '}
          <span data-fun="cold weather">St Andrews scholar.</span>
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
