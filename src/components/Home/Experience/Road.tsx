import { memo, type CSSProperties } from 'react';
import { ROAD_W } from './geometry';
// Estrada decorativa: traço creme-escuro, linha central tracejada laranja e marcos de km.
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
}

/** Folga lateral da faixa com máscara: os rótulos dos marcos não podem ser cortados por ela. */
const FOG_BLEED = 220;

function Road({ d, width, height, markers, narrow, fog }: RoadProps) {
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
        strokeDasharray={narrow ? '10 12' : '18 22'}
      />
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
