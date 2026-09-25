import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocalData } from '../../../lib/data';
import { useReducedMotion, useSectionProgress, useVisible } from '../../../lib/motion';
import useIsMobile from '../../../hooks/useIsMobile';
import Car, { type CarHandle } from './Car';
import Odometer from './Odometer';
import Road, { type RoadMarker } from './Road';
import Stop from './Stop';
import { buildRoad, cardSide, carTargetY, laneX, nearestStop, type RoadGeom } from './geometry';
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
  const carRef = useRef<CarHandle>(null);

  const reduced = useReducedMotion();
  const narrow = useIsMobile(600);
  const near = useVisible(sectionRef, { rootMargin: '800px 0px', once: true });
  const entered = useVisible(sectionRef, { once: true });
  // `progress`/`raw` só disparam o loop; a posição sai do rect ao vivo, suavizada aqui
  // (ver K_SCROLL). Ler o rect direto, sem lerp, fazia o carro pular junto com cada clique
  // da roda do mouse — o deslocamento por quadro era 0 px na maioria dos frames e 43 px nos
  // outros. `smoothing` baixo mantém `progress` mudando por mais tempo depois do scroll.
  const { progress, raw } = useSectionProgress(sectionRef, { smoothing: 0.07 });

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
      const { d, segments } = buildRoad(width, height, ys, narrow);
      if (d === lastD) return;
      lastD = d;

      const spacing = ys.length > 1 ? (ys[ys.length - 1] - ys[0]) / (ys.length - 1) : height * 0.1;
      setRoad({ d, segments, width, height, stopYs: ys, litWindowPx: spacing * 0.38 });
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
    const cta = section.querySelector<HTMLElement>('.exp__card-cta');
    const hazard = section.querySelector<HTMLElement>('.exp__hazard');
    const last = road.stopYs[road.stopYs.length - 1] ?? 0;
    const prev = { lit: -2, current: -2, year: '', atLast: null as boolean | null };
    // Rolagem suavizada: é ela, e não o scroll cru, que posiciona o carro.
    const motion = { scrolled: Number.NaN, previous: 0 };

    // Posição da seção no documento, em cache. Chamar `getBoundingClientRect()` dentro do
    // rAF forçava layout do documento inteiro sempre que outra seção estava montando
    // (medido: 94 ms num frame sob CPU 4×). O ResizeObserver no `body` pega qualquer
    // mudança de altura acima da seção, que é a única coisa que move esse valor.
    let docTop = 0;
    const refreshDocTop = () => {
      docTop = section.getBoundingClientRect().top + window.scrollY;
    };
    refreshDocTop();
    const bodyRO = new ResizeObserver(refreshDocTop);
    bodyRO.observe(document.documentElement);
    window.addEventListener('resize', refreshDocTop, { passive: true });

    const apply = (): boolean => {
      // ---- leituras: nenhuma leitura de layout aqui (só `scrollY`), antes das escritas ----
      const top = reduced ? 0 : docTop - window.scrollY;
      const vh = window.innerHeight;
      const onScreen = top < vh && top + road.height > 0;
      // ---- conta ----
      // ---- suavização própria do scroll ----
      const rawScrolled = -top;
      if (Number.isNaN(motion.scrolled)) motion.scrolled = rawScrolled;
      motion.scrolled += (rawScrolled - motion.scrolled) * K_SCROLL;
      const speed = reduced ? 0 : Math.abs(motion.scrolled - motion.previous); // px por quadro
      motion.previous = motion.scrolled;
      const y = reduced ? last : carTargetY({ top: -motion.scrolled, vh }, road);
      const { index, distance } = nearestStop(y, road.stopYs);
      const litIndex = distance <= road.litWindowPx ? index : -1;
      const atLast = y >= last - 0.5;
      const year = String(Math.round(yearAt(y, road.stopYs, years)));
      // ---- escritas ----
      const settled = carRef.current ? carRef.current.draw(y, speed) : true;
      if (litIndex !== prev.lit) {
        if (prev.lit >= 0) stops[prev.lit]?.classList.remove('is-lit');
        if (litIndex >= 0) stops[litIndex]?.classList.add('is-lit');
        prev.lit = litIndex;
      }
      if (index !== prev.current && stopRef.current) {
        stopRef.current.textContent = `stop ${index + 1}/${entries.length} · ${entries[index]?.org ?? ''}`;
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
      return (settled && Math.abs(rawScrolled - motion.scrolled) < 0.3) || !onScreen;
    };

    apply();
    if (reduced) return;

    // O rAF continua enquanto os lerps (inclinação, rodas, sombra, cone) ainda não
    // assentaram — é isso que faz o carro rolar até parar depois que o scroll para. Para
    // sozinho quando assenta, quando a seção sai da tela e com a aba oculta.
    let queued = false;
    let raf = 0;
    const tick = () => {
      queued = false;
      raf = 0;
      if (document.hidden) return;
      if (!apply()) {
        queued = true;
        raf = requestAnimationFrame(tick);
      }
    };
    const wake = () => {
      if (queued || document.hidden) return;
      queued = true;
      raf = requestAnimationFrame(tick);
    };
    const unsubP = progress.on('change', wake);
    const unsubR = raw.on('change', wake);
    return () => {
      unsubP();
      unsubR();
      bodyRO.disconnect();
      window.removeEventListener('resize', refreshDocTop);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [road, reduced, progress, raw, years, entries]);

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
        <h2>
          Professional <em>Experience.</em>
        </h2>
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

/** Quanto do erro de rolagem some por quadro. Menor = carro mais "solto" atrás do scroll. */
const K_SCROLL = 0.085;

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
