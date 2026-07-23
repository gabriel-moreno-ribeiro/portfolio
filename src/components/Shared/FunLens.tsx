import { useEffect, useRef } from 'react';

const RADIUS = 70;

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
            textEl.textContent = text;

            const computed = window.getComputedStyle(funEl);
            textEl.style.fontSize = computed.fontSize;
            textEl.style.fontFamily = computed.fontFamily;
            textEl.style.lineHeight = computed.lineHeight;
          }

          textEl.style.opacity = '1';
          circle.classList.add('over-text');

          // The circle's top-left in viewport coords = (cx - RADIUS, cy - RADIUS).
          // We want the text to appear centered at the element's midpoint.
          // In the circle's local space, the element's center is at:
          const midX = (rect.left + rect.width / 2) - (cx - RADIUS);
          const midY = (rect.top + rect.height / 2) - (cy - RADIUS);
          textEl.style.left = `${midX}px`;
          textEl.style.top = `${midY}px`;
        } else {
          if (lastFunEl.current) {
            lastFunEl.current = null;
          }
          textEl.style.opacity = '0';
          circle.classList.remove('over-text');
        }
      });
    };

    const onLeave = () => {
      const circle = circleRef.current;
      if (circle) {
        circle.style.opacity = '0';
        circle.classList.remove('over-text');
      }
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
