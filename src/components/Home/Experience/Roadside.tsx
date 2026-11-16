import { memo, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FocusEvent, type KeyboardEvent, type ReactNode } from 'react';
import { useLocalData } from '../../../lib/data';
import HibeexMark from '../../OnePager/HibeexMark';
import { GATE, type Actor, type Egg, type EggId } from './geometry';

/**
 * Surpresas à beira da estrada.
 *
 * Dois tipos. As passivas acontecem quando o carro passa (a capivara que atravessa, a pichação
 * no túnel, o radar que só dispara para quem corre): quem avisa é o Experience. As interativas
 * são botões de verdade — placas, o caroneiro, o outdoor, o disco voador e a buzina da D-20 —
 * num grupo só, com roving tabindex: o Tab entra pela buzina e as setas andam pelas outras,
 * então a ordem de tabulação da página ganha uma parada, não dez.
 *
 * Todo número em placa vem de `numbers.json` em tempo de execução; sem o dado (ou com ele
 * marcado como placeholder) a placa não existe.
 */

export type FoundId = EggId | 'honk';

const KEY = 'exp:eggs';
/** Dependem de o carro andar: não existem sob reduced-motion (ele fica parado na chegada). */
const PASSIVE: readonly FoundId[] = ['capy', 'camera', 'graffiti'];
/** Quanto tempo um balão fica aberto, ms. */
const SAY_MS = 4500;

/** O que já foi achado nesta sessão (sessionStorage). */
export function useEggs() {
  const [found, setFound] = useState<ReadonlySet<string>>(() => {
    try {
      const saved: unknown = JSON.parse(sessionStorage.getItem(KEY) ?? '[]');
      return new Set(Array.isArray(saved) ? saved.filter((v): v is string => typeof v === 'string') : []);
    } catch {
      return new Set<string>();
    }
  });
  const find = useCallback((id: FoundId) => {
    setFound((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev).add(id);
      try {
        sessionStorage.setItem(KEY, JSON.stringify([...next]));
      } catch {
        // sem storage (modo privado): vale só enquanto a página estiver aberta
      }
      return next;
    });
  }, []);
  return { found, find };
}

interface EggCopy {
  /** Nome acessível do botão. */
  label: string;
  /** O que o balão diz ao clicar. */
  say: string;
  art: ReactNode;
}

