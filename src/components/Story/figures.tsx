import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { FiArrowUpRight, FiStar } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { CountUp, EASE, Reveal, useCountUp, useRevealed } from './shared';

// ── Town: waterfall photo with parallax + population count ───────────────────
export function TownFigure() {
  const wrap = useRef<HTMLElement>(null);
  const { ref, inView } = useRevealed<HTMLElement>();
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: wrap, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], reduced ? ['0%', '0%'] : ['-10%', '10%']);

  return (
    <figure className="fig fig--town" ref={wrap}>
      <div className="fig-town__photo">
        <motion.img
          src="/background/missao-velha/01.webp"
          alt="Family standing on the rocks by the Missão Velha waterfall"
          style={{ y }}
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
      </div>
      <figcaption className="fig-town__caption" ref={ref}>
        <span>Missão Velha, Ceará</span>
        <i />
        <span><CountUp value={35672} start={inView} /> people</span>
      </figcaption>
    </figure>
  );
}

// ── Porca: the nut vs. the pig ───────────────────────────────────────────────
function PigSvg() {
  return (
    <svg viewBox="0 0 140 90" className="pig__svg" aria-hidden="true">
      <g className="pig__tail">
        <path d="M24 44 C 12 42, 8 30, 17 27 C 26 25, 24 37, 14 35" />
      </g>
      <g className="pig__legs">
        <rect className="pig__leg pig__leg--a" x="38" y="58" width="9" height="22" rx="4" />
        <rect className="pig__leg pig__leg--b" x="54" y="58" width="9" height="22" rx="4" />
        <rect className="pig__leg pig__leg--a" x="76" y="58" width="9" height="22" rx="4" />
        <rect className="pig__leg pig__leg--b" x="92" y="58" width="9" height="22" rx="4" />
      </g>
      <ellipse className="pig__body" cx="66" cy="46" rx="42" ry="26" />
      <polygon className="pig__ear" points="94,26 100,6 111,27" />
      <polygon className="pig__ear" points="111,24 123,9 125,30" />
      <circle className="pig__body" cx="108" cy="41" r="19" />
      <ellipse className="pig__snout" cx="124" cy="45" rx="9" ry="7" />
      <circle className="pig__nostril" cx="121" cy="45" r="1.6" />
      <circle className="pig__nostril" cx="127" cy="45" r="1.6" />
      <circle className="pig__eye" cx="109" cy="35" r="2.4" />
    </svg>
  );
}

function NutSvg() {
  return (
    <svg viewBox="0 0 100 100" className="nut__svg" aria-hidden="true">
      <polygon className="nut__outer" points="92,50 71,86.4 29,86.4 8,50 29,13.6 71,13.6" />
      <polygon className="nut__bevel" points="84,50 67,79.4 33,79.4 16,50 33,20.6 67,20.6" />
      <circle className="nut__hole" cx="50" cy="50" r="19" />
      <circle className="nut__thread" cx="50" cy="50" r="15" />
      <circle className="nut__thread" cx="50" cy="50" r="11" />
    </svg>
  );
}

export function PorcaFigure() {
  const { ref, inView } = useRevealed();
  const reduced = useReducedMotion();
  const [walking, setWalking] = useState(true);

  return (
    <figure className="fig fig--porca" ref={ref}>
      <div className="fig-porca__panel">
        <p className="fig-kicker">What he asked for</p>
        <div className="fig-porca__stage">
          <motion.div
            className="nut"
            animate={inView && !reduced ? { rotate: 360 } : undefined}
            transition={{ duration: 7, ease: 'linear', repeat: Infinity }}
          >
            <NutSvg />
          </motion.div>
        </div>
        <p className="fig-porca__word">
          <em>porca</em> <span>n.</span> the nut that goes on a bolt
        </p>
      </div>
      <div className="fig-porca__swap" aria-hidden="true">≠</div>
      <div className="fig-porca__panel">
        <p className="fig-kicker">What I brought back</p>
        <div className="fig-porca__stage">
          <motion.div
            className={`pig ${walking && !reduced ? 'pig--walking' : ''}`}
            initial={reduced ? false : { x: '150%' }}
            animate={inView ? { x: '0%' } : undefined}
            transition={{ duration: 2.4, ease: 'easeOut' }}
            onAnimationComplete={() => setWalking(false)}
          >
            <PigSvg />
          </motion.div>
        </div>
        <p className="fig-porca__word">
          <em>porca</em> <span>n.</span> also a female pig. This one is Merlita.
        </p>
      </div>
    </figure>
  );
}

