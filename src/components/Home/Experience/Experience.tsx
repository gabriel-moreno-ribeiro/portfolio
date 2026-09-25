import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocalData } from '../../../lib/data';
import { useReducedMotion, useSectionProgress, useVisible } from '../../../lib/motion';
import useIsMobile from '../../../hooks/useIsMobile';
import Car, { type CarHandle } from './Car';
import Odometer from './Odometer';
import Road, { type RoadMarker } from './Road';
import Stop from './Stop';
import StopsIndex from './StopsIndex';
import { buildRoadPath, cardSide, carTargetY, laneX, nearestStop, type RoadGeom } from './geometry';
import './experience.scss';

/**
 * Professional Experience — uma estrada que desce a página, com uma parada por cargo.
 *
 * O conteúdo é HTML comum (`<ol>` de `<li>` com `<h3>`) e já está no estado final: estrada e
 * carro são decoração `aria-hidden` por cima. A geometria da estrada é medida da caixa real
 * da seção (ResizeObserver), não de um viewBox fixo — assim a linha passa exatamente pelo
 * centro de cada card mesmo que o texto quebre diferente.
 *
 * **Nada aqui re-renderiza durante o scroll.** Um único rAF por frame: lê o rect da seção
 * (uma leitura, antes de qualquer escrita) e depois escreve tudo direto no DOM — transform do
 * carro, classes `is-lit`, texto do odômetro, `aria-current` do índice. O que existia antes
 * (`setState` por frame) custava até 799 ms de scheduler do React num frame sob CPU 4×.
 */