/** Texto e desenho de cada surpresa, a partir dos dados do site. `null` = falta o dado. */
function useCopy(): (id: FoundId, found: boolean) => EggCopy | null {
  const { numbers } = useLocalData();
  return useMemo(() => {
    const stat = (id: string) => numbers.find((n) => n.id === id && !n._placeholder);
    const fmt = (id: string) => {
      const n = stat(id);
      if (!n) return '';
      const digits = n.decimals ?? 0;
      const value = n.grouping === false ? n.value.toFixed(digits) : n.value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
      return `${n.prefix ?? ''}${value}${n.suffix ?? ''}`;
    };
    const schools = stat('schools');
    const students = stat('students');
    const olympiads = stat('competitions');
    const medals = stat('medals');
    const estudar = stat('estudar');
    const sat = stat('sat');
    const startups = stat('startups');

    return (id, found) => {
      switch (id) {
        case 'honk':
          return { label: 'Honk the D-20’s horn', say: 'BEEP!', art: null };
        case 'hitch':
          return {
            label: found ? 'The hitchhiker is riding in the truck bed' : 'Hitchhiker in a Spider-Man T-shirt: give him a lift',
            say: 'Thanks for the lift!',
            art: (
              <svg viewBox="0 0 34 46" width="34" height="46">
                <g className="exp__kid">
                  <circle className="a-fill" cx="14" cy="7" r="5.5" />
                  <path className="a-line" d="M11 28 V43 M17 28 V43 M22 17 L30 13 V9 M6 17 L4 25" />
                  {/* The real tee, cut out of the wardrobe photo. */}
                  <svg x="4.5" y="11.5" width="19" height="18" viewBox="70 125 675 630" preserveAspectRatio="xMidYMid slice">
                    <image href="/wardrobe/spider-man.webp" width="800" height="1240" />
                  </svg>
                </g>
              </svg>
            ),
          };
        case 'school':
          if (!schools || !students) return null;
          return {
            label: `Road sign: ${fmt('schools')} schools ahead`,
            say: `${students.sub ?? 'Projeto Candela'}: ${fmt('schools')} ${schools.label}, ${fmt('students')} ${students.label}.`,
            art: (
              <svg viewBox="0 0 80 54" width="80" height="54">
                <path className="a-line" d="M40 32 V54" />
                <rect className="a-fill a-sign" x="1.5" y="1.5" width="77" height="31" rx="4" />
                <text className="a-text a-text--big" x="40" y="14.5">{fmt('schools')} SCHOOLS</text>
                <text className="a-text" x="40" y="26">AHEAD</text>
              </svg>
            ),
          };
        case 'medals':
          if (!olympiads || !medals) return null;
          return {
            label: `Road sign: ${fmt('competitions')} ${olympiads.label}, ${fmt('medals')} medals`,
            say: `${fmt('competitions')} ${olympiads.label}, ${fmt('medals')} ${medals.label}${medals.sub ? `: ${medals.sub}` : ''}.`,
            art: (
              <svg viewBox="0 0 86 58" width="86" height="58">
                <path className="a-line" d="M43 38 V58" />
                <rect className="a-fill a-sign" x="1.5" y="1.5" width="83" height="37" rx="4" />
                <text className="a-text a-text--start" x="8" y="15.5">{olympiads.label.toUpperCase()}</text>
                <text className="a-text a-text--big a-text--end" x="78" y="15.5">{fmt('competitions')}</text>
                <text className="a-text a-text--start" x="8" y="30">MEDALS</text>
                <text className="a-text a-text--big a-text--end" x="78" y="30">{fmt('medals')}</text>
              </svg>
            ),
          };
        case 'narrow':
          if (!estudar) return null;
          return {
            label: `Road sign: road narrows, ${fmt('estudar')}`,
            say: `${fmt('estudar')} ${estudar.label}.`,
            art: (
              <svg viewBox="0 0 46 62" width="46" height="62">
                <path className="a-line" d="M23 40 V62" />
                <path className="a-fill a-sign" d="M23 1.5 L43 21.5 L23 41.5 L3 21.5 Z" />
                <path className="a-line" d="M17 13 V17 L20.5 24 V30 M29 13 V17 L25.5 24 V30" />
                <rect className="a-fill" x="7" y="40" width="32" height="13" rx="3" />
                <text className="a-text a-text--big" x="23" y="50">{fmt('estudar')}</text>
              </svg>
            ),
          };
        case 'sat': {
          if (!sat) return null;
          const [name, top] = sat.label.split(' / ');
          return {
            label: `Speed limit sign: ${fmt('sat')}`,
            say: `${top ? `${name} ${fmt('sat')} / ${top}` : `${sat.label}: ${fmt('sat')}`}${sat.sub ? `. ${sat.sub}` : ''}.`,
            art: (
              <svg viewBox="0 0 42 58" width="42" height="58">
                <path className="a-line" d="M21 39 V58" />
                <circle className="a-fill a-limit" cx="21" cy="21" r="17.5" />
                <text className="a-text a-text--big" x="21" y="25">{fmt('sat')}</text>
              </svg>
            ),
          };
        }
        case 'billboard':
          if (!startups) return null;
          return {
            label: 'HIBEEX billboard',
            say: `One of ${fmt('startups')} ${startups.label}.`,
            art: (
              <span className="exp__bb">
                <span className="exp__bb-board">
                  <HibeexMark className="exp__bb-bee" />
                  <span className="exp__bb-name">HIBEEX</span>
                </span>
              </span>
            ),
          };
        case 'shortcut':
          return {
            label: 'Hidden shortcut through the pines: skip to the next stop',
            say: 'Shortcut! Straight down through the pines.',
            art: (
              <svg viewBox="0 0 62 42" width="62" height="42">
                <path className="a-line" d="M31 18 V42" />
                <path className="a-fill" d="M2 3 H52 L59.5 10.5 L52 18 H2 Z" />
                <text className="a-text" x="28" y="13.5">SHORTCUT</text>
              </svg>
            ),
          };
        case 'ufo':
          return {
            label: found ? 'The flying saucer has left' : 'A flying saucer',
            say: 'It only wanted directions.',
            art: (
              <svg viewBox="0 0 64 44" width="64" height="44">
                <g className="exp__ufo">
                  <path className="exp__ufo-ray" d="M24 22 L40 22 L50 44 L14 44 Z" />
                  <path className="a-fill" d="M21 14 a11 10 0 0 1 22 0 Z" />
                  <ellipse className="a-fill" cx="32" cy="17" rx="27" ry="7" />
                  <path className="a-dots" d="M14 18 h.1 M26 20.5 h.1 M38 20.5 h.1 M50 18 h.1" />
                </g>
              </svg>
            ),
          };
        default:
          return null;
      }
    };
  }, [numbers]);
}

