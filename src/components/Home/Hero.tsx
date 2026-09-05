import { motion } from 'motion/react';
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { FiArrowRight, FiCalendar, FiLink } from 'react-icons/fi';
import useIsMobile from '../../hooks/useIsMobile';
import { scrollToComponent } from '../../utils/scrollToComponent';
import CommonButton from '../Shared/CommonButton';
import ScrambleText from '../Shared/ScrambleText';

const shouldSkip3D =
  typeof window !== 'undefined' &&
  (window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
   window.innerWidth < 768);

const CanvasComponent = shouldSkip3D
  ? null
  : lazy(() => import('../Canvas/CanvasComponent'));

const BG_SETTLE_DELAY = 0.7;

const bottomTexts = [
  `Co-founder and CEO of <span class="black">HIBEEX</span>. We build backoffice AI for small and medium businesses.`,
  `HIBEEX is one of <span class="black">6 startups</span> in the <span class="black">Canastra Ventures AI Residency</span>.`,
  `<span class="black">39 olympiad medals</span>, 19 of them gold, in math, physics, chemistry and astronomy.`,
  `Ran a randomized trial with <span class="black">208 students</span> on whether fintech apps change how teenagers save.`,
  `Started <span class="black">Projeto Candela</span>: physics kits in 28 public schools, <span class="black">3,392 students</span> so far.`,
  `Admitted to <span class="black">St Andrews</span> with a Global Merit Scholarship.`,
  `<span class="black">Fundação Estudar PREP</span> scholar, one of 70 picked from 10,000+ applicants.`,
];

function Hero() {
  const isMobile = useIsMobile();
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [showRobot, setShowRobot] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const mountTimeRef = useRef(Date.now());

  const handleRobotReady = useCallback(() => {
    if (shouldSkip3D) return;
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
      {CanvasComponent && (
        <motion.div
          style={{ marginTop: '40px', minHeight: 300, minWidth: 300 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: showRobot ? 1 : 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <Suspense fallback={null}>
            <CanvasComponent onReady={handleRobotReady} />
          </Suspense>
        </motion.div>
      )}
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
          Building Backoffice AI for Small and Medium Businesses @ HIBEEX. Founder @ Projeto Candela.
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
          <CommonButton
            text="Book a Call"
            Icon={<FiCalendar className="icon-link" />}
            iconPosition="right"
            onClick={() => window.open('https://cal.com/gabrielmribeiro', '_blank')}
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
