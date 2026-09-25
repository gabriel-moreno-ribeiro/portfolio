import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocalData } from '../../../lib/data';
import { useReducedMotion, useSectionProgress, useVisible } from '../../../lib/motion';
import useIsMobile from '../../../hooks/useIsMobile';
import Car from './Car';
import Odometer from './Odometer';
import Road, { type RoadMarker } from './Road';
import Stop from './Stop';
import StopsIndex from './StopsIndex';
import {
  buildRoadPath,
  cardSide,
  carU,
  laneX,
  nearestStop,
  progressAtU,
  type RoadGeom,
} from './geometry';
import './experience.scss';

/**
 * Professional Experience — uma estrada que desce a página, com uma parada por cargo.
 *
 * O conteúdo é HTML comum (`<ol>` de `<li>` com `<h3>`) e já está no estado final: estrada e
 * carro são decoração `aria-hidden` por cima. A geometria da estrada é medida da caixa real
 * da seção (ResizeObserver), não de um viewBox fixo — assim a linha passa exatamente pelo
 * centro de cada card mesmo que o texto quebre diferente.
 */

/** Ano do odômetro: interpola entre os anos das paradas vizinhas, para bater com a parada. */
function yearAt(u: number, stops: { u: number }[], years: number[]): number {
  if (!years.length) return 2023;
  if (u <= stops[0].u) return years[0];
  const last = stops.length - 1;
  if (u >= stops[last].u) return years[last];
  for (let i = 0; i < last; i++) {
    if (u <= stops[i + 1].u) {
      const span = stops[i + 1].u - stops[i].u || 1;
      return years[i] + ((u - stops[i].u) / span) * (years[i + 1] - years[i]);
    }
  }
  return years[last];
}

export default function Experience() {
  const { experience } = useLocalData();
  const entries = useMemo(() => [...experience].sort((a, b) => a.order - b.order), [experience]);

  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const yearRef = useRef<HTMLSpanElement>(null);

  const reduced = useReducedMotion();
  const narrow = useIsMobile(600);
  const near = useVisible(sectionRef, { rootMargin: '800px 0px', once: true });
  const entered = useVisible(sectionRef, { once: true });
  const { progress, velocity } = useSectionProgress(sectionRef, { smoothing: 0.12 });

  const years = useMemo(() => entries.map((e) => Number(e.start.slice(0, 4))), [entries]);

  const [road, setRoad] = useState<RoadGeom | null>(null);
  const [current, setCurrent] = useState(0);
  const [lit, setLit] = useState(-1);
  const [atLastStop, setAtLastStop] = useState(false);

  // ── Geometria: mede a seção e os centros das paradas, gera o path ──────────
  useLayoutEffect(() => {
    const section = sectionRef.current;
    const list = listRef.current;
    if (!section || !list || typeof ResizeObserver === 'undefined') return;

    let lastKey = '';
    const measure = () => {
      const width = section.clientWidth;
      const height = section.clientHeight;
      if (width <= 0 || height <= 0) return;
      const base = section.getBoundingClientRect().top;
      const ys = Array.from(list.children).map((li) => {
        const r = (li as HTMLElement).getBoundingClientRect();
        return r.top - base + r.height / 2;
      });
      if (!ys.length) return;

      const d = buildRoadPath(width, height, ys, narrow);
      const k = Math.min(0.9, (window.innerHeight || height) / height);
      const key = `${d}|${k.toFixed(4)}`;
      if (key === lastKey) return;
      lastKey = key;

      const us = ys.map((y) => y / height);
      const spacing = us.length > 1 ? (us[us.length - 1] - us[0]) / (us.length - 1) : 0.1;
      setRoad({
        d,
        width,
        height,
        k,
        stops: us.map((u) => ({ u, p: progressAtU(u, k) })),
        uFirst: us[0],
        uLast: us[us.length - 1],
        litWindowU: spacing * 0.38,
      });
    };

    const ro = new ResizeObserver(measure);
    ro.observe(section);
    measure();
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [narrow, entries.length]);

  // ── Odômetro e card iluminado ──────────────────────────────────────────────
  useEffect(() => {
    if (!road) return;
    const apply = () => {
      const p = reduced ? 1 : progress.get();
      const u = reduced ? road.uLast : carU(p, road);
      const { index, distance } = nearestStop(u, road.stops);
      setCurrent(index);
      setLit(distance <= road.litWindowU ? index : -1);
      setAtLastStop(u >= road.uLast - 1e-4);
      if (yearRef.current) {
        const year = String(Math.round(yearAt(u, road.stops, years)));
        if (yearRef.current.textContent !== year) yearRef.current.textContent = year;
      }
    };
    apply();
    if (reduced) return;
    let queued = false;
    return progress.on('change', () => {
      if (queued || document.hidden) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        apply();
      });
    });
  }, [road, reduced, progress, years]);

  const markers: RoadMarker[] = useMemo(() => {
    if (!road) return [];
    return entries.map((e, i) => ({
      id: e.id,
      y: road.stops[i] ? road.stops[i].u * road.height : 0,
      x: laneX(i, road.width, narrow),
      year: e.start.slice(0, 4),
      city: e.city,
      // Marco do lado de fora da curva, oposto ao card. No mobile o card é sempre à direita.
      side: narrow || cardSide(i) === 'left' ? 'right' : 'left',
    }));
  }, [road, entries, narrow]);

  const currentEntry = entries[current] ?? entries[0];

  return (
    <section className="exp" id="work-experience" ref={sectionRef}>
      <header className="exp__head">
        <div className="exp__title">
          <h2>
            Professional <em>Experience.</em>
          </h2>
          <p className="exp__sub">
            Six stops, {entries[0]?.start.slice(0, 4) ?? '2023'} &rarr; today.
          </p>
        </div>
        <StopsIndex entries={entries} currentId={currentEntry?.id ?? null} />
      </header>

      <Odometer
        ref={yearRef}
        stopNumber={current + 1}
        total={entries.length}
        org={currentEntry?.org ?? ''}
      />

      {road && (
        <Road
          d={road.d}
          width={road.width}
          height={road.height}
          markers={markers}
          narrow={narrow}
        />
      )}
      <div className="exp__car-layer" aria-hidden="true">
        <Car
          progress={progress}
          velocity={velocity}
          road={road}
          size={narrow ? 52 : 132}
          reduced={reduced}
          active={near}
          entered={entered}
          atLastStop={atLastStop}
        />
      </div>

      <ol className="exp__stops" ref={listRef}>
        {entries.map((entry, i) => (
          <Stop key={entry.id} entry={entry} side={cardSide(i)} lit={lit === i} />
        ))}
      </ol>

      <div className={`exp__end${atLastStop ? ' is-on' : ''}`}>
        <a className="exp__cta" href="#contact">
          Let&rsquo;s talk <span aria-hidden="true">&darr;</span>
        </a>
      </div>
    </section>
  );
}
