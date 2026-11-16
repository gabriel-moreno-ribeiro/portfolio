// The DOM side of a clay story. Desktop: the row pins and the scroll scrubs the scene.
// Everywhere else: a plain list of stills with the same captions. The words never wait for WebGL.
import { useMotionValueEvent, type MotionValue } from 'motion/react';
import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { FiArrowUpRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import type { Project } from '../../../content/projects';
import { usePageVisible, useReducedMotion, useSectionProgress, useVisible } from '../../../lib/motion';
import { useThemeStore } from '../../../store/themeStore';
import { progressOfStep, stepOf, stillSrc } from './steps';
import type { ClayStep } from './stories';

const ClayStage = lazy(() => import('./ClayStage'));

const DESKTOP = '(min-width: 900px) and (hover: hover)';

/** Pinned, scroll-scrubbed stories only where there is room, a pointer and no reduced-motion. */
export function useClayPinned(): boolean {
  const reduced = useReducedMotion();
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia(DESKTOP).matches);
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP);
    const onChange = () => setWide(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return wide && !reduced;
}

let webgl: boolean | undefined;
function hasWebGL(): boolean {
  if (webgl === undefined) {
    try {
      webgl = !!document.createElement('canvas').getContext('webgl2');
    } catch {
      webgl = false;
    }
  }
  return webgl;
}

class Guard extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** The scene's box: the still of the current step first, the live canvas over it once it has drawn. */
function ClayBox({ slug, steps, index, progress }: { slug: string; steps: number; index: number; progress: MotionValue<number> }) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useVisible(ref, { rootMargin: '60% 0px', once: true });
  const inView = useVisible(ref);
  const pageVisible = usePageVisible();
  const dark = useThemeStore((s) => s.darkMode);
  const [state, setState] = useState<'still' | 'live' | 'failed'>('still');
  // Once the canvas is live the still stops following the steps (it is faded out).
  const shown = useRef(index);
  if (state !== 'live') shown.current = index;

  return (
    <div className={`clay-stage clay-stage--${state}`} ref={ref} aria-hidden="true">
      <img className="clay-stage__still" src={stillSrc(slug, shown.current, dark)} alt="" width={960} height={600} decoding="async" />
      {close && state !== 'failed' && hasWebGL() && (
        <Guard onError={() => setState('failed')}>
          <Suspense fallback={null}>
            <ClayStage
              slug={slug}
              steps={steps}
              progress={progress}
              active={inView && pageVisible}
              dark={dark}
              onReady={() => setState('live')}
              onFail={() => setState('failed')}
            />
          </Suspense>
        </Guard>
      )}
    </div>
  );
}

function Body({ project, children }: { project: Project; children?: ReactNode }) {
  return (
    <>
      <p className="work-row__meta">
        {project.tags.map((tag, i) => <span key={tag}>{i > 0 && <i />}{tag}</span>)}
      </p>
      <h3>
        <Link to={`/work/${project.slug}`} className="work-row__title">{project.title}</Link>
      </h3>
      <p className="work-row__desc">{project.cardDesc}</p>
      {children}
    </>
  );
}

/** Desktop: one pinned row. Text on the left, the scene (or the photos) large on the right. */
export function ClayRow({ project, steps, photos }: { project: Project; steps: ClayStep[]; photos: ReactNode }) {
  const track = useRef<HTMLElement>(null);
  const { progress } = useSectionProgress(track, { smoothing: 0.14 });
  const count = steps.length;
  const [index, setIndex] = useState(0);
  const [showPhotos, setShowPhotos] = useState(false);
  useMotionValueEvent(progress, 'change', (v) => setIndex(Math.round(stepOf(v, count))));

  const goTo = (i: number) => {
    const el = track.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + (el.offsetHeight - window.innerHeight) * progressOfStep(i, count) });
  };

  return (
    <article className="clay-row" ref={track} style={{ '--clay-steps': count } as React.CSSProperties} data-clay={project.slug}>
      <div className="work-row clay-row__pin">
        <div className="work-row__body">
          <Body project={project}>
            <div className="clay-row__step" aria-live="polite">
              <p className="clay-row__step-title">
                <span>{String(index + 1).padStart(2, '0')}</span> {steps[index].title}
              </p>
              <p className="clay-row__step-text">{steps[index].text}</p>
            </div>
            <ol className="clay-row__dots" aria-label={`${project.title}: how it works, step by step`}>
              {steps.map((s, i) => (
                <li key={s.title}>
                  <button type="button" onClick={() => goTo(i)} aria-current={i === index ? 'step' : undefined} aria-label={`Step ${i + 1} of ${count}: ${s.title}`} />
                </li>
              ))}
            </ol>
            <div className="clay-row__actions">
              <Link to={`/work/${project.slug}`} className="work-row__cta">
                View project <FiArrowUpRight aria-hidden="true" />
              </Link>
              <button type="button" className="clay-row__pill" aria-pressed={showPhotos} onClick={() => setShowPhotos((v) => !v)}>
                {showPhotos ? 'Story' : 'Photos'}
              </button>
            </div>
          </Body>
        </div>
        <div className="work-row__media clay-row__media">
          {/* The scene stays mounted under the photos, so coming back costs nothing. */}
          <div hidden={showPhotos}>
            <ClayBox slug={project.slug} steps={count} index={index} progress={progress} />
          </div>
          {showPhotos && photos}
        </div>
      </div>
    </article>
  );
}

/** Mobile, tablet and reduced-motion: the same steps as stills, one under the other. */
export function ClaySteps({ slug, title, steps }: { slug: string; title: string; steps: ClayStep[] }) {
  const dark = useThemeStore((s) => s.darkMode);
  return (
    <ol className="clay-steps" aria-label={`${title}: how it works, step by step`}>
      {steps.map((s, i) => (
        <li key={s.title}>
          <img src={stillSrc(slug, i, dark)} alt="" width={960} height={600} loading="lazy" decoding="async" />
          <p className="clay-row__step-title">
            <span>{String(i + 1).padStart(2, '0')}</span> {s.title}
          </p>
          <p className="clay-row__step-text">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}