// ── Roving tabindex: um só ponto de entrada por Tab, setas entre as surpresas ─
const eggButtons = (from: Element) => Array.from(from.closest('.exp')?.querySelectorAll<HTMLElement>('[data-egg]') ?? []);

/** O botão que recebe o foco passa a ser a parada do Tab. */
export function roveFocus(e: FocusEvent<HTMLElement>) {
  for (const el of eggButtons(e.currentTarget)) el.tabIndex = el === e.currentTarget ? 0 : -1;
}

/** Setas (e Home/End) andam pelas surpresas, na ordem da estrada. */
export function roveKey(e: KeyboardEvent<HTMLElement>) {
  const step = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
  if (!step && e.key !== 'Home' && e.key !== 'End') return;
  const all = eggButtons(e.currentTarget);
  if (all.length < 2) return;
  const i = all.indexOf(e.currentTarget);
  const next = e.key === 'Home' ? all[0] : e.key === 'End' ? all[all.length - 1] : all[(i + step + all.length) % all.length];
  e.preventDefault();
  next.focus();
}

interface RoadsideProps {
  eggs: Egg[];
  found: ReadonlySet<string>;
  onFind: (id: FoundId) => void;
  reduced: boolean;
}

/** Quais surpresas existem nesta largura, com estes dados (a buzina existe sempre). */
export function useEggList(eggs: Egg[], reduced: boolean): FoundId[] {
  const copy = useCopy();
  return useMemo(() => {
    const ids: FoundId[] = ['honk'];
    for (const e of eggs) {
      if (PASSIVE.includes(e.id) ? !reduced : copy(e.id, false) !== null) ids.push(e.id);
    }
    return ids;
  }, [eggs, reduced, copy]);
}

function Roadside({ eggs, found, onFind, reduced }: RoadsideProps) {
  const copy = useCopy();
  const [open, setOpen] = useState<FoundId | null>(null);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const click = (egg: Egg, el: HTMLElement) => {
    onFind(egg.id);
    setOpen(egg.id);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(null), SAY_MS);
    // O atalho leva até a parada (o carro faz o resto da serra correndo) e entrega o foco a ela.
    if (egg.to !== undefined) {
      const stop = el.closest('.exp')?.querySelectorAll<HTMLElement>('.exp__stop')[egg.to];
      stop?.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
      stop?.focus({ preventScroll: true });
    }
  };

  let said = '';
  const items = eggs.map((egg) => {
    // O radar não é botão: é cenário, e pisca sozinho (o Experience liga `data-flash`). Não
    // espera a estrada chegar: quem passa correndo chegaria junto com ele, ainda apagado.
    if (egg.id === 'camera') {
      if (reduced) return null;
      return (
        <span key={egg.id} className="exp__egg exp__egg--camera" style={{ left: egg.x, top: egg.y }} aria-hidden="true">
          <svg viewBox="0 0 30 52" width="30" height="52">
            <circle className="exp__flash" cx="15" cy="11" r="15" />
            <path className="a-line" d="M15 19 V52" />
            <rect className="a-fill" x="4" y="3" width="22" height="16" rx="3" />
            <circle className="a-lens" cx="15" cy="11" r="4" />
          </svg>
        </span>
      );
    }
    const isFound = found.has(egg.id);
    const c = PASSIVE.includes(egg.id) ? null : copy(egg.id, isFound);
    if (!c) return null;
    const isOpen = open === egg.id;
    if (isOpen) said = c.say;
    return (
      <button
        key={egg.id}
        type="button"
        className={`exp__egg exp__egg--${egg.id} exp__fade${isFound ? ' is-found' : ''}${isOpen ? ' is-open' : ''}${egg.side > 0 ? ' exp__egg--right' : ' exp__egg--left'}`}
        data-egg={egg.id}
        data-y={Math.round(egg.y)}
        style={{ left: egg.x, top: egg.y }}
        tabIndex={-1}
        aria-label={c.label}
        onClick={(e) => click(egg, e.currentTarget)}
        onKeyDown={roveKey}
        onFocus={roveFocus}
      >
        <span className="exp__egg-art" aria-hidden="true">
          {c.art}
        </span>
        <span className="exp__say" aria-hidden="true">
          {c.say}
        </span>
      </button>
    );
  });

  return (
    <div className="exp__roadside" role="group" aria-label="Roadside surprises (arrow keys move between them)">
      {items}
      <p className="sr-only" aria-live="polite">
        {said}
      </p>
    </div>
  );
}

