import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { config, useLocalData } from '../../../lib/data';
import { usePageVisible, useReducedMotion, useVisible } from '../../../lib/motion';
import useIsMobile from '../../../hooks/useIsMobile';
import Car, { type CarHandle } from './Car';
import CityPin from './CityPin';
import Odometer from './Odometer';
import Road, { Scene, type RoadMarker } from './Road';
import Roadside, { ActorArt, Confetti, useEggList, useEggs, type FoundId } from './Roadside';
import Stop from './Stop';
import { CAR_SCREEN, CARD_GAP, buildRoad, cardSide, carTargetS, featureAt, nearestStop, roadHalf, roadLookup, type Actor, type Egg, type RoadGeom, type StopAnchor } from './geometry';
import './experience.scss';

/**
 * Professional Experience — uma estrada que desce a página, com uma parada por cargo. No
 * desktop cada trecho entre duas paradas é uma manobra diferente (chicane de terra, serra,
 * salto sobre o rio, pedágio e rotatória, túnel, trevo e passagem de nível: ver `buildRoad`);
 * o carro é levado por distância ao longo dela, não por altura, e os figurantes (cancelas,
 * trem, capivara) também. À beira da estrada há surpresas para achar (ver `Roadside`).
 *
 * O conteúdo é HTML comum (`<ol>` de `<li>` com `<h3>`) e já está no estado final: estrada e
 * carro são decoração `aria-hidden` por cima. A geometria da estrada é medida da caixa real
 * da seção (ResizeObserver), não de um viewBox fixo — assim a estrada passa a um vão fixo
 * da borda de cada card, pelo lado de fora da curva, mesmo que o texto quebre diferente.
 *
 * **Nada aqui re-renderiza durante o scroll** (a única exceção é achar uma surpresa: um render,
 * uma vez por surpresa). Um único rAF por frame: lê o rect da seção
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
  // The hazard blinks only while the section is on screen and the tab is visible.
  const inView = useVisible(sectionRef);
  const tabVisible = usePageVisible();
  const idle = !inView || !tabVisible;

  const [road, setRoad] = useState<RoadGeom | null>(null);

  // Surpresas: o que já foi achado (sessão) e quais existem nesta largura. O rAF avisa das
  // passivas por `findRef`, para o efeito dele não depender de nada daqui.
  const { found, find } = useEggs();
  const eggIds = useEggList(road?.eggs ?? NO_EGGS, reduced);
  const foundCount = eggIds.filter((id) => found.has(id)).length;
  const won = eggIds.length > 1 && foundCount === eggIds.length;
  const findRef = useRef(find);
  findRef.current = find;
  const honked = useRef(() => findRef.current('honk')).current;

  // Arriving from a city on the globe (#exp-<id>): mark that stop and hand it the focus.
  // Home does the scrolling; the mark leaves with the focus.
  const location = useLocation();
  useEffect(() => {
    if (!location.hash.startsWith('#exp-')) return;
    const stop = document.getElementById(location.hash.slice(1));
    if (!stop || !listRef.current?.contains(stop)) return;
    stop.classList.add('is-arrived');
    stop.addEventListener('blur', () => stop.classList.remove('is-arrived'), { once: true });
    stop.focus({ preventScroll: true });
  }, [location.hash, location.key]);

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
        cards.push({ left: c.left - box.left, right: c.right - box.left, top: c.top - box.top, bottom: c.bottom - box.top });
      });
      if (!stops.length) return;

      // A chave embute largura, altura, paradas e cards: se não mudou, não há nada a refazer
      // (e assim o ResizeObserver não vira trabalho de React durante o scroll).
      const plan = buildRoad(width, height, stops, cards, narrow, cards[cards.length - 1].bottom);
      if (!plan.d) return;
      const key = plan.d + cards.map((c) => `${Math.round(c.top)},${Math.round(c.bottom)}`).join(';');
      if (key === lastKey) return;
      lastKey = key;

      const ys = stops.map((st) => st.y);
      const spacing = ys.length > 1 ? (ys[ys.length - 1] - ys[0]) / (ys.length - 1) : height * 0.1;
      setRoad({
        ...plan,
        width,
        height,
        stopYs: ys,
        stopXs: stops.map((st) => st.x),
        cards,
        // As paradas ficaram mais longe umas das outras (as manobras): a janela não cresce junto.
        litWindowPx: Math.min(150, spacing * 0.38),
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
    // Tabela da estrada por distância (uma vez por layout; o carro usa a mesma, em cache).
    const lookup = roadLookup(road);
    const stopS = lookup.stopS;
    const firstS = stopS[0] ?? 0;
    const lastS = stopS[stopS.length - 1] ?? 0;
    const covers: (SVGElement | undefined)[] = [];
    section.querySelectorAll<SVGElement>('.exp__cover').forEach((el) => {
      covers[Number(el.dataset.k)] = el;
    });
    // Figurantes (na ordem de `road.actors`), faróis do túnel, confete, e o que só aparece
    // quando a estrada chega lá.
    const actors = Array.from(section.querySelectorAll<HTMLElement>('.exp__actor'));
    const beam = section.querySelector<SVGElement>('.exp__beam');
    const confetti = section.querySelector<HTMLElement>('.exp__confetti');
    const camera = section.querySelector<HTMLElement>('.exp__egg--camera');
    const fades = Array.from(section.querySelectorAll<HTMLElement>('.exp__fade')).map((el) => ({ el, y: Number(el.dataset.y) }));
    const passive = road.eggs.filter((e): e is Egg & { at: number } => e.at !== undefined);
    const pickS = PICKUPS.map((id) => {
      const i = entries.findIndex((e) => e.id === id);
      return i < 0 ? Infinity : (stopS[i] ?? Infinity);
    });
    let flashTimer = 0;
    // Janelas da névoa (ver Road): par [janela, estrada dentro dela], movidos só por transform.
    const fogSolid = section.querySelector<HTMLElement>('.exp__road-win--solid');
    const fogBand = section.querySelector<HTMLElement>('.exp__road-win--fog');
    const fogSolidArt = fogSolid?.firstElementChild as HTMLElement | null | undefined;
    const fogBandArt = fogBand?.firstElementChild as HTMLElement | null | undefined;
    const odo = section.querySelector<HTMLElement>('.exp__odo');
    const note = noteRef.current;
    const fogAhead = narrow ? FOG_AHEAD.narrow : FOG_AHEAD.wide;
    const prev = { lit: -2, year: '', atLast: null as boolean | null, fog: Number.NaN, gone: false, away: null as boolean | null, over: [] as boolean[], act: [] as number[], fade: [] as boolean[], beam: false, got: -1, s: Number.NaN };
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
      // Rolagem muito rápida e contínua: o atraso da suavização para em LAG_MAX da viewport,
      // senão o carro ficava para trás até sair pelo topo da tela.
      const lag = rawScrolled - motion.scrolled;
      if (lag > vh * LAG_MAX) motion.scrolled = rawScrolled - vh * LAG_MAX;
      else if (lag < -vh * LAG_MAX) motion.scrolled = rawScrolled + vh * LAG_MAX;
      const speed = reduced ? 0 : Math.abs(motion.scrolled - motion.previous); // px por quadro
      motion.previous = motion.scrolled;
      // Distância ao longo da estrada: o carro para rente a cada card quando ele está no
      // meio da tela (ver `carTargetS`).
      const s = reduced ? lastS : carTargetS(motion.scrolled + CAR_SCREEN * vh, road.stopYs, lookup);
      const { index, distance } = nearestStop(s, stopS);
      const litIndex = distance <= road.litWindowPx ? index : -1;
      const atLast = s >= lastS - 0.5;
      const year = String(Math.round(yearAt(s, stopS, years)));
      // ---- escritas ----
      const car = carRef.current;
      const settled = car ? car.draw(s, speed) : true;
      if (litIndex !== prev.lit) {
        if (prev.lit >= 0) stops[prev.lit]?.classList.remove('is-lit');
        if (litIndex >= 0) stops[litIndex]?.classList.add('is-lit');
        prev.lit = litIndex;
      }
      // A estrada à frente do carro se apaga: as duas janelas da estrada (a inteira até o capô
      // e a faixa com máscara de gradiente logo depois) descem com o carro, e a estrada dentro
      // delas sobe o mesmo tanto. Só transform: a estrada nunca é repintada (marcos inclusos).
      // Vale o ponto mais baixo que a estrada já alcançou: quando o carro sobe (laço), o que
      // ele já percorreu continua existindo.
      const fogY = Math.round(lookup.reachedY(s) + fogAhead);
      if (fogSolid && fogBand && fogSolidArt && fogBandArt && fogY !== prev.fog) {
        fogSolid.style.transform = `translate3d(0, ${fogY - road.height}px, 0)`;
        fogSolidArt.style.transform = `translate3d(0, ${road.height - fogY}px, 0)`;
        fogBand.style.transform = `translate3d(0, ${fogY}px, 0)`;
        fogBandArt.style.transform = `translate3d(0, ${-fogY}px, 0)`;
        prev.fog = fogY;
        // O que está à beira de uma estrada que ainda não existe também não existe.
        for (let k = 0; k < fades.length; k++) {
          const ahead = fades[k].y > fogY + FADE_AHEAD;
          if (ahead !== prev.fade[k]) {
            fades[k].el.toggleAttribute('data-ahead', ahead);
            prev.fade[k] = ahead;
          }
        }
      }
      // Morro do túnel, tabuleiro do viaduto: desenhados de novo sobre o carro só enquanto ele
      // passa por baixo (no viaduto, da meia volta do laço em diante; antes ele vai por cima).
      for (let k = 0; k < covers.length; k++) {
        const cover = road.covers[k];
        const over = !!cover && s >= cover.from && s < cover.to;
        if (over !== prev.over[k]) {
          covers[k]?.classList.toggle('is-over', over);
          prev.over[k] = over;
        }
      }
      // Figurantes: posição pela distância do carro. Fora da janela de cada um, nada é escrito.
      for (let k = 0; k < actors.length; k++) {
        const a = road.actors[k];
        if (!a) continue;
        const t = s <= a.from ? 0 : s >= a.to ? 1 : (s - a.from) / (a.to - a.from);
        if (t !== prev.act[k]) {
          actors[k].style.transform = actorPose(a, t);
          prev.act[k] = t;
        }
      }
      // Túnel: o carro está sob o morro; por cima dele vão só os faróis.
      const lit = !!road.beam && s >= road.beam.from && s < road.beam.to;
      if (beam && car) {
        if (lit) beam.style.transform = `translate3d(${car.pos.x.toFixed(1)}px, ${car.pos.y.toFixed(1)}px, 0)`;
        if (lit !== prev.beam) {
          beam.classList.toggle('is-on', lit);
          prev.beam = lit;
        }
      }
      // Carga: o que ele pegou nas paradas de onde já saiu (aparece quando ele arranca).
      let got = 0;
      for (let k = 0; k < pickS.length; k++) if (s >= pickS[k] + PICKUP_AFTER) got |= 1 << k;
      if (car && got !== prev.got) {
        car.setLoad(PICKUPS.filter((_, k) => got & (1 << k)).join(' '));
        prev.got = got;
      }
      // Surpresas passivas: acontecem quando o carro passa por elas, andando para a frente.
      if (s !== prev.s) {
        for (const egg of passive) {
          if (!(prev.s < egg.at && s >= egg.at)) continue;
          if (egg.id === 'camera') {
            // O radar só dispara para quem passa correndo (px de rolagem por quadro de 60 Hz).
            if (speed / frames < SPEED_TRAP || !camera) continue;
            camera.toggleAttribute('data-flash', true);
            window.clearTimeout(flashTimer);
            flashTimer = window.setTimeout(() => camera.removeAttribute('data-flash'), 900);
          }
          findRef.current(egg.id);
        }
        prev.s = s;
      }
      // A legenda da D-20 sai assim que o carro deixa a 1ª parada.
      const gone = !reduced && s - firstS > NOTE_HIDE_PX;
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
        confetti?.classList.toggle('is-on', atLast);
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
        window.clearTimeout(flashTimer);
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
      window.clearTimeout(flashTimer);
    };
  }, [road, reduced, narrow, years, entries]);

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
    <section className="exp" id="work-experience" ref={sectionRef} data-idle={idle || undefined}>
      <header className="exp__head">
        <h2 className="section-title">
          Professional <em>Experience</em>
        </h2>
        {/* The cities of the Origins globe, in its order: the road runs through the same places. */}
        <nav className="exp__route" aria-label="Cities on the globe">
          <ol>
            {config.cities.map((c) => (
              <li key={c.id}>
                <Link to={`#city-${c.id}`}>
                  <CityPin />
                  {c.name}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      </header>

      <Odometer
        yearRef={yearRef}
        firstYear={years[0] ?? 2023}
        found={foundCount}
        total={eggIds.length}
        // O trilho termina na última parada: o ano nunca desce abaixo dela.
        trackEnd={road ? road.height - (road.stopYs[road.stopYs.length - 1] ?? road.height) : undefined}
      />

      {road && (
        <Road
          d={road.d}
          width={road.width}
          height={road.height}
          markers={markers}
          narrow={narrow}
          fog={fog}
          scenery={road.scenery}
        />
      )}
      <div className="exp__car-layer">
        {/* Marcas de pneu: por baixo do carro, ficam (`is-over`) depois que ele derrapa ali. */}
        {road?.covers.map((cover, i) => cover.under && <CoverArt key={i} k={i} cover={cover} />)}
        {/* Figurantes. O estado final (carro já passou) é o default; o rAF os põe no lugar. */}
        {road?.actors.map((a, i) => (
          <div key={i} className={`exp__actor exp__actor--${a.kind} exp__fade`} data-y={Math.round(a.y)} style={{ left: a.x, top: a.y, transform: actorPose(a, 1) }} aria-hidden="true">
            <span className={a.flip ? 'exp__actor-flip' : undefined}>
              <ActorArt kind={a.kind} />
            </span>
          </div>
        ))}
        <Car
          ref={carRef}
          road={road}
          size={narrow ? 52 : 132}
          reduced={reduced}
          active={near}
          entered={entered}
          kid={found.has('hitch')}
          gold={won}
          onHonk={honked}
        />
        {/* O que cobre o carro (morro do túnel, tabuleiro do viaduto, pórtico), de novo por cima
            dele: só aparece (`is-over`) enquanto ele passa por baixo. */}
        {road?.covers.map((cover, i) => !cover.under && <CoverArt key={i} k={i} cover={cover} />)}
        {road?.beam && (
          <svg className="exp__beam" width="1" height="1" viewBox="0 0 1 1" aria-hidden="true" focusable="false">
            <defs>
              <linearGradient id="exp-beam" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor="var(--accent-decor)" stopOpacity="0.75" />
                <stop offset="1" stopColor="var(--accent-decor)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <g transform={road.beam.dir < 0 ? 'scale(-1 1)' : undefined} fill="url(#exp-beam)">
              <path d="M 40 -13 L 170 -40 L 170 4 Z" />
              <path d="M 40 13 L 170 40 L 170 -4 Z" />
            </g>
          </svg>
        )}
        {road?.finish && <Confetti x={road.finish.x} y={road.finish.y} won={won} />}
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
          <Stop
            key={entry.id}
            entry={entry}
            side={cardSide(i)}
            cta={i === entries.length - 1}
            room={featureAt(i - 1, entries.length)}
          />
        ))}
      </ol>

      {road && road.eggs.length > 0 && <Roadside eggs={road.eggs} found={found} onFind={find} reduced={reduced} />}
    </section>
  );
}

