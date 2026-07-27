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
  { html: `Gabriel is the <span class="black">Co-Founder & CEO</span> of <span class="black">HIBEEX</span> — building financial AI for SMBs.`, fun: `Gabriel is the Chief Coffee Officer of HIBEEX — teaching spreadsheets to think for SMBs.` },
  { html: `One of <span class="black">6 startups</span> in the <span class="black">Canastra Ventures AI Residency</span> — among the youngest founders selected.`, fun: `Snuck into the Canastra Ventures AI Residency — youngest guy in every room, again.` },
  { html: `He has won <span class="black">39 olympiad medals</span> (19 gold) across math, physics, chemistry, and more.`, fun: `He has hoarded 39 shiny fridge magnets (19 gold) across every nerd subject known to man.` },
  { html: `Ran an <span class="black">RCT with 208 students</span> on fintech and savings — treatment group saved <span class="black">130% more</span>.`, fun: `Convinced 208 teenagers to save money — science says it worked (+130%).` },
  { html: `Founded <span class="black">Projeto Candela</span> — physics kits reaching <span class="black">3,392 students</span> in 28 public schools.`, fun: `Founded Projeto Candela — physics kits so good that failing went out of fashion.` },
  { html: `Admitted to <span class="black">University of St Andrews</span> (Global Merit Scholarship) — chose a <span class="black">build year</span> first.`, fun: `Got the fancy Scottish castle invite — said "hold on, shipping first" and kept building.` },
  { html: `Selected for <span class="black">Fundacao Estudar PREP</span> — 70 of 10,000+ applicants.`, fun: `Survived the Hunger Games of scholarships — 70 of 10,000+ applicants.` },
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
      {/* 3D model: atualmente o robô (public/assets/3d/cute_robot.glb).
          Quando o seu modelo 3D ficar pronto, substitua esse arquivo .glb
          pelo seu (mesmo nome de arquivo = zero mudança de código). */}
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
          data-fun-zone="true"
        >
          <h1 className="hero-name" data-fun="That Guy From The Internet.">
            Gabriel Moreno Ribeiro.
          </h1>
          <div className="hero-roles" data-fun="Coffee Addict & Chaos.">
            <ScrambleText
              style={{
                fontSize: isMobile ? '22px' : '36px',
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
              }}
              texts={['Founder', 'Builder', 'Researcher', 'Developer']}
              speed={100}
              pauseDuration={1000}
            />
            <span className="role-suffix">& CEO.</span>
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
          data-fun="18-year-old who skipped freshman dorms to keep shipping. Professional beaker shaker. 39 fridge magnets. Organized chaos."
        >
          18-year-old founder and researcher on a build year. Building financial AI for SMBs. 39 olympiad medals. Projeto Candela founder.
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
