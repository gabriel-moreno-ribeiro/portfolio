import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useLocalData } from '../../../lib/data';
import { useReducedMotion, useVisible } from '../../../lib/motion';
import useIsMobile from '../../../hooks/useIsMobile';
import Car, { type CarHandle } from './Car';
import Odometer from './Odometer';
import Road, { type RoadMarker } from './Road';
import Stop from './Stop';
import { CARD_GAP, buildRoad, cardSide, carTargetY, nearestStop, roadHalf, type RoadGeom, type StopAnchor } from './geometry';
import './experience.scss';

/**
 * Professional Experience — uma estrada que desce a página, com uma parada por cargo.
 *
 * O conteúdo é HTML comum (`<ol>` de `<li>` com `<h3>`) e já está no estado final: estrada e
 * carro são decoração `aria-hidden` por cima. A geometria da estrada é medida da caixa real
 * da seção (ResizeObserver), não de um viewBox fixo — assim a estrada passa a um vão fixo
 * da borda de cada card, pelo lado de fora da curva, mesmo que o texto quebre diferente.
 *
 * **Nada aqui re-renderiza durante o scroll.** Um único rAF por frame: lê o rect da seção
 * (uma leitura, antes de qualquer escrita) e depois escreve tudo direto no DOM — transform do
 * carro, classes `is-lit`, texto do odômetro, transform das janelas que apagam a estrada à frente do carro. O que existia antes
 * (`setState` por frame) custava até 799 ms de scheduler do React num frame sob CPU 4×.
 */

