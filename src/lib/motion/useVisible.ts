// Gate por IntersectionObserver: nada anima nem conta tempo fora da viewport.
import { useEffect, useState } from 'react';
import type { ElementRef, VisibleOptions } from './types';

export function useVisible(
  ref: ElementRef,
  { rootMargin = '0px', threshold = 0, once = false }: VisibleOptions = {},
): boolean {
  const [visible, setVisible] = useState(false);
  const thresholdKey = Array.isArray(threshold) ? threshold.join(',') : String(threshold);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) io.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { rootMargin, threshold },
    );
    io.observe(el);
    return () => io.disconnect();
    // `thresholdKey` estabiliza arrays literais vindos do JSX.
     
  }, [ref, rootMargin, thresholdKey, once]);

  return visible;
}