// ── Ledger: the tabs he never collected ──────────────────────────────────────
const TABS = [
  ['Brake pads', 'a neighbor'],
  ['Carburetor', 'a cousin'],
  ['Oil change', 'a cousin who married one'],
  ['Clutch', 'the street'],
];

export function LedgerFigure() {
  const { ref, inView } = useRevealed();
  const reduced = useReducedMotion();
  const row = (i: number) => ({
    initial: reduced ? false : { opacity: 0, x: -10 },
    animate: inView ? { opacity: 1, x: 0 } : undefined,
    transition: { duration: 0.5, ease: EASE, delay: 0.15 + i * 0.22 },
  });

  return (
    <figure className="fig fig--ledger" ref={ref}>
      <div className="ledger">
        <p className="ledger__title">Adalberto's garage <span>· tabs</span></p>
        {TABS.map(([part, who], i) => (
          <motion.p className="ledger__row" key={part} {...row(i)}>
            <span className="ledger__part">{part}</span>
            <span className="ledger__who">{who}</span>
            <i />
            <span className="ledger__amt">never charged</span>
          </motion.p>
        ))}
        <motion.hr {...row(TABS.length)} />
        <motion.p className="ledger__row ledger__row--town" {...row(TABS.length + 1)}>
          <span className="ledger__part">One house, before dawn</span>
          <span className="ledger__who">the town</span>
          <i />
          <span className="ledger__amt">rebuilt</span>
        </motion.p>
        <motion.p className="ledger__total" {...row(TABS.length + 2)}>
          <span>Balance</span>
          <i />
          <span>even</span>
        </motion.p>
      </div>
    </figure>
  );
}

// ── Photo strips ──────────────────────────────────────────────────────────────
type Photo = { src: string; alt: string; caption: string };

export const MISSAO_VELHA_PHOTOS: Photo[] = [
  { src: '/background/missao-velha/02.webp', alt: 'Three boys under the wooden sign of the Missão Velha waterfall trail', caption: 'The trail to the waterfall' },
  { src: '/moments/mv07.webp', alt: 'Three kids laughing in the back of a car', caption: 'Cousins, back seat' },
  { src: '/background/missao-velha/05.webp', alt: 'Family in front of a mud house decorated with São João flags', caption: 'São João, Missão Velha' },
  { src: '/moments/mv06.webp', alt: 'Kids with cotton candy at a São João festival', caption: 'Cotton candy season' },
];

export const SALVADOR_PHOTOS: Photo[] = [
  { src: '/moments/ssa02.webp', alt: 'A child climbing a big tree in a backyard', caption: 'Backyard tree, Salvador' },
  { src: '/moments/ssa01.webp', alt: 'Gabriel as a child in a pineapple costume', caption: 'Pineapple, apparently' },
  { src: '/moments/ssa06.webp', alt: 'A child sandboarding down a dune', caption: 'Dunes, Bahia' },
  { src: '/moments/ssa03.webp', alt: 'Three kids at home in Salvador', caption: 'Salvador, Bahia' },
];

const TILTS = [-3, 2.5, -2, 3];

export function PhotoStrip({ photos, eyebrow }: { photos: Photo[]; eyebrow: string }) {
  const { ref, inView } = useRevealed();
  const reduced = useReducedMotion();
  return (
    <figure className="fig fig--strip" ref={ref}>
      <p className="fig-kicker fig-strip__eyebrow">{eyebrow}</p>
      <div className="fig-strip__row">
        {photos.map((p, i) => (
          <motion.div
            className="polaroid"
            key={p.src}
            initial={reduced ? false : { opacity: 0, y: 40, rotate: 0 }}
            animate={inView ? { opacity: 1, y: 0, rotate: TILTS[i % TILTS.length] } : undefined}
            transition={{ duration: 0.7, ease: EASE, delay: 0.1 + i * 0.12 }}
            whileHover={reduced ? undefined : { rotate: 0, y: -6, scale: 1.03 }}
          >
            <img src={p.src} alt={p.alt} loading="lazy" decoding="async" />
            <span>{p.caption}</span>
          </motion.div>
        ))}
      </div>
    </figure>
  );
}

// ── Laptops: 121 machines, 21 states, 198 hours, and Hindi ──────────────────
const HINDI = 'हेलो दोस्तों';
const HOURS_TOTAL = 198 * 3600 + 18 * 60 + 37;

