import { memo, type CSSProperties } from 'react';
import { ROAD_W, type Scenery } from './geometry';
// Estrada decorativa: traço creme-escuro, linha central tracejada laranja, marcos de km e o
// cenário das manobras (defensas, zebras, rio, ilha da rotatória, morro do túnel, viaduto, postes).
// Puramente visual — `aria-hidden`. O conteúdo real está no `<ol>` ao lado.
interface RoadMarker {
  id: string;
  /** Centro vertical da parada, em px da seção. */
  y: number;
  /** x da faixa naquela parada, em px da seção. */
  x: number;
  year: string;
  city: string;
  side: 'left' | 'right';
}

interface RoadProps {
  d: string;
  width: number;
  height: number;
  markers: RoadMarker[];
  narrow: boolean;
  /**
   * Estrada à frente do carro ainda por existir: inteira até `fog.y`, some ao longo de
   * `fog.len` px por uma máscara de gradiente, e não existe dali para baixo. `null` = estrada
   * inteira (reduced-motion).
   *
   * Duas janelas com a mesma estrada dentro: a de cima (`--solid`) corta em `fog.y`; a de
   * baixo (`--fog`) tem `fog.len` px de altura e a máscara fixa nela. Durante o scroll o
   * Experience move só o `transform` de cada janela e o da estrada dentro dela (em sentido
   * contrário, então a estrada fica parada na página). São camadas compostas: nada repinta.
   * Antes, mover o `gradientTransform` do traço re-rasterizava a estrada inteira por quadro.
   */
  fog: { y: number; len: number } | null;
  scenery: Scenery[];
}

const DASH = { wide: [18, 22], narrow: [10, 12] } as const;

/** Meio comprimento do tabuleiro do viaduto: cobre a estrada de baixo com folga. */
const DECK = 34;

/**
 * Tabuleiro do viaduto: um trecho reto de estrada, opaco (tapa a estrada que passa por baixo),
 * com guarda-corpo dos dois lados. Vai na estrada e, de novo, por cima do carro (Experience).
 * O tracejado do tabuleiro começa na mesma fase do tracejado da estrada naquele ponto: os
 * traços coincidem e a faixa segue sem emenda por cima do viaduto.
 */
function BridgeDeck({ x, y, s, angle }: Extract<Scenery, { kind: 'deck' }>) {
  const lane = ROAD_W.wide;
  const span = `M ${-DECK} 0 H ${DECK}`;
  const rail = (side: 1 | -1) => {
    const h = side * (lane / 2 + 3);
    return `M ${-DECK - 7} ${h + side * 6} L ${-DECK} ${h} H ${DECK} L ${DECK + 7} ${h + side * 6}`;
  };
  return (
    <g className="exp__bridge" transform={`translate(${x} ${y}) rotate(${angle})`}>
      <path className="exp__bridge-clear" d={span} strokeWidth={lane + 2} />
      <path className="exp__road-bed" d={span} strokeWidth={lane} />
      <path className="exp__road-edge" d={span} strokeWidth={lane + 2} />
      <path
        className="exp__road-line"
        d={span}
        strokeWidth={2.5}
        strokeDasharray={DASH.wide.join(' ')}
        strokeDashoffset={(s - DECK) % (DASH.wide[0] + DASH.wide[1])}
      />
      <path className="exp__bridge-rail" d={rail(-1)} />
      <path className="exp__bridge-rail" d={rail(1)} />
    </g>
  );
}

/** Ícones do cenário, desenhados a partir do pé (0, 0). Traço e preenchimento vêm do SCSS. */
const ICONS = {
  tree: 'M 0 0 V -8 M 0 -8 m -8 -7 a 8 8 0 1 0 16 0 a 8 8 0 1 0 -16 0',
  pine: 'M 0 0 V -6 M -7 -6 L 0 -24 L 7 -6 Z',
  cactus: 'M 0 0 V -21 M 0 -7 H -6 V -14 M 0 -10 H 6 V -17',
  rock: 'M -8 0 L -5 -6 L 3 -8 L 8 0 Z',
  lamp: 'M 0 0 V -24 H -9',
} as const;

