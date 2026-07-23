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
  { html: `Gabriel is the <span class="black">Co-Founder & CEO</span> of <span class="black">HIBEEX</span> — building financial AI for SMBs.`, fun: `Gabriel is the caffeine-powered CEO of a startup still in beta — building fancy excel for SMBs.` },
  { html: `He has won <span class="black">39 olympiad medals</span> (19 gold) across math, physics, chemistry, and more.`, fun: `He has won way too many medals (no shelf left) across nerd bingo, and more.` },
  { html: `Admitted to <span class="black">University of St Andrews</span> with a Global Merit Scholarship for CS & Economics.`, fun: `Admitted to a university with cold weather and free tuition for CS & Economics.` },
  { html: `Selected for <span class="black">Fundacao Estudar PREP</span> — 70 of 10,000+ applicants.`, fun: `Won the lottery basically — 70 of 10,000+ applicants.` },
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
          data-fun="Coffee Addict & CEO."
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
            & CEO.
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
          data-fun="Feels 30 tbh. Chaos manager building fancy excel for SMBs. Lab rat. No shelf left. Cold weather scholar."
        >
          18-year-old founder building financial AI for SMBs. Researcher in physics and chemistry. 39 olympiad medals. St Andrews scholar.
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
          data-fun={bottomTexts[currentTextIndex].fun}
          dangerouslySetInnerHTML={{ __html: bottomTexts[currentTextIndex].html }}
        />
      </div>
    </div>
  );
}

export default Hero;
