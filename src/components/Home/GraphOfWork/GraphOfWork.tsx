// Graph of work — a three-step story: a profile file (Extract), the knowledge graph read
// out of it (Connect), and the part of the graph that is this year (Now).
//
// Two layouts. Stacked is the default and the fallback: the three steps one under the
// other, everything in its final state, no script needed. On a wide, tall screen without
// reduced-motion the section pins (CSS sticky) and a GSAP ScrollTrigger scrubs one
// timeline over it; only transform and opacity are tweened.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import useIsMobile from '../../../hooks/useIsMobile';
import { useLocalData } from '../../../lib/data';
import { useReducedMotion, useVisible } from '../../../lib/motion';
import { BOX, buildGraph, type Layout, type Place, type WorkGraph } from './graph';
import './graphOfWork.scss';

const STEPS = [
  {
    title: 'Extract',
    text: 'Start from the plain record: what this site already says about me, as one file. Every organisation, project and award it names gets picked out.',
  },
  {
    title: 'Connect',
    text: 'Each name becomes a node, and each sentence becomes a link between two of them. A name that shows up more than once is still one node.',
  },
  {
    title: 'Now',
    text: 'Most of the graph is history. The part that stays lit is what I am working on this year.',
  },
];

const PANEL_NAMES = ['profile.md', 'relations', 'graph'];

// Pinning needs room for the two columns and for the whole file on one screen.
const PIN_QUERY = '(min-width: 1024px) and (min-height: 700px)';
// How far into its third of the scroll a step has finished arriving (where the buttons land).
const SETTLED = 0.9;

