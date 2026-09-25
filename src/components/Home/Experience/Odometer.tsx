import { forwardRef } from 'react';

interface OdometerProps {
  stopNumber: number;
  total: number;
  org: string;
}

/**
 * Canto fixo da seção. O ano é escrito por `ref` a cada mudança de progresso (fora do React),
 * então fica `aria-hidden`; só a parada — que muda raramente — é anunciada.
 */
const Odometer = forwardRef<HTMLSpanElement, OdometerProps>(function Odometer(
  { stopNumber, total, org },
  yearRef,
) {
  return (
    <div className="exp__odo">
      <span className="exp__odo-year" ref={yearRef} aria-hidden="true">
        2023
      </span>
      <span className="exp__odo-stop" aria-live="polite">
        stop {stopNumber}/{total} · {org}
      </span>
    </div>
  );
});

export default Odometer;
