// Marquee sem emenda: duas cópias e um translate3d de -50% em CSS keyframes.
// Para fora da viewport (animation-play-state: paused) e vira lista rolável com reduced-motion.
import { useEffect, useRef, useState } from 'react';
import type { TickerProps } from './types';
import { useReducedMotion } from './useReducedMotion';
import { useVisible } from './useVisible';

export function Ticker({
  children,
  speed = 60,
  pauseOnHover = true,
  direction = 'left',
  ariaLabel,
  className,
}: TickerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const visible = useVisible(hostRef, { rootMargin: '10% 0px' });
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = copyRef.current;
    if (!el || reduced || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setWidth(el.offsetWidth));
    ro.observe(el);
    setWidth(el.offsetWidth);
    return () => ro.disconnect();
    // O ResizeObserver já pega troca de conteúdo; `children` fora das deps de propósito.
  }, [reduced]);

  const durationS = width > 0 && speed > 0 ? width / speed : 0;

  return (
    <div
      ref={hostRef}
      className={className ? `hl-ticker ${className}` : 'hl-ticker'}
      data-reduced={reduced ? 'true' : undefined}
      data-pause-hover={pauseOnHover && !reduced ? 'true' : undefined}
      role={ariaLabel ? 'group' : undefined}
      aria-label={ariaLabel}
    >
      <div
        className="hl-ticker__track"
        style={
          reduced || durationS <= 0
            ? undefined
            : {
                animationDuration: `${durationS}s`,
                animationDirection: direction === 'right' ? 'reverse' : 'normal',
                animationPlayState: visible ? 'running' : 'paused',
              }
        }
      >
        <div className="hl-ticker__copy" ref={copyRef}>
          {children}
        </div>
        {!reduced && (
          <div className="hl-ticker__copy" aria-hidden="true">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
