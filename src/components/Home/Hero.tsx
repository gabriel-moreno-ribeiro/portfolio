import { motion } from 'motion/react';
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { FiArrowRight, FiCalendar } from 'react-icons/fi';
import useIsMobile from '../../hooks/useIsMobile';
import { formatRelative, useLocalData, useNowLine } from '../../lib/data';
import { useReducedMotion, useVisible } from '../../lib/motion';
import { scrollToComponent } from '../../utils/scrollToComponent';
import CommonButton from '../Shared/CommonButton';
import ScrambleText from '../Shared/ScrambleText';

// The robot pulls in three.js + react-three (~1MB parsed) and renders every
// frame. Skip it outright on devices that would pay for it.
function isLowPowerDevice() {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  if (nav.connection?.saveData) return true;
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4) return true;
  if (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 4)
    return true;
  return false;
}

// Phones never had a robot and the layout is built without it. Everywhere else the
// slot exists no matter what: reduced motion swaps the canvas for the poster, so the
// hero keeps the same height and the same layout either way.
const isNarrowViewport = typeof window !== 'undefined' && window.innerWidth < 768;
const canRender3D =
  typeof window !== 'undefined' && !isNarrowViewport && !isLowPowerDevice();

const CanvasComponent = canRender3D
  ? lazy(() => import('../Canvas/CanvasComponent'))
  : null;

const BG_SETTLE_DELAY = 0.7;

function Hero() {
  const isMobile = useIsMobile();
  const reduced = useReducedMotion();
  const { press } = useLocalData();
  const nowLine = useNowLine();
  const heroRef = useRef<HTMLDivElement>(null);
  const heroVisible = useVisible(heroRef);
  const [showRobot, setShowRobot] = useState(false);
  const [load3D, setLoad3D] = useState(false);
  const mountTimeRef = useRef(Date.now());

  const use3D = canRender3D && !reduced;

  // Let text paint first: the 3D chunk is fetched once the main thread is idle.
  useEffect(() => {
    if (!use3D) return;
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => setLoad3D(true), { timeout: 2500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(() => setLoad3D(true), 1200);
    return () => clearTimeout(id);
  }, [use3D]);

  const handleRobotReady = useCallback(() => {
    const elapsed = Date.now() - mountTimeRef.current;
    const remaining = Math.max(0, BG_SETTLE_DELAY * 1000 - elapsed);
    setTimeout(() => {
      requestAnimationFrame(() => setShowRobot(true));
    }, remaining);
  }, []);

  // "latest": the most recent entry of press.json. A bare YYYY date has no day to
  // count from, so it shows the year instead of a relative time.
  const latest = press[0];
  const latestWhen = latest
    ? /^\d{4}$/.test(latest.date)
      ? latest.date
      : formatRelative(latest.date)
    : '';

  // Under reduced motion the final state is the default: nothing starts at opacity 0.
  const fadeIn = (delay: number, duration: number) =>
    reduced
      ? { initial: false as const, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { delay, duration, ease: 'easeOut' as const },
        };

  return (
    <div className="hero-section" ref={heroRef}>
      {!isNarrowViewport && (
        <div className="hero-robot" aria-hidden="true">
          {/* The poster is in the DOM before anything heavy loads, and it is the
              whole robot under reduced motion. */}
          <img
            className="hero-robot__poster"
            src="/assets/robot-poster.webp"
            alt=""
            width={300}
            height={300}
            decoding="async"
            data-hidden={showRobot ? 'true' : undefined}
          />
          {use3D && CanvasComponent && (
            <motion.div
              className="hero-robot__canvas"
              initial={{ opacity: 0 }}
              animate={{ opacity: showRobot ? 1 : 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <Suspense fallback={null}>
                {load3D && <CanvasComponent onReady={handleRobotReady} />}
              </Suspense>
            </motion.div>
          )}
        </div>
      )}
      <div className="heading-section">
        <motion.div
          className="heading"
          {...fadeIn(BG_SETTLE_DELAY, 0.6)}
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
              enabled={heroVisible}
            />
            <span className="role-suffix">& Curious.</span>
          </div>
        </motion.div>
        <motion.p className="desc" {...fadeIn(BG_SETTLE_DELAY + 0.2, 0.6)}>
          Building Backoffice AI for Small and Medium Businesses @ HIBEEX. Founder @ Projeto Candela.
        </motion.p>
        {/* Status line: building / reading / local time, from now.json and the clock. */}
        <p className="hero-status" aria-live="polite">
          <span className="hero-status__dot" aria-hidden="true" />
          <span className="hero-status__text">{nowLine.text}</span>
        </p>
        <motion.div className="btn-flex" {...fadeIn(BG_SETTLE_DELAY + 0.5, 0.4)}>
          {/* Two calls to action: the work first, then a call. LinkedIn lives in Contact and the footer. */}
          <CommonButton
            text="See Work"
            Icon={<FiArrowRight className="icon-arrow" />}
            iconPosition="right"
            onClick={() => scrollToComponent('work')}
          />
          <CommonButton
            text="Book a Call"
            variant="outline"
            Icon={<FiCalendar className="icon-link" />}
            iconPosition="right"
            onClick={() => window.open('https://cal.com/gabrielmribeiro', '_blank')}
          />
        </motion.div>
        {latest && (
          <motion.p className="hero-latest" {...fadeIn(BG_SETTLE_DELAY + 0.7, 0.6)}>
            <span className="hero-latest__tag">latest</span>
            <a
              className="hero-latest__link"
              href={latest.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {latest.title}
            </a>
            <span className="hero-latest__meta">
              {latest.outlet} · {latestWhen}
            </span>
          </motion.p>
        )}
      </div>
    </div>
  );
}

export default Hero;
