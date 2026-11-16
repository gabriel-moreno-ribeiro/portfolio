// The DOM side of a clay story: a small player. The story plays by itself while it is on
// screen (hold, travel, loop), every step is a button, and it can be paused. Desktop draws
// the live scene; phones, tablets, reduced-motion and no-WebGL get the same steps as stills.
// The words never wait for WebGL.
import { Component, lazy, Suspense, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { FiArrowUpRight, FiBox, FiPause, FiPlay } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import type { Project } from '../../../content/projects';
import { usePageVisible, useReducedMotion, useVisible } from '../../../lib/motion';
import { useThemeStore } from '../../../store/themeStore';
import labels from './labels.json';
import { HOLD_MS, stillSrc, TRAVEL_MS } from './steps';
import type { ClayStep } from './stories';
import { TagMark } from './TagMark';

const ClayStage = lazy(() => import('./ClayStage'));

const DESKTOP = '(min-width: 900px) and (hover: hover)';
type StillLabel = { t: string; x: number; y: number; dx: number; dy: number };
const LABELS = labels as Record<string, StillLabel[][]>;

/** The live 3D scene only where there is room, a pointer and no reduced-motion. */
export function useClayLive(): boolean {
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

// ── The player ──────────────────────────────────────────────────────────────
interface Player {
  index: number;
  playing: boolean;
  /** Autoplay is running right now (playing, on screen, tab visible). */
  running: boolean;
  canPlay: boolean;
  go: (i: number) => void;
  step: (d: number) => void;
  advance: () => void;
  toggle: () => void;
}

/** `active`: the stage is on screen (and showing the story). Reduced-motion never autoplays. */
function usePlayer(count: number, active: boolean): Player {
  const reduced = useReducedMotion();
  const pageVisible = usePageVisible();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const wrap = (i: number) => (i + count) % count;
  return {
    index,
    playing: playing && !reduced,
    running: playing && !reduced && active && pageVisible,
    canPlay: !reduced,
    // Picking a step by hand pauses the story where the visitor put it.
    go: (i) => {
      setIndex(wrap(i));
      setPlaying(false);
    },
    step: (d) => {
      setIndex((i) => wrap(i + d));
      setPlaying(false);
    },
    advance: () => setIndex((i) => wrap(i + 1)),
    toggle: () => setPlaying((p) => !p),
  };
}

/** Story-style progress: one segment per step, the current one fills with time. Each is a button. */
function Controls({ title, steps, player }: { title: string; steps: ClayStep[]; player: Player }) {
  const { index, playing, running } = player;
  return (
    <div className="clay-ctl" role="group" aria-label={`${title}: how it works, step by step`}>
      <ol className="clay-ctl__segs">
        {steps.map((s, i) => (
          <li key={s.title}>
            <button type="button" onClick={() => player.go(i)} aria-current={i === index ? 'step' : undefined} aria-label={`Step ${i + 1} of ${steps.length}: ${s.title}`}>
              <span
                // Remounted on every step, so the fill restarts from empty.
                key={i === index ? `on-${index}` : 'off'}
                className={i < index ? 'is-done' : i === index ? (playing ? 'is-filling' : 'is-done') : undefined}
                style={i === index && playing ? { animationDuration: `${HOLD_MS + TRAVEL_MS}ms`, animationPlayState: running ? 'running' : 'paused' } : undefined}
                onAnimationEnd={i === index ? player.advance : undefined}
              />
            </button>
          </li>
        ))}
      </ol>
      {player.canPlay && (
        <button type="button" className="clay-ctl__play" onClick={player.toggle} aria-label={playing ? 'Pause the story' : 'Play the story'}>
          {playing ? <FiPause aria-hidden="true" /> : <FiPlay aria-hidden="true" />}
        </button>
      )}
    </div>
  );
}

function Caption({ steps, player }: { steps: ClayStep[]; player: Player }) {
  const { index } = player;
  // Announced only when the visitor is stepping by hand; autoplay would chatter.
  return (
    <div className="clay-row__step" aria-live={player.playing ? 'off' : 'polite'}>
      <p className="clay-row__step-title">
        <span>{String(index + 1).padStart(2, '0')}</span> {steps[index].title}
      </p>
      <p className="clay-row__step-text">{steps[index].text}</p>
    </div>
  );
}

/** ← → step through the story from anywhere inside the player. */
const arrows = (player: Player) => (e: KeyboardEvent) => {
  if ((e.target as HTMLElement).tagName === 'VIDEO' || e.altKey || e.metaKey || e.ctrlKey) return;
  if (e.key === 'ArrowRight') player.step(1);
  else if (e.key === 'ArrowLeft') player.step(-1);
  else return;
  e.preventDefault();
};

// ── The stage ───────────────────────────────────────────────────────────────
/** The still of a step with its labels as real text over it. The one leaving stays beneath while the new one fades in. */
function Still({ slug, index, dark }: { slug: string; index: number; dark: boolean }) {
  const [{ cur, under }, set] = useState({ cur: index, under: index });
  if (cur !== index) set({ cur: index, under: cur });
  const frame = (i: number, cls: string) => (
    <div key={i} className={`clay-stage__still ${cls}`}>
      <img src={stillSrc(slug, i, dark)} alt="" width={1280} height={800} decoding="async" />
      {(LABELS[slug]?.[i] ?? []).map((l) => (
        <div key={l.t} className="clay-tag" style={{ left: `${l.x}%`, top: `${l.y}%` }}>
          <TagMark dx={l.dx} dy={l.dy}>{l.t}</TagMark>
        </div>
      ))}
    </div>
  );
  return (
    <>
      {under !== cur && frame(under, 'is-under')}
      {frame(cur, under !== cur ? 'is-in' : '')}
    </>
  );
}

/** The scene's box: the still of the current step first, the live canvas over it once it has drawn. */
function Stage({ slug, label, index, live, onVisible }: { slug: string; label: string; index: number; live: boolean; onVisible: (v: boolean) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useVisible(ref, { rootMargin: '60% 0px', once: true });
  // The story plays while most of the stage is on screen.
  const inView = useVisible(ref, { threshold: 0.6 });
  const pageVisible = usePageVisible();
  const dark = useThemeStore((s) => s.darkMode);
  const [state, setState] = useState<'still' | 'live' | 'failed'>('still');
  // The floor of the scene is the page: read its colour, again when the theme changes.
  const [bg, setBg] = useState('');
  useEffect(() => setBg(getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || (dark ? '#14100d' : '#fff8f4')), [dark]);
  useEffect(() => onVisible(inView), [inView]); // eslint-disable-line react-hooks/exhaustive-deps
  // Once the canvas is live the still stops following the steps (it is faded out).
  const shown = useRef(index);
  if (state !== 'live') shown.current = index;

  return (
    <div className={`clay-stage clay-stage--${state}`} ref={ref} tabIndex={0} role="img" aria-label={label}>
      <Still slug={slug} index={shown.current} dark={dark} />
      {live && close && bg && state !== 'failed' && hasWebGL() && (
        <Guard onError={() => setState('failed')}>
          <Suspense fallback={null}>
            <ClayStage slug={slug} target={index} active={inView && pageVisible} dark={dark} bg={bg} onReady={() => setState('live')} onFail={() => setState('failed')} />
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

const stageLabel = (project: Project, steps: ClayStep[], i: number) => `${project.title}, how it works. Step ${i + 1} of ${steps.length}: ${steps[i].title}`;

/**
 * Desktop: text on the left; on the right the scene, and under it a strip with the story
 * tile and one thumbnail per photo. A thumbnail opens that photo in the scene's box.
 */
export function ClayRow({ project, steps, photos }: { project: Project; steps: ClayStep[]; photos: (index: number, onIndex: (i: number) => void) => ReactNode }) {
  const gallery = project.gallery ?? [];
  const [photo, setPhoto] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);
  const player = usePlayer(steps.length, visible && photo === null);
  const storyTile = useRef<HTMLButtonElement>(null);
  const onStep = arrows(player);

  const onKeyDown = (e: KeyboardEvent) => {
    if (photo === null) return onStep(e);
    if ((e.target as HTMLElement).tagName === 'VIDEO') return;
    // With a photo open the arrows turn the photos, and Escape goes back to the story.
    if (e.key === 'Escape') {
      setPhoto(null);
      storyTile.current?.focus();
    } else if (e.key === 'ArrowRight') setPhoto((photo + 1) % gallery.length);
    else if (e.key === 'ArrowLeft') setPhoto((photo - 1 + gallery.length) % gallery.length);
    else return;
    e.preventDefault();
  };
  // Choosing a step always brings the story back.
  const stepping: Player = { ...player, go: (i) => (setPhoto(null), player.go(i)) };

  return (
    <article className="work-row clay-row" data-clay={project.slug} onKeyDown={onKeyDown}>
      <div className="work-row__body">
        <Body project={project}>
          <Caption steps={steps} player={player} />
          <Controls title={project.title} steps={steps} player={stepping} />
          <Link to={`/work/${project.slug}`} className="work-row__cta">
            View project <FiArrowUpRight aria-hidden="true" />
          </Link>
        </Body>
      </div>
      <div className="work-row__media clay-row__media">
        <div className="clay-row__box">
          {/* The scene stays mounted under the photo, so coming back costs nothing. */}
          <div hidden={photo !== null}>
            <Stage slug={project.slug} label={stageLabel(project, steps, player.index)} index={player.index} live onVisible={setVisible} />
          </div>
          {photo !== null && photos(photo, setPhoto)}
        </div>
        {gallery.length > 0 && (
          <ul className="clay-strip" aria-label={`${project.title}: the story and ${gallery.length} photos`}>
            <li>
              <button ref={storyTile} type="button" className="clay-strip__story" onClick={() => setPhoto(null)} aria-pressed={photo === null} aria-label="The 3D story">
                <FiBox aria-hidden="true" />
              </button>
            </li>
            {gallery.map((file, i) => (
              <li key={file}>
                <button type="button" onClick={() => setPhoto(i)} aria-pressed={photo === i} aria-label={`Photo ${i + 1} of ${gallery.length}${project.captions?.[file] ? `: ${project.captions[file]}` : ''}`}>
                  <img
                    src={`/work/${project.slug}/thumbs/${file.replace(/\.\w+$/, '.webp')}`}
                    alt=""
                    width={60}
                    height={40}
                    loading="lazy"
                    decoding="async"
                    style={project.focus?.[file] ? { objectPosition: project.focus[file] } : undefined}
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

/** Phones, tablets and reduced-motion: one still that the same step buttons switch in place. */
export function ClayPlayer({ project, steps }: { project: Project; steps: ClayStep[] }) {
  const [visible, setVisible] = useState(false);
  const player = usePlayer(steps.length, visible);
  return (
    <div className="clay-player" onKeyDown={arrows(player)}>
      <Stage slug={project.slug} label={stageLabel(project, steps, player.index)} index={player.index} live={false} onVisible={setVisible} />
      <Controls title={project.title} steps={steps} player={player} />
      <Caption steps={steps} player={player} />
    </div>
  );
}