/**
 * Cenário de `buildRoad`: vai na estrada (some com ela, à frente do carro) e, o que cobre o
 * carro — morro do túnel, tabuleiro do viaduto —, de novo por cima dele (Experience).
 */
export function Scene({ items }: { items: Scenery[] }) {
  return (
    <>
      {items.map((it, i) => {
        if (it.kind === 'path') return <path key={i} className={`exp__sc exp__sc--${it.cls}`} d={it.d} />;
        if (it.kind === 'deck') return <BridgeDeck key={i} {...it} />;
        return (
          <g key={i} className={`exp__sc exp__sc--${it.icon}`} transform={`translate(${it.x.toFixed(1)} ${it.y.toFixed(1)})${it.flip ? ' scale(-1 1)' : ''}`}>
            <path d={ICONS[it.icon]} />
            {it.icon === 'lamp' && <circle cx={-9} cy={-22} r={2.4} />}
          </g>
        );
      })}
    </>
  );
}

/** Folga lateral da faixa com máscara: os rótulos dos marcos não podem ser cortados por ela. */
const FOG_BLEED = 220;

function Road({ d, width, height, markers, narrow, fog, scenery }: RoadProps) {
  if (!d || width <= 0 || height <= 0) return null;
  const lane = narrow ? ROAD_W.narrow : ROAD_W.wide;
  const art = (
    <>
      {/* asfalto */}
      <path className="exp__road-bed" d={d} strokeWidth={lane} />
      {/* acostamento */}
      <path className="exp__road-edge" d={d} strokeWidth={lane + 2} />
      {/* faixa central tracejada */}
      <path
        className="exp__road-line"
        d={d}
        strokeWidth={narrow ? 1.5 : 2.5}
        strokeDasharray={(narrow ? DASH.narrow : DASH.wide).join(' ')}
      />
      <Scene items={scenery} />
      {markers.map((m) => {
        const dir = m.side === 'left' ? -1 : 1;
        const tick = lane / 2 + (narrow ? 5 : 9);
        return (
          <g className="exp__km" key={m.id} transform={`translate(${m.x} ${m.y})`}>
            <line x1={dir * (lane / 2)} y1={0} x2={dir * tick} y2={0} />
            {!narrow && (
              <text x={dir * (tick + 8)} y={4} textAnchor={m.side === 'left' ? 'end' : 'start'}>
                {m.year}
                {m.city ? ` · ${m.city}` : ''}
              </text>
            )}
          </g>
        );
      })}
    </>
  );
  const svg = (
    <svg
      className="exp__road"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      aria-hidden="true"
      focusable="false"
    >
      {art}
    </svg>
  );
  // O transform vai num <div> em volta do <svg>, nunca no <svg>: transform no <svg> refaz o
  // layout do <text> dos marcos a cada quadro (medido: layout em todo quadro a 1440).
  const slide = (style: CSSProperties) => (
    <div className="exp__road-slide" style={style}>
      {svg}
    </div>
  );

  if (!fog) {
    return (
      <div className="exp__roadway" aria-hidden="true">
        {svg}
      </div>
    );
  }
  return (
    <div className="exp__roadway exp__roadway--fog" aria-hidden="true">
      <div
        className="exp__road-win exp__road-win--solid"
        style={{ height, transform: `translate3d(0, ${fog.y - height}px, 0)` }}
      >
        {slide({ transform: `translate3d(0, ${height - fog.y}px, 0)` })}
      </div>
      <div
        className="exp__road-win exp__road-win--fog"
        style={{ height: fog.len, left: -FOG_BLEED, right: -FOG_BLEED, transform: `translate3d(0, ${fog.y}px, 0)` }}
      >
        {slide({ left: FOG_BLEED, transform: `translate3d(0, ${-fog.y}px, 0)` })}
      </div>
    </div>
  );
}

export default memo(Road);
export type { RoadMarker };
