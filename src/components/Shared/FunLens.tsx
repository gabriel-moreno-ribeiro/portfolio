import { useEffect, useRef } from 'react';

const RADIUS = 70;
const DIAMETER = RADIUS * 2;

function FunLens() {
  const circleRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const lastFunEl = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const circle = circleRef.current;
        const textEl = textRef.current;
        if (!circle || !textEl) return;

        const cx = e.clientX;
        const cy = e.clientY;

        circle.style.transform = `translate(${cx - RADIUS}px, ${cy - RADIUS}px)`;
        circle.style.opacity = '1';

        const el = document.elementFromPoint(cx, cy);
        const funEl = (el?.closest('[data-fun]') || null) as HTMLElement | null;

        if (funEl) {
          const text = funEl.getAttribute('data-fun') || '';
          const rect = funEl.getBoundingClientRect();

          if (funEl !== lastFunEl.current) {
            lastFunEl.current = funEl;
            // Adaptive font size: shorter texts get bigger font
            const len = text.length;
            const fontSize = len <= 8 ? 16 : len <= 14 ? 14 : len <= 20 ? 12 : 11;
            textEl.style.fontSize = `${fontSize}px`;
            textEl.style.lineHeight = '1.3';
          }

          textEl.textContent = text;
          textEl.style.opacity = '1';

          // Position the text so it's centered where the original element is
          // relative to the circle's top-left corner
          const elCenterX = rect.left + rect.width / 2;
          const elCenterY = rect.top + rect.height / 2;
          const relCenterX = elCenterX - (cx - RADIUS);
          const relCenterY = elCenterY - (cy - RADIUS);

          textEl.style.position = 'absolute';
          textEl.style.left = `${relCenterX}px`;
          textEl.style.top = `${relCenterY}px`;
          textEl.style.transform = 'translate(-50%, -50%)';
        } else {
          if (lastFunEl.current) {
            lastFunEl.current = null;
          }
          textEl.style.opacity = '0';
        }
      });
    };

    const onLeave = () => {
      if (circleRef.current) circleRef.current.style.opacity = '0';
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={circleRef} className="fun-lens-circle" aria-hidden="true">
      <span ref={textRef} className="fun-lens-text" />
    </div>
  );
}

export default FunLens;
