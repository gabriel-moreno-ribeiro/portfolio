import { motion, useReducedMotion } from 'motion/react';
import { Reveal, useRevealed } from './shared';

const SECTION_ID = 'story-truck';

const STEPS = [
  { when: 'First', part: 'the battery', cost: 'money we didn\'t have', result: 'Still nothing.' },
  { when: 'Then', part: 'the alternator', cost: 'money we didn\'t have', result: 'Still nothing.' },
  { when: 'Then', part: 'the fuel filter', cost: 'money we didn\'t have', result: 'Still nothing.' },
  { when: 'The 3rd afternoon', part: 'a burned fuse', cost: 'less than his coffee', result: 'It turned over.' },
];

function FuseSvg({ lit }: { lit: boolean }) {
  return (
    <svg viewBox="0 0 120 80" className={`fuse ${lit ? 'fuse--lit' : ''}`} aria-hidden="true">
      <rect className="fuse__body" x="14" y="8" width="92" height="46" rx="8" />
      <rect className="fuse__prong" x="30" y="54" width="14" height="20" rx="2" />
      <rect className="fuse__prong" x="76" y="54" width="14" height="20" rx="2" />
      <path className="fuse__wire" d="M37 32 L52 32 L56 22" />
      <path className="fuse__wire" d="M64 40 L68 32 L83 32" />
      <circle className="fuse__spark" cx="60" cy="31" r="3" />
    </svg>
  );
}

export function TruckFigure() {
  const { ref: lastRef, inView: lastInView } = useRevealed('0px 0px -30% 0px');
  const reduced = useReducedMotion();

  return (
    <figure className="fig fig--truck" id={SECTION_ID}>
      <div className="fig-truck__stage">
        <Reveal as="div" className="fig-truck__photo">
          <img
            src="/story/d20.webp"
            alt="A white Chevrolet D-20 pickup parked in a field at dusk"
            loading="lazy"
            decoding="async"
          />
          <span className="fig-truck__credit">
            A D-20 like his. Photo:{' '}
            <a href="https://commons.wikimedia.org/wiki/File:D_20_no_cerrado_-_panoramio.jpg" target="_blank" rel="noopener noreferrer">beto junqueira</a>, CC BY-SA 3.0
          </span>
        </Reveal>
      </div>
      <div className="fig-truck__steps">
        <Reveal className="fig-truck__intro">
          <p className="fig-kicker">Car #9</p>
          <p className="fig-truck__name">A red Chevrolet D20, bought to move animals around. Merlita included.</p>
        </Reveal>
        {STEPS.map((s, i) => {
          const last = i === STEPS.length - 1;
          return (
            <Reveal className={`fig-truck__step ${last ? 'fig-truck__step--found' : ''}`} key={s.part} delay={0.05}>
              <div ref={last ? lastRef : undefined}>
                <p className="fig-truck__when">{s.when}</p>
                <p className="fig-truck__part">
                  {last ? 'we found it: ' : 'we replaced '}<b>{s.part}</b>
                </p>
                <p className="fig-truck__cost">
                  <span>cost</span> {s.cost}
                </p>
                <motion.p
                  className="fig-truck__result"
                  initial={reduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  {s.result}
                </motion.p>
                {last && <FuseSvg lit={lastInView} />}
              </div>
            </Reveal>
          );
        })}
      </div>
    </figure>
  );
}