export default memo(Roadside);

/** Desenho de um figurante (o Experience o move por `transform`). Feito olhando para a esquerda. */
export const ActorArt = memo(function ActorArt({ kind }: { kind: Actor['kind'] }) {
  if (kind === 'gate') {
    return (
      <svg className="exp__actor-art exp__actor-art--gate" viewBox={`-7 -7 ${GATE.arm + 14} 14`} width={GATE.arm + 14} height="14">
        <path className="a-arm" d={`M0 0 H${GATE.arm}`} />
        <path className="a-arm-stripes" d={`M6 0 H${GATE.arm}`} />
        <circle className="a-fill" cx="0" cy="0" r="5" />
      </svg>
    );
  }
  if (kind === 'train') {
    return (
      <svg className="exp__actor-art exp__actor-art--train" viewBox="0 0 132 20" width="132" height="20">
        <path className="a-line" d="M40 10 H48 M84 10 H92" />
        <rect className="a-fill a-loco" x="1" y="2" width="40" height="16" rx="4" />
        <circle className="a-lens" cx="10" cy="10" r="3.2" />
        <path className="a-line" d="M24 2 V18 M32 6 V14" />
        <rect className="a-fill" x="47" y="3" width="38" height="14" rx="3" />
        <rect className="a-fill" x="91" y="3" width="38" height="14" rx="3" />
        <path className="a-dots" d="M56 10 h.1 M66 10 h.1 M76 10 h.1 M100 10 h.1 M110 10 h.1 M120 10 h.1" />
      </svg>
    );
  }
  return (
    <svg className="exp__actor-art exp__actor-art--capy" viewBox="0 0 46 28" width="46" height="28">
      <path className="a-line" d="M15 20 V26 M21 20 V26 M32 20 V26 M38 20 V26" />
      <path className="a-capy" d="M12 6 Q22 2 34 4 Q43 6 43 13 Q43 21 35 21 L15 21 Q10 21 9 17 L3 16 Q1 15 1 12 L2 8 Q3 5 7 5 Z" />
      <path className="a-line" d="M10 5 L11 2 L14 4" />
      <path className="a-dots" d="M6.5 9 h.1" />
    </svg>
  );
});

/** Confete da chegada: só cai para quem achou tudo. Posições fixas (nada de `Math.random` no render). */
export const Confetti = memo(function Confetti({ x, y, won }: { x: number; y: number; won: boolean }) {
  return (
    <div className="exp__confetti" data-won={won || undefined} style={{ left: x, top: y }} aria-hidden="true">
      {Array.from({ length: 18 }, (_, i) => {
        const a = (i * 137.5 * Math.PI) / 180;
        const r = 26 + ((i * 29) % 46);
        return <i key={i} style={{ '--x': `${(Math.cos(a) * r * 0.3).toFixed(0)}px`, '--y': `${(18 + Math.abs(Math.sin(a)) * r).toFixed(0)}px`, '--r': `${(i * 67) % 360}deg` } as CSSProperties} />;
      })}
    </div>
  );
});