export default function Experience() {
  const { experience } = useLocalData();
  const entries = useMemo(() => [...experience].sort((a, b) => a.order - b.order), [experience]);
  const years = useMemo(() => entries.map((e) => Number(e.start.slice(0, 4))), [entries]);

  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const yearRef = useRef<HTMLSpanElement>(null);
  const stopRef = useRef<HTMLSpanElement>(null);
  const indexRef = useRef<HTMLElement>(null);
  const carRef = useRef<CarHandle>(null);

  const reduced = useReducedMotion();
  const narrow = useIsMobile(600);
  const near = useVisible(sectionRef, { rootMargin: '800px 0px', once: true });
  const entered = useVisible(sectionRef, { once: true });
  const { progress, velocity } = useSectionProgress(sectionRef, { smoothing: 0.12 });

  const [road, setRoad] = useState<RoadGeom | null>(null);

  // ── Geometria: mede a seção e os centros das paradas, gera o path ──────────
  useLayoutEffect(() => {
    const section = sectionRef.current;
    const list = listRef.current;
    if (!section || !list || typeof ResizeObserver === 'undefined') return;

    let lastD = '';
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

      // `d` embute largura, altura e paradas: se ele não mudou, não há nada a refazer
      // (e assim o ResizeObserver não vira trabalho de React durante o scroll).
      const d = buildRoadPath(width, height, ys, narrow);
      if (d === lastD) return;
      lastD = d;

      const spacing = ys.length > 1 ? (ys[ys.length - 1] - ys[0]) / (ys.length - 1) : height * 0.1;
      setRoad({ d, width, height, stopYs: ys, litWindowPx: spacing * 0.38 });
    };

    const ro = new ResizeObserver(measure);
    ro.observe(section);
    measure();
    return () => ro.disconnect();
  }, [narrow, entries.length]);

  // ── Um rAF: lê o rect uma vez, depois escreve. Zero render do React. ───────
  useEffect(() => {
    const section = sectionRef.current;
    const list = listRef.current;
    if (!road || !section || !list) return;

    const stops = Array.from(list.children) as HTMLElement[];
    const links = indexRef.current ? Array.from(indexRef.current.querySelectorAll('a')) : [];
    const cta = section.querySelector<HTMLElement>('.exp__card-cta');
    const hazard = section.querySelector<HTMLElement>('.exp__hazard');
    const last = road.stopYs[road.stopYs.length - 1] ?? 0;
    const prev = { lit: -2, current: -2, year: '', atLast: null as boolean | null };

    const apply = () => {
      // ---- leituras (uma só, antes de qualquer escrita) ----
      const top = reduced ? 0 : section.getBoundingClientRect().top;
      const vh = window.innerHeight;
      // ---- conta ----
      const y = reduced ? last : carTargetY({ top, vh }, road);
      const speed = reduced ? 0 : Math.abs(velocity.get());
      const { index, distance } = nearestStop(y, road.stopYs);
      const litIndex = distance <= road.litWindowPx ? index : -1;
      const atLast = y >= last - 0.5;
      const year = String(Math.round(yearAt(y, road.stopYs, years)));
      // ---- escritas ----
      carRef.current?.draw(y, speed);
      if (litIndex !== prev.lit) {
        if (prev.lit >= 0) stops[prev.lit]?.classList.remove('is-lit');
        if (litIndex >= 0) stops[litIndex]?.classList.add('is-lit');
        prev.lit = litIndex;
      }
      if (index !== prev.current) {
        if (stopRef.current) {
          stopRef.current.textContent = `stop ${index + 1}/${entries.length} · ${entries[index]?.org ?? ''}`;
        }
        // O índice do cabeçalho está em ordem inversa (mais recente primeiro).
        links[links.length - 1 - prev.current]?.removeAttribute('aria-current');
        links[links.length - 1 - index]?.setAttribute('aria-current', 'true');
        prev.current = index;
      }
      if (year !== prev.year && yearRef.current) {
        yearRef.current.textContent = year;
        prev.year = year;
      }
      if (atLast !== prev.atLast) {
        cta?.classList.toggle('is-on', atLast);
        hazard?.classList.toggle('is-on', atLast);
        prev.atLast = atLast;
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
  }, [road, reduced, progress, velocity, years, entries]);

  const markers: RoadMarker[] = useMemo(() => {
    if (!road) return [];
    return entries.map((e, i) => ({
      id: e.id,
      y: road.stopYs[i] ?? 0,
      x: laneX(i, road.width, narrow),
      year: e.start.slice(0, 4),
      city: e.city,
      // Marco do lado de fora da curva, oposto ao card. No mobile o card é sempre à direita.
      side: narrow || cardSide(i) === 'left' ? 'right' : 'left',
    }));
  }, [road, entries, narrow]);

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
        <StopsIndex ref={indexRef} entries={entries} />
      </header>

      <Odometer
        yearRef={yearRef}
        stopRef={stopRef}
        firstYear={years[0] ?? 2023}
        total={entries.length}
        firstOrg={entries[0]?.org ?? ''}
      />

      {road && (
        <Road d={road.d} width={road.width} height={road.height} markers={markers} narrow={narrow} />
      )}
      <div className="exp__car-layer" aria-hidden="true">
        <Car
          ref={carRef}
          road={road}
          size={narrow ? 52 : 132}
          reduced={reduced}
          active={near}
          entered={entered}
        />
      </div>

      <ol className="exp__stops" ref={listRef}>
        {entries.map((entry, i) => (
          <Stop key={entry.id} entry={entry} side={cardSide(i)} cta={i === entries.length - 1} />
        ))}
      </ol>
    </section>
  );
}

/** Ano do odômetro: interpola entre os anos das paradas vizinhas, para bater com a parada. */
function yearAt(y: number, stopYs: number[], years: number[]): number {
  if (!years.length) return 2023;
  if (y <= stopYs[0]) return years[0];
  const last = stopYs.length - 1;
  if (y >= stopYs[last]) return years[last];
  for (let i = 0; i < last; i++) {
    if (y <= stopYs[i + 1]) {
      const span = stopYs[i + 1] - stopYs[i] || 1;
      return years[i] + ((y - stopYs[i]) / span) * (years[i + 1] - years[i]);
    }
  }
  return years[last];
}
