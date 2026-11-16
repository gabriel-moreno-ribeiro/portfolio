// A project diorama: the poster and the labels are plain HTML and are always there.
// The canvas is an upgrade that mounts on top only when it can run (near the
// viewport, WebGL works, motion allowed) and unmounts, disposing itself, when it can't.
import { animate, motionValue, type MotionValue } from 'motion/react';
import { Component, lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useReducedMotion, useVisible } from '../../lib/motion';
import { useThemeStore } from '../../store/themeStore';
import { dioramas, project } from './steps';
import './dioramas.scss';

const DioramaCanvas = lazy(() => import('./DioramaCanvas'));

const REPLAY_S = 6;

// Asked once: without WebGL the canvas is never mounted, so nothing throws.
let webgl: boolean | undefined;
function hasWebGL() {
  if (webgl === undefined) {
    try {
      const c = document.createElement('canvas');
      webgl = !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch { webgl = false; }
  }
  return webgl;
}

/** The canvas failed anyway (context refused, chunk didn't load): render nothing, the poster stays. */
class CanvasGuard extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

interface Props {
  slug: string;
  /** Mount the live canvas (when the browser allows it). */
  live?: boolean;
  /** Scroll progress 0..1 driving the scene. Without it a live scene replays once. */
  progress?: MotionValue<number>;
  /** Labels of later steps stay hidden. Default: all shown. */
  activeStep?: number;
}

export default function Diorama({ slug, live = false, progress, activeStep }: Props) {
  const spec = dioramas[slug];
  const ref = useRef<HTMLDivElement>(null);
  const near = useVisible(ref, { rootMargin: '300px' });
  const reduced = useReducedMotion();
  const dark = useThemeStore((s) => s.darkMode);
  const [ready, setReady] = useState(false);
  const replay = useMemo(() => motionValue(1), []);
  const mounted = live && near && !reduced && hasWebGL();

  useEffect(() => { if (!mounted) setReady(false); }, [mounted]);

  // No scroll to follow (the home card): play the scene through once.
  useEffect(() => {
    if (!ready || progress) return;
    replay.set(0);
    const run = animate(replay, 1, { duration: REPLAY_S, ease: 'linear' });
    return () => { run.stop(); replay.set(1); };
  }, [ready, progress, replay]);

  if (!spec) return null;
  const last = spec.steps.length - 1;
  const step = ready && activeStep !== undefined ? activeStep : last;

  return (
    <div ref={ref} className={`diorama${ready ? ' is-live' : ''}`}>
      <img
        className="diorama__poster"
        src={`/work/${slug}/diorama-${dark ? 'dark' : 'light'}.webp`}
        alt={spec.alt}
        width={1280}
        height={800}
        loading="lazy"
        decoding="async"
      />
      {mounted && (
        <div className="diorama__canvas">
          <CanvasGuard>
            <Suspense fallback={null}>
              <DioramaCanvas slug={slug} dark={dark} progress={progress ?? replay} onReady={() => setReady(true)} />
            </Suspense>
          </CanvasGuard>
        </div>
      )}
      {/* the picture is described by its alt and by the steps beside it */}
      <div className="diorama__labels" aria-hidden="true">
        {spec.labels.map((l) => (
          <span
            key={l.text}
            className={`diorama__label diorama__label--${l.side ?? 'up'}${l.step > step ? ' is-off' : ''}`}
            style={{ ...project(l.at), ['--lead' as string]: `${l.lead ?? 30}px` }}
          >
            <b>{l.text}</b>
          </span>
        ))}
      </div>
    </div>
  );
}
