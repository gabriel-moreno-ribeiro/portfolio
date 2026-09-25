import { memo } from 'react';
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
}

function Road({ d, width, height, markers, narrow }: RoadProps) {
  if (!d || width <= 0 || height <= 0) return null;
  const lane = narrow ? 18 : 46;
  return (
    <svg
      className="exp__road"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      aria-hidden="true"
      focusable="false"
    >
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
    </svg>
  );
}

export default memo(Road);
export type { RoadMarker };
