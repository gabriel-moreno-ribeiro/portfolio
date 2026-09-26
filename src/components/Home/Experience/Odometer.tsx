import { memo } from 'react';
import type { RefObject } from 'react';

interface OdometerProps {
  /** O ano é escrito por `ref` (fora do React) a cada mudança. */
  yearRef: RefObject<HTMLSpanElement | null>;
  firstYear: number;
  /** Distância (px) do pé da seção até a última parada: onde o trilho termina. */
  trackEnd?: number;
}

/**
 * Só o ano da estrada, grande, em serif itálico. Fica `sticky` num trilho que vai do título
 * até a última parada, e o Experience o tira de cena (`is-away`) quando essa parada sobe:
 * nunca aparece sobre a nav nem sobre o Contact.
 * `aria-hidden`: muda direto no DOM a cada quadro e repete o que os cards já dizem.
 */
function Odometer({ yearRef, firstYear, trackEnd }: OdometerProps) {
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
      </div>
    </div>
  );
}

export default memo(Odometer);
