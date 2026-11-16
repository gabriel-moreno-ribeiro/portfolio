// "How it works" at the top of /work/<slug>: the diorama pinned on one side, its
// steps on the other, the scene advancing with the scroll. On a phone, or with
// reduced motion, nothing pins: the finished poster sits above the full list.
import { useMotionValueEvent } from 'motion/react';
import { useRef, useState } from 'react';
import useIsMobile from '../../hooks/useIsMobile';
import { useReducedMotion, useSectionProgress } from '../../lib/motion';
import Diorama from './Diorama';
import { dioramas, stepAt } from './steps';

export default function HowItWorks({ slug }: { slug: string }) {
  const spec = dioramas[slug];
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const phone = useIsMobile(768);
  const scrub = !reduced && !phone;
  const { progress } = useSectionProgress(ref);
  const count = spec?.steps.length ?? 0;
  const [active, setActive] = useState(0);

  useMotionValueEvent(progress, 'change', (p) => {
    setActive(Math.min(count - 1, Math.floor(stepAt(p, count) + 0.5)));
  });

  if (!spec) return null;

  return (
    <section
      ref={ref}
      className={`how${scrub ? ' how--pinned' : ''}`}
      style={{ ['--how-steps' as string]: count }}
      aria-labelledby="how-title"
    >
      <div className="how__pin">
        <div className="how__stage">
          <Diorama slug={slug} live={scrub} progress={scrub ? progress : undefined} activeStep={scrub ? active : undefined} />
        </div>
        <div className="how__text">
          <h2 id="how-title" className="how__title">How it works</h2>
          <ol className="how__steps">
            {spec.steps.map((s, i) => (
              <li key={s.title} className={scrub && i === active ? 'is-active' : undefined} aria-current={scrub && i === active ? 'step' : undefined}>
                <span className="how__index">{String(i + 1).padStart(2, '0')}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
