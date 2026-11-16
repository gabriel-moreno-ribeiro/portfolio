// Where the D-20 from the section rail ends up: a small bay beside the Contact title.
// Purely decorative. The truck is rendered parked; only if the bay is still off-screen
// (and motion is allowed) is it pulled back so it can roll in on arrival, like Reveal does.
import { useLayoutEffect, useRef, useState } from 'react';
import { useReducedMotion, useVisible } from '../../../lib/motion';

function ParkingSpot() {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const [mode, setMode] = useState<'static' | 'away' | 'parked'>('static');
  const visible = useVisible(ref, { rootMargin: '0px 0px -20%', threshold: 1, once: true });

  useLayoutEffect(() => {
    if (reduced) {
      setMode('static');
      return;
    }
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.top >= window.innerHeight || rect.bottom <= 0) setMode((m) => (m === 'static' ? 'away' : m));
  }, [reduced]);

  useLayoutEffect(() => {
    if (visible) setMode((m) => (m === 'away' ? 'parked' : m));
  }, [visible]);

  return (
    <span ref={ref} className="parking-spot" data-mode={mode} aria-hidden="true">
      <span className="parking-spot__bay">
        <img className="parking-spot__truck" src="/assets/car/car-12.webp" width={96} height={96} alt="" loading="lazy" />
      </span>
      <span className="parking-spot__note">End of the road</span>
    </span>
  );
}

export default ParkingSpot;