function useMedia(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

function Doc({ g }: { g: WorkGraph }) {
  return (
    <ol className="gow-doc">
      {g.lines.map((line, i) => (
        <li key={i} className={`gow-doc__line gow-doc__line--${line.kind}`}>
          {line.kind === 'h1' ? '# ' : line.kind === 'h2' ? '## ' : ''}
          {g.mentions(line.text).map((m, j) =>
            m.node ? (
              <mark key={j} className="gow-ent" data-node={m.node}>
                <span className="gow-ent__bg" aria-hidden="true" />
                {m.text}
              </mark>
            ) : (
              m.text
            ),
          )}
        </li>
      ))}
    </ol>
  );
}

const LINE = 16;

/** A node's label on one side of its dot. On the phone layout "A - B" breaks into two lines. */
function NodeLabel({ text, place, gap, wrap }: { text: string; place: Place; gap: number; wrap: boolean }) {
  const lines = wrap ? text.split(' - ') : [text];
  const side = place === 'left' || place === 'right';
  const x = place === 'left' ? -gap : place === 'right' ? gap : 0;
  // Baseline of the first line: stacked upward above the dot, downward below, centred beside it.
  const y = place === 'above' ? -gap - 1 - (lines.length - 1) * LINE : place === 'below' ? gap + 10 : 5 - ((lines.length - 1) * LINE) / 2;
  return (
    <text className="gow-node__label" y={y} textAnchor={side ? (place === 'left' ? 'end' : 'start') : 'middle'}>
      {lines.map((line, i) => (
        <tspan key={line} x={x} dy={i ? LINE : 0}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

/** `now`: mark what he is doing now. `dim`: and fade the rest (the pinned layout tweens that itself). */
function Graph({ g, layout, now, dim }: { g: WorkGraph; layout: Layout; now?: boolean; dim?: boolean }) {
  const [w, h] = BOX[layout];
  const li = layout === 'wide' ? 0 : 1;
  const node = (id: string) => g.nodes.find((n) => n.id === id)!;
  const radius = (id: string) => (id === 'gabriel' ? 11 : 7);

  return (
    <svg
      className={`gow-graph gow-graph--${layout}${now ? ' gow-graph--now' : ''}${dim ? ' gow-graph--dim' : ''}`}
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={
        now
          ? `The same graph with what I am doing now marked: ${g.nodes.filter((n) => n.now && n.id !== 'gabriel').map((n) => n.label).join(', ')}.`
          : `Knowledge graph with ${g.nodes.length} entities and ${g.edges.length} relations. The relations are listed after the figure.`
      }
    >
      {g.edges.map((e) => {
        const [x1, y1] = node(e.from)[layout];
        const [x2, y2] = node(e.to)[layout];
        const dist = Math.hypot(x2 - x1, y2 - y1);
        const start = radius(e.from) + 3;
        const len = dist - start - radius(e.to) - 4;
        const t = e.at?.[li] ?? 0.5;
        return (
          <g key={`${e.from}-${e.to}`} className="gow-edge" data-now={Boolean(node(e.from).now && node(e.to).now)}>
            <g transform={`translate(${x1} ${y1}) rotate(${(Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI}) translate(${start} 0)`}>
              {/* Drawn by scaling from its start point, never by dash offset. */}
              <line className="gow-edge__line" x2={len} />
              <path className="gow-edge__tip" d={`M${len - 6} -3.5L${len} 0L${len - 6} 3.5`} />
            </g>
            <text className="gow-edge__label" x={x1 + (x2 - x1) * t} y={y1 + (y2 - y1) * t} dy="0.32em" textAnchor="middle">
              {e.label}
            </text>
          </g>
        );
      })}
      {g.nodes.map((n) => {
        const [x, y] = n[layout];
        const r = radius(n.id);
        return (
          // The outer group holds the position; the inner ones are free to be tweened.
          <g key={n.id} transform={`translate(${x} ${y})`}>
            <g className="gow-node" data-node={n.id} data-x={x} data-y={y}>
              <g className={`gow-node__in gow-node__in--${n.kind}`} data-now={Boolean(n.now)}>
                {n.now && <circle className="gow-node__halo" r={r + 5} />}
                <circle className="gow-node__dot" r={r} />
                <NodeLabel text={n.label} place={n.place?.[li] ?? 'below'} gap={r + 7} wrap={layout === 'tall'} />
              </g>
            </g>
          </g>
        );
      })}
    </svg>
  );
}

function Panel({ name, meta, children }: { name: string; meta?: string; children: ReactNode }) {
  return (
    <div className="gow-panel">
      <div className="gow-panel__bar">
        <span>{name}</span>
        {meta && <span>{meta}</span>}
      </div>
      {children}
    </div>
  );
}

export default function GraphOfWork() {
  const local = useLocalData();
  const g = useMemo(() => buildGraph(local), [local]);
  const reduced = useReducedMotion();
  const roomy = useMedia(PIN_QUERY);
  const phone = useIsMobile(600);
  const [failed, setFailed] = useState(false); // GSAP did not load: stay stacked
  const pinned = roomy && !reduced && !failed;

  const ref = useRef<HTMLElement>(null);
  const near = useVisible(ref, { rootMargin: '50% 0px', once: true });
  const [step, setStep] = useState(2); // final state until the scroll says otherwise
  const range = useRef<{ start: number; end: number } | null>(null);

  useEffect(() => {
    const section = ref.current;
    if (!pinned || !near || !section) return;
    let dead = false;
    let cleanup: (() => void) | undefined;

    Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
      .then(([{ gsap }, { ScrollTrigger }]) => {
        if (dead) return;
        gsap.registerPlugin(ScrollTrigger);
        const svg = section.querySelector<SVGSVGElement>('.gow-graph')!;

        // Where a node starts its flight: on top of its first mention in the file.
        const lift = (axis: 'x' | 'y') => (_i: number, el: SVGElement) => {
          const mention = section.querySelector(`.gow-doc [data-node="${el.dataset.node}"]`);
          const ctm = svg.getScreenCTM();
          if (!mention || !ctm) return 0;
          const r = mention.getBoundingClientRect();
          const p = new DOMPoint(r.left + r.width / 2, r.top + r.height / 2).matrixTransform(ctm.inverse());
          return p[axis] - Number(el.dataset[axis]);
        };

        const ctx = gsap.context(() => {
          const marks = gsap.utils.toArray<HTMLElement>('.gow-ent__bg');
          // One unit of timeline per step. Each tween owns its element/property pair, so
          // scrubbing back and forth never leaves two tweens fighting over a value.
          const tl = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              trigger: section,
              start: 'top top',
              end: 'bottom bottom',
              scrub: 0.5,
              invalidateOnRefresh: true,
              onUpdate: (self) => setStep(Math.min(2, Math.floor(self.progress * 3))),
            },
          });
          // Staggers are spelled out as one tween per element: under scrub, the `stagger`
          // option left every element but the first in its end state.
          const each = <T extends Element>(sel: string | T[], at: number, gap: number, add: (el: T, t: number) => void) =>
            gsap.utils.toArray<T>(sel).forEach((el, i) => add(el, at + i * gap));

          // 1. Extract: the names light up, in reading order.
          each(marks, 0.05, 0.7 / marks.length, (el, t) => tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.1 }, t));
          // 2. Connect: the file gives way, the names fly to their places, the links draw.
          tl.fromTo('.gow-doc', { opacity: 1 }, { opacity: 0, duration: 0.35 }, 1.1)
            .fromTo('.gow-node', { opacity: 0 }, { opacity: 1, duration: 0.08 }, 1.02);
          each<SVGElement>('.gow-node', 1.1, 0.012, (el, t) =>
            tl.fromTo(el, { x: lift('x'), y: lift('y') }, { x: 0, y: 0, duration: 0.4, ease: 'power2.inOut' }, t));
          each('.gow-edge__line', 1.5, 0.012, (el, t) =>
            tl.fromTo(el, { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: 0.25 }, t));
          tl.fromTo('.gow-edge__tip, .gow-edge__label', { opacity: 0 }, { opacity: 1, duration: 0.15 }, 1.85)
            // 3. Now: everything that is not this year steps back.
            .fromTo('[data-now="false"]', { opacity: 1 }, { opacity: 0.28, duration: 0.35 }, 2.1)
            .fromTo('.gow-node__halo', { opacity: 0 }, { opacity: 1, duration: 0.2 }, 2.2)
            .fromTo('.gow__caption', { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25 }, 2.3)
            .set({}, {}, 3);

          const st = tl.scrollTrigger!;
          range.current = st;
          setStep(Math.min(2, Math.floor(st.progress * 3)));
        }, section);

        // Sections above mount lazily and change height; keep the scroll range honest.
        const ro = new ResizeObserver(() => ScrollTrigger.refresh());
        ro.observe(document.body);
        cleanup = () => {
          ro.disconnect();
          ctx.revert();
        };
      })
      .catch(() => setFailed(true));

    return () => {
      dead = true;
      range.current = null;
      cleanup?.();
    };
  }, [pinned, near]);

  const jump = (i: number) => {
    const r = range.current;
    if (r) window.scrollTo({ top: r.start + ((r.end - r.start) * (i + SETTLED)) / 3, behavior: 'smooth' });
  };

  const meta = `${g.nodes.length} entities · ${g.edges.length} relations`;
  const caption = (
    <p className="gow__caption">
      <span className="gow__caption-tag">now</span> Building {g.now.building}. {g.now.summary}
    </p>
  );
  const label = (id: string) => g.nodes.find((n) => n.id === id)?.label;

  return (
    <section id="graph" className={`gow ${pinned ? 'gow--pinned' : 'gow--stacked'}`} aria-labelledby="graph-title" ref={ref}>
      <div className="gow__stage">
        <div className="gow__copy">
          <h2 id="graph-title" className="section-title gow__title">
            Graph of <em>work</em>
          </h2>
          <ol className="gow__steps">
            {STEPS.map((s, i) => (
              <li key={s.title} className="gow__step" data-active={step === i}>
                <span className="gow__step-n" aria-hidden="true">
                  0{i + 1}
                </span>
                <h3 className="gow__step-title">{s.title}</h3>
                <p className="gow__step-text">{s.text}</p>
                {!pinned && (
                  // One graph only (in Now): Connect shows a few of the relations as text.
                  <Panel name={PANEL_NAMES[i]} meta={i === 2 ? meta : undefined}>
                    {i === 0 && <Doc g={g} />}
                    {i === 1 && (
                      <ul className="gow-triples">
                        {g.edges.slice(0, 5).map((e) => (
                          <li key={`${e.from}-${e.to}`}>
                            <span className="gow-triples__ent">{label(e.from)}</span> {e.label}{' '}
                            <span className="gow-triples__ent">{label(e.to)}</span>
                          </li>
                        ))}
                        <li>+ {g.edges.length - 5} more, in the graph below</li>
                      </ul>
                    )}
                    {i === 2 && <Graph g={g} layout={phone ? 'tall' : 'wide'} now dim />}
                    {i === 2 && caption}
                  </Panel>
                )}
              </li>
            ))}
          </ol>
          {pinned && (
            <div className="gow__seg" role="group" aria-label="Jump to a step">
              {STEPS.map((s, i) => (
                <button key={s.title} type="button" className="gow__seg-btn" aria-current={step === i ? 'step' : undefined} onClick={() => jump(i)}>
                  {s.title}
                </button>
              ))}
            </div>
          )}
        </div>
        {pinned && (
          <Panel name={PANEL_NAMES[step]} meta={meta}>
            <div className="gow-panel__layers">
              <Doc g={g} />
              <Graph g={g} layout="wide" now />
            </div>
            {caption}
          </Panel>
        )}
      </div>

      <div className="sr-only">
        <h3>Relations in the graph</h3>
        <ul>
          {g.edges.map((e) => (
            <li key={`${e.from}-${e.to}`}>
              {label(e.from)}, {e.label.replace(/_/g, ' ')}, {label(e.to)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