export default function Experience() {
  const { experience } = useLocalData();
  const entries = useMemo(() => [...experience].sort((a, b) => a.order - b.order), [experience]);
  const years = useMemo(() => entries.map((e) => Number(e.start.slice(0, 4))), [entries]);

  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const yearRef = useRef<HTMLSpanElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);
  const carRef = useRef<CarHandle>(null);

  const reduced = useReducedMotion();
  const narrow = useIsMobile(NARROW_MAX);
  const near = useVisible(sectionRef, { rootMargin: '800px 0px', once: true });
  const entered = useVisible(sectionRef, { once: true });

  const [road, setRoad] = useState<RoadGeom | null>(null);

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
      const box = section.getBoundingClientRect();
      // A estrada passa a um vão fixo da borda de cada card, do lado de dentro (o card fica
      // fora da curva). Os cards são layout de CSS puro; é a estrada que se ajusta a eles.
      const reach = (narrow ? CARD_GAP.narrow : CARD_GAP.wide) + roadHalf(narrow);
      const stops: StopAnchor[] = [];
      const cards: RoadGeom['cards'] = [];
      Array.from(list.children).forEach((li, i) => {
        const r = li.getBoundingClientRect();
        const c = (li.querySelector('.exp__card') ?? li).getBoundingClientRect();
        const cardLeft = !narrow && cardSide(i) === 'left';
        stops.push({
          x: cardLeft ? c.right - box.left + reach : c.left - box.left - reach,
          y: r.top - box.top + r.height / 2,
        });
        cards.push({ top: c.top - box.top, bottom: c.bottom - box.top });
      });
      if (!stops.length) return;

      // A chave embute largura, altura, paradas e cards: se não mudou, não há nada a refazer
      // (e assim o ResizeObserver não vira trabalho de React durante o scroll).
      const { d, segments } = buildRoad(width, height, stops, narrow, cards[cards.length - 1].bottom);
      if (!d) return;
      const key = d + cards.map((c) => `${Math.round(c.top)},${Math.round(c.bottom)}`).join(';');
      if (key === lastKey) return;
      lastKey = key;

      const ys = stops.map((st) => st.y);
      const spacing = ys.length > 1 ? (ys[ys.length - 1] - ys[0]) / (ys.length - 1) : height * 0.1;
      setRoad({
        d,
        segments,
        width,
        height,
        stopYs: ys,
        stopXs: stops.map((st) => st.x),
        cards,
        litWindowPx: spacing * 0.38,
      });
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
    // Janelas da névoa (ver Road): par [janela, estrada dentro dela], movidos só por transform.
    const fogSolid = section.querySelector<HTMLElement>('.exp__road-win--solid');
    const fogBand = section.querySelector<HTMLElement>('.exp__road-win--fog');
    const fogSolidArt = fogSolid?.firstElementChild as HTMLElement | null | undefined;
    const fogBandArt = fogBand?.firstElementChild as HTMLElement | null | undefined;
    const odo = section.querySelector<HTMLElement>('.exp__odo');
    const note = noteRef.current;
    const first = road.stopYs[0] ?? 0;
    const fogAhead = narrow ? FOG_AHEAD.narrow : FOG_AHEAD.wide;
    const prev = { lit: -2, year: '', atLast: null as boolean | null, fog: Number.NaN, gone: false, away: null as boolean | null };
    // Rolagem suavizada: é ela, e não o scroll cru, que posiciona o carro. `t` = último quadro,
    // para o lerp valer o mesmo em 60, 120 ou 30 Hz.
    const motion = { scrolled: Number.NaN, previous: 0, t: 0 };

    // Posição da seção no documento, em cache. Chamar `getBoundingClientRect()` dentro do
    // rAF forçava layout do documento inteiro sempre que outra seção estava montando
    // (medido: 94 ms num frame sob CPU 4×). Só uma mudança de altura ACIMA da seção move esse
    // valor: observa o documento e cada irmão anterior da seção e de seus ancestrais (uma
    // seção lazy que encolhe acima enquanto outra cresce abaixo não muda a altura total).
    // `scrollY` e `innerHeight` também forçam layout se lidos no rAF depois de uma escrita:
    // ficam em cache, lidos no evento de scroll/resize (antes dos rAF do quadro).
    let docTop = 0;
    let scrollY = window.scrollY;
    let vh = window.innerHeight;
    const measureDocTop = () => {
      scrollY = window.scrollY;
      vh = window.innerHeight;
      docTop = section.getBoundingClientRect().top + scrollY;
    };
    measureDocTop();
    const refreshDocTop = () => {
      measureDocTop();
      onScroll();
    };
    const bodyRO = new ResizeObserver(refreshDocTop);
    bodyRO.observe(document.documentElement);
    for (let el: Element | null = section; el && el !== document.body; el = el.parentElement) {
      for (let sib = el.previousElementSibling; sib; sib = sib.previousElementSibling) bodyRO.observe(sib);
    }
    window.addEventListener('resize', refreshDocTop, { passive: true });

    // O odômetro sai assim que a última parada passa de ODO_AWAY da viewport para cima: ele
    // nunca chega a encostar na nav nem no Contact. Vai pelo evento de scroll, não pelo loop:
    // o loop não roda sob reduced-motion e o progresso da seção satura (para de avisar) antes
    // de ela sair da tela. Só lê `scrollY`/`innerHeight` e troca uma classe quando muda.
    const placeOdo = () => {
      const away = docTop - scrollY + last < vh * ODO_AWAY;
      if (odo && away !== prev.away) {
        odo.classList.toggle('is-away', away);
        prev.away = away;
      }
    };

    const apply = (): boolean => {
      // ---- nenhuma leitura de layout aqui: só valores em cache ----
      const top = reduced ? 0 : docTop - scrollY;
      const onScreen = top < vh && top + road.height > 0;
      // ---- conta ----
      // ---- suavização própria do scroll ----
      const rawScrolled = -top;
      // Fora da tela não há o que suavizar: ao voltar, o carro parte de onde o scroll está.
      if (Number.isNaN(motion.scrolled) || !onScreen) motion.scrolled = rawScrolled;
      const now = performance.now();
      const dt = now - motion.t;
      motion.t = now;
      // Depois de uma pausa (loop parado) o 1º quadro conta como um quadro normal.
      const frames = dt > 0 && dt < 100 ? dt / FRAME_MS : 1;
      motion.scrolled += (rawScrolled - motion.scrolled) * (1 - Math.pow(1 - K_SCROLL, frames));
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
      // A estrada à frente do carro se apaga: as duas janelas da estrada (a inteira até o capô
      // e a faixa com máscara de gradiente logo depois) descem com o carro, e a estrada dentro
      // delas sobe o mesmo tanto. Só transform: a estrada nunca é repintada (marcos inclusos).
      const fogY = Math.round(y + fogAhead);
      if (fogSolid && fogBand && fogSolidArt && fogBandArt && fogY !== prev.fog) {
        fogSolid.style.transform = `translate3d(0, ${fogY - road.height}px, 0)`;
        fogSolidArt.style.transform = `translate3d(0, ${road.height - fogY}px, 0)`;
        fogBand.style.transform = `translate3d(0, ${fogY}px, 0)`;
        fogBandArt.style.transform = `translate3d(0, ${-fogY}px, 0)`;
        prev.fog = fogY;
      }
      // A legenda da D-20 sai assim que o carro deixa a 1ª parada.
      const gone = !reduced && y - first > NOTE_HIDE_PX;
      if (note && gone !== prev.gone) {
        note.classList.toggle('is-gone', gone);
        prev.gone = gone;
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

    // O loop acorda no próprio evento de scroll (e quando a seção muda de lugar), só com a
    // seção na tela. Antes, um `useSectionProgress` com rAF e lerp próprios só existia para
    // acordar este loop: era um segundo rAF por quadro, mais o custo do ResizeObserver dele.
    let wake = () => {};
    const onScroll = () => {
      scrollY = window.scrollY;
      placeOdo();
      const top = docTop - scrollY;
      if (top < vh && top + road.height > 0) wake();
    };

    apply();
    placeOdo();
    window.addEventListener('scroll', onScroll, { passive: true });
    if (reduced) {
      return () => {
        window.removeEventListener('scroll', onScroll);
        bodyRO.disconnect();
        window.removeEventListener('resize', refreshDocTop);
      };
    }

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
    wake = () => {
      if (queued || document.hidden) return;
      queued = true;
      raf = requestAnimationFrame(tick);
    };
    document.addEventListener('visibilitychange', onScroll);
    return () => {
      bodyRO.disconnect();
      window.removeEventListener('resize', refreshDocTop);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [road, reduced, narrow, years]);

  const markers: RoadMarker[] = useMemo(() => {
    if (!road) return [];
    return entries.map((e, i) => ({
      id: e.id,
      y: road.stopYs[i] ?? 0,
      x: road.stopXs[i] ?? 0,
      year: e.start.slice(0, 4),
      city: e.city,
      // Marco do lado de dentro da curva, oposto ao card. No mobile o card é sempre à direita.
      side: !narrow && cardSide(i) === 'left' ? 'right' : 'left',
    }));
  }, [road, entries, narrow]);

  // Legenda da D-20: presa ao carro estacionado (1ª parada; na última sob reduced-motion,
  // que é onde o carro fica). No desktop vai do lado de dentro da curva; no mobile, acima do
  // 1º card (ou abaixo do último), ligada ao carro por um fio vertical.
  const note = useMemo(() => {
    if (!road || !road.stopYs.length) return null;
    const i = reduced ? road.stopYs.length - 1 : 0;
    const x = road.stopXs[i] ?? 0;
    const y = road.stopYs[i] ?? 0;
    const card = road.cards[i] ?? { top: y, bottom: y };
    const side = narrow ? (reduced ? 'below' : 'above') : cardSide(i) === 'left' ? 'right' : 'left';
    const style = {
      left: `${x.toFixed(1)}px`,
      top: `${y.toFixed(1)}px`,
      '--exp-note-reach': `${Math.round(reduced ? card.bottom - y : y - card.top)}px`,
      // mobile: o texto começa em x + NOTE_INSET (ver SCSS) e para 2 px antes da borda
      '--exp-note-w': `${Math.round(road.width - x - NOTE_INSET - 2)}px`,
    } as CSSProperties;
    return { side, style };
  }, [road, reduced, narrow]);

  // Onde a estrada começa a se apagar no 1º render (o rAF assume dali em diante). Sob
  // reduced-motion não há apagamento: a estrada inteira fica à vista.
  const fog = useMemo(() => {
    if (!road || reduced) return null;
    return {
      y: Math.round((road.stopYs[0] ?? 0) + (narrow ? FOG_AHEAD.narrow : FOG_AHEAD.wide)),
      len: narrow ? FOG_LEN.narrow : FOG_LEN.wide,
    };
  }, [road, reduced, narrow]);

  return (
    <section className="exp" id="work-experience" ref={sectionRef}>
      <header className="exp__head">
        <h2 className="section-title">
          Professional <em>Experience</em>
        </h2>
      </header>

      <Odometer
        yearRef={yearRef}
        firstYear={years[0] ?? 2023}
        // O trilho termina na última parada: o ano nunca desce abaixo dela.
        trackEnd={road ? road.height - (road.stopYs[road.stopYs.length - 1] ?? road.height) : undefined}
      />

      {road && (
        <Road d={road.d} width={road.width} height={road.height} markers={markers} narrow={narrow} fog={fog} />
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

      {note && (
        <div className={`exp__d20 exp__d20--${note.side}`} ref={noteRef} style={note.style}>
          <span className="exp__d20-lead" aria-hidden="true" />
          <p className="exp__d20-text">
            My grandfather Adalberto&rsquo;s red Chevrolet <span className="exp__nowrap">D-20</span>, from his garage in Missão Velha.{' '}
            <Link className="exp__d20-link" to="/story">
              read the story
            </Link>
          </p>
        </div>
      )}

      <ol className="exp__stops" ref={listRef}>
        {entries.map((entry, i) => (
          <Stop key={entry.id} entry={entry} side={cardSide(i)} cta={i === entries.length - 1} />
        ))}
      </ol>
    </section>
  );
}

/** Até essa largura (px) a seção usa o layout de uma coluna (casa com o SCSS). */
const NARROW_MAX = 760;
/** Onde a estrada começa a se apagar, em px à frente do centro do carro (logo depois do capô). */
const FOG_AHEAD = { wide: 44, narrow: 22 } as const;
/** Comprimento do apagamento, em px: daí em diante a estrada ainda não existe. */
const FOG_LEN = { wide: 360, narrow: 300 } as const;
/** Fração da viewport: a última parada acima disso tira o odômetro de cena. */
const ODO_AWAY = 0.35;
/** Recuo, em px, da legenda da D-20 no mobile a partir do eixo da estrada (casa com o SCSS). */
const NOTE_INSET = 28;
/** Duração de referência de um quadro para K_SCROLL (60 Hz). */
const FRAME_MS = 1000 / 60;
/** Quanto o carro anda depois da 1ª parada até a legenda da D-20 sair. */
const NOTE_HIDE_PX = 18;

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