const clock = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return `${String(h).padStart(3, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

function graphemes(s: string): string[] {
  const Seg = (Intl as any).Segmenter;
  if (Seg) return Array.from(new Seg('hi', { granularity: 'grapheme' }).segment(s), (x: any) => x.segment);
  return Array.from(s);
}

function Typed({ text, start, delay = 0 }: { text: string; start: boolean; delay?: number }) {
  const reduced = useReducedMotion();
  const parts = graphemes(text);
  const [n, setN] = useState(reduced ? parts.length : 0);
  useEffect(() => {
    if (!start || reduced) return;
    let i = 0;
    let timer = 0;
    const step = () => {
      i += 1;
      setN(i);
      if (i < parts.length) timer = window.setTimeout(step, 140);
    };
    timer = window.setTimeout(step, delay);
    return () => clearTimeout(timer);
  }, [start, reduced, parts.length, delay]);
  return (
    <span className="typed">
      {parts.slice(0, n).join('')}
      <i className="typed__caret" />
    </span>
  );
}

export function LaptopsFigure() {
  const { ref, inView } = useRevealed();
  return (
    <figure className={`fig fig--laptops ${inView ? 'is-on' : ''}`} ref={ref}>
      <div className="tile">
        <p className="tile__num"><CountUp value={121} start={inView} /></p>
        <p className="tile__label">laptops, in four years</p>
        <div className="dots dots--121" aria-hidden="true">
          {Array.from({ length: 121 }, (_, i) => (
            <i key={i} style={{ transitionDelay: `${i * 11}ms` }} />
          ))}
        </div>
      </div>
      <div className="tile">
        <p className="tile__num"><CountUp value={21} start={inView} /><span> / 26</span></p>
        <p className="tile__label">Brazilian states shipped to</p>
        <div className="dots dots--26" aria-hidden="true">
          {Array.from({ length: 26 }, (_, i) => (
            <i key={i} className={i < 21 ? 'is-hit' : ''} style={{ transitionDelay: `${i * 55}ms` }} />
          ))}
        </div>
      </div>
      <div className="tile">
        <p className="tile__num tile__num--mono">
          <CountUp value={HOURS_TOTAL} start={inView} duration={2600} format={clock} />
        </p>
        <p className="tile__label">hours of Indian YouTube tutorials</p>
        <p className="tile__foot"><span className="mono">machine #82 › BIOS<i className="typed__caret" /></span> every part tested fine. It crashed anyway.</p>
      </div>
      <div className="tile tile--hindi" lang="hi">
        <p className="tile__num tile__num--hindi"><Typed text={HINDI} start={inView} delay={900} /></p>
        <p className="tile__label" lang="en">"hey guys," the way every tutorial starts</p>
        <p className="tile__foot" lang="en">hello doston</p>
      </div>
    </figure>
  );
}

// ── Chat: my mother's voice, on call at nine in the evening ──────────────────
export function ChatFigure() {
  const { ref, inView } = useRevealed();
  const reduced = useReducedMotion();
  const [stage, setStage] = useState(reduced ? 4 : 0);

  useEffect(() => {
    if (!inView || reduced) return;
    const timers = [400, 1700, 2500, 3900].map((t, i) => window.setTimeout(() => setStage(i + 1), t));
    return () => timers.forEach(clearTimeout);
  }, [inView, reduced]);

  return (
    <figure className="fig fig--chat" ref={ref}>
      <div className="chat">
        <div className="chat__head">
          <span className="chat__avatar">S</span>
          <span>
            <b>Silvana</b>
            <small>dental office · 9:04 pm</small>
          </span>
        </div>
        <div className="chat__body">
          {stage >= 1 && stage < 2 && <Bubble side="in" typing />}
          {stage >= 2 && <Bubble side="in">my tooth kind of hurts but only when I eat beans</Bubble>}
          {stage >= 3 && stage < 4 && <Bubble side="out" typing />}
          {stage >= 4 && (
            <Bubble side="out" voice>
              That sounds like sensitivity, not an emergency. I can put you in the first slot tomorrow. Does 8:00 work?
            </Bubble>
          )}
        </div>
        <div className="chat__foot">62 questions, answered in her voice</div>
      </div>
    </figure>
  );
}

function Bubble({ side, typing, voice, children }: { side: 'in' | 'out'; typing?: boolean; voice?: boolean; children?: React.ReactNode }) {
  return (
    <motion.div
      className={`bubble bubble--${side} ${typing ? 'bubble--typing' : ''}`}
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      {typing ? (
        <span className="bubble__dots"><i /><i /><i /></span>
      ) : (
        <>
          {voice && (
            <span className="bubble__wave" aria-label="voice message">
              {Array.from({ length: 9 }, (_, i) => <i key={i} style={{ animationDelay: `${i * 90}ms` }} />)}
            </span>
          )}
          <span>{children}</span>
        </>
      )}
    </motion.div>
  );
}

// ── Repos ─────────────────────────────────────────────────────────────────────
const REPOS = [
  { n: 17, name: 'merlita-escape-detector', note: '' , star: false },
  { n: 19, name: 'candela-3d-models', note: 'physics kits for schools', star: true },
  { n: 21, name: 'hindi-to-portuguese-youtube', note: '', star: false },
  { n: 28, name: 'hibeex-v2', note: 'AI for small businesses', star: true },
];

export function ReposFigure() {
  const { ref, inView } = useRevealed();
  const reduced = useReducedMotion();
  return (
    <figure className="fig fig--repos" ref={ref}>
      <div className="repos__head">
        <p className="repos__count"><CountUp value={31} start={inView} /> <span>repos</span></p>
        <a className="repos__link" href="https://github.com/gabriel-moreno-ribeiro" target="_blank" rel="noopener noreferrer">
          github.com/gabriel-moreno-ribeiro <FiArrowUpRight aria-hidden="true" />
        </a>
      </div>
      <div className="repos__graph">
        <motion.i
          className="repos__line"
          initial={reduced ? false : { scaleY: 0 }}
          animate={inView ? { scaleY: 1 } : undefined}
          transition={{ duration: 1.6, ease: EASE, delay: 0.2 }}
        />
        {REPOS.map((r, i) => (
          <motion.div
            className={`repo ${r.star ? 'repo--star' : ''}`}
            key={r.n}
            initial={reduced ? false : { opacity: 0, x: -14 }}
            animate={inView ? { opacity: 1, x: 0 } : undefined}
            transition={{ duration: 0.5, ease: EASE, delay: 0.35 + i * 0.3 }}
          >
            <span className="repo__dot" />
            <span className="repo__n">#{r.n}</span>
            <span className="repo__name">{r.name}</span>
            {r.note && <span className="repo__note">{r.note}</span>}
            {r.star && <FiStar className="repo__star" aria-label="one I'm proudest of" />}
          </motion.div>
        ))}
      </div>
    </figure>
  );
}

// ── Scale: garage, country, world ────────────────────────────────────────────
export function ScaleFigure() {
  const { ref, inView } = useRevealed();
  const reduced = useReducedMotion();
  const ring = (i: number) => ({
    initial: reduced ? false : { scale: 0.2, opacity: 0 },
    animate: inView ? { scale: 1, opacity: 1 } : undefined,
    transition: { duration: 0.9, ease: EASE, delay: 0.2 + i * 0.5 },
  });
  return (
    <figure className="fig fig--scale" ref={ref}>
      <div className="scale">
        <motion.div className="scale__ring scale__ring--world" {...ring(2)}>
          <span className="scale__label">
            <b><CountUp value={510072000} start={inView} delay={1200} duration={1800} /> km²</b> a world
          </span>
        </motion.div>
        <motion.div className="scale__ring scale__ring--country" {...ring(1)}>
          <span className="scale__label">
            <b><CountUp value={8515767} start={inView} delay={700} duration={1600} /> km²</b> a country
          </span>
        </motion.div>
        <motion.div className="scale__ring scale__ring--garage" {...ring(0)}>
          <span className="scale__label">
            <b><CountUp value={29.52} decimals={2} start={inView} delay={200} /> m²</b> a garage
          </span>
        </motion.div>
      </div>
      <figcaption>Not to scale. Obviously.</figcaption>
    </figure>
  );
}

// ── End: 2013 → 2026 ─────────────────────────────────────────────────────────
export function EndFigure() {
  const { ref, inView } = useRevealed();
  const reduced = useReducedMotion();
  const years = useCountUp(13, inView, 2200, 300);
  const pct = (years / 13) * 100;
  return (
    <figure className="fig fig--end" ref={ref}>
      <div className="timeline" aria-hidden="true">
        <span className="timeline__year">2013</span>
        <div className="timeline__track">
          <i className="timeline__fill" style={{ width: `${pct}%` }} />
          <b className="timeline__marker" style={{ left: `${pct}%`, ['--pct' as string]: pct }}>{2013 + Math.round(years)}</b>
        </div>
        <span className="timeline__year">2026</span>
      </div>
      <Reveal className="fig-end__photo" as="div" delay={0.2}>
        <img src="/moments/mv04.webp" alt="Gabriel as a boy at night, holding a bottle of cashew soda" loading="lazy" decoding="async" />
        <span>Missão Velha. Still the same kid.</span>
      </Reveal>
      <div className="fig-end__cta">
        <Link to="/#contact" className="fig-end__btn">Bring me something that won't start</Link>
        <Link to="/" className="fig-end__back">Back home</Link>
      </div>
    </figure>
  );
}
