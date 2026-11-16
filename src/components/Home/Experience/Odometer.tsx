import { memo } from 'react';
import type { RefObject } from 'react';

interface OdometerProps {
  /** O ano é escrito por `ref` (fora do React) a cada mudança. */
  yearRef: RefObject<HTMLSpanElement | null>;
  firstYear: number;
  /** Distância (px) do pé da seção até a última parada: onde o trilho termina. */
  trackEnd?: number;
  /** Surpresas achadas e quantas existem: o contador só aparece depois da primeira. */
  found: number;
  total: number;
}

/**
 * Só o ano da estrada, grande, em serif itálico. Fica `sticky` num trilho que vai do título
 * até a última parada, e o Experience o tira de cena (`is-away`) quando essa parada sobe:
 * nunca aparece sobre a nav nem sobre o Contact.
 * `aria-hidden`: muda direto no DOM a cada quadro e repete o que os cards já dizem (o que foi
 * achado é anunciado pela região viva do `Roadside`).
 */
function Odometer({ yearRef, firstYear, trackEnd, found, total }: OdometerProps) {
  return (
    <div
      className="exp__odo-track"
      aria-hidden="true"
      style={trackEnd === undefined ? undefined : { bottom: Math.round(trackEnd) }}
    >
      <div className="exp__odo">
        <span className="exp__odo-year" ref={yearRef}>
          {firstYear}
        </span>
        {found > 0 && total > 1 && (
          <span className={`exp__found${found >= total ? ' is-all' : ''}`}>
            {found >= total ? `all ${total} found \u00b7 golden D-20` : `found ${found} of ${total}`}
          </span>
        )}
      </div>
    </div>
  );
}

export default memo(Odometer);
