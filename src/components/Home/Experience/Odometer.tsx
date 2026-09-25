import { memo } from 'react';
import type { RefObject } from 'react';

interface OdometerProps {
  /** O ano e a parada são escritos por `ref` (fora do React) a cada mudança. */
  yearRef: RefObject<HTMLSpanElement | null>;
  stopRef: RefObject<HTMLSpanElement | null>;
  firstYear: number;
  firstOrg: string;
  total: number;
}

/**
 * Canto fixo da seção. O ano fica `aria-hidden` (muda direto no DOM, sem anúncio); só a
 * parada — que muda raramente — é anunciada por `aria-live`.
 */
function Odometer({ yearRef, stopRef, firstYear, firstOrg, total }: OdometerProps) {
  return (
    <div className="exp__odo">
      <span className="exp__odo-year" ref={yearRef} aria-hidden="true">
        {firstYear}
      </span>
      <span className="exp__odo-stop" ref={stopRef} aria-live="polite">
        stop 1/{total} · {firstOrg}
      </span>
    </div>
  );
}

export default memo(Odometer);