/** Cenário numa camada própria, ligado (`is-over`) pelo rAF enquanto o carro está na faixa dele. */
function CoverArt({ k, cover }: { k: number; cover: RoadGeom['covers'][number] }) {
  const { art, box } = cover;
  return (
    <svg
      className={`exp__cover${cover.under ? ' exp__cover--under' : ''}`}
      data-k={k}
      style={{ left: box.x, top: box.y }}
      width={box.w}
      height={box.h}
      viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
      aria-hidden="true"
      focusable="false"
    >
      <Scene items={art} />
    </svg>
  );
}

/** Onde um figurante está quando o carro andou a fração `t` da janela dele. A capivara gingando. */
function actorPose(a: Actor, t: number): string {
  const rot = a.kind === 'capy' ? (t < 1 ? 5 * Math.sin(t * 38) : 0) : a.rot * t;
  return `translate3d(${(a.dx * t).toFixed(1)}px, ${(a.dy * t).toFixed(1)}px, 0) rotate(${rot.toFixed(1)}deg)`;
}

const NO_EGGS: Egg[] = [];
/** Paradas em que o carro pega carga, pelo id do cargo (casa com `.exp__load--<id>` no SCSS). */
const PICKUPS = ['candela', 'principia', 'hibeex', 'taqtile'] as const;
/** Quanto o carro anda depois de uma parada até a carga dela aparecer na caçamba, px de estrada. */
const PICKUP_AFTER = 26;
/** Rolagem (px por quadro de 60 Hz) acima da qual o radar dispara: ~1 300 px/s. */
const SPEED_TRAP = 22;
/** Uma surpresa aparece quando a estrada chega a isto (px) dela. */
const FADE_AHEAD = 190;

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

/** Atraso máximo do carro em relação à rolagem, em fração da altura da viewport. */
const LAG_MAX = 0.22;

/** Quanto do erro de rolagem some por quadro. Menor = carro mais "solto" atrás do scroll. */
const K_SCROLL = 0.085;

/** Ano do odômetro: interpola entre os anos das paradas vizinhas, pela distância na estrada. */
function yearAt(s: number, stopS: number[], years: number[]): number {
  if (!years.length) return 2023;
  if (s <= stopS[0]) return years[0];
  const last = stopS.length - 1;
  if (s >= stopS[last]) return years[last];
  for (let i = 0; i < last; i++) {
    if (s <= stopS[i + 1]) {
      const span = stopS[i + 1] - stopS[i] || 1;
      return years[i] + ((s - stopS[i]) / span) * (years[i + 1] - years[i]);
    }
  }
  return years[last];
}
