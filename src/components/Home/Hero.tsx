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
  `Co-Founder & CEO of <span class="black">HIBEEX</span>. Building financial AI for small businesses.`,
  `One of <span class="black">6 startups</span> picked for the <span class="black">Canastra Ventures AI Residency</span>.`,
  `<span class="black">39 olympiad medals</span> (19 gold) in math, physics, chemistry, and astronomy.`,
  `Ran an <span class="black">RCT with 208 students</span> on fintech and savings. Treatment group saved <span class="black">130% more</span>.`,
  `Founded <span class="black">Projeto Candela</span>: physics kits now in 28 public schools, reaching <span class="black">3,392 students</span>.`,
  `Admitted to <span class="black">St Andrews</span> with a Global Merit Scholarship. Chose to build first.`,
  `<span class="black">Fundação Estudar PREP</span> scholar. 70 picked from 10,000+ applicants.`,
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
    }, 5000);
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
          <h1 className="hero-name">
            Gabriel Moreno Ribeiro.
          </h1>
          <div className="hero-roles">
            <ScrambleText
              style={{
                fontSize: isMobile ? '22px' : '36px',
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
              }}
              texts={['Founder', 'Builder', 'Researcher', 'Developer']}
              speed={40}
              pauseDuration={2200}
            />
            <span className="role-suffix">& Curious.</span>
          </div>
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
          18 years old. Building financial AI for small businesses at HIBEEX. 39 olympiad medals. Founded Projeto Candela.
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
