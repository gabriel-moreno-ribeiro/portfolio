import { useEffect, useRef } from 'react';

const RADIUS = 60;

function FunLens() {
  const circleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    let funElements: Element[] = [];
    let rects: DOMRect[] = [];
    let lastUpdate = 0;

    const cacheRects = () => {
      funElements = Array.from(document.querySelectorAll('[data-fun]'));
      rects = funElements.map(el => el.getBoundingClientRect());
      lastUpdate = Date.now();
    };

    cacheRects();

    const onScroll = () => { cacheRects(); };
    window.addEventListener('scroll', onScroll, { passive: true });

    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (circleRef.current) {
          circleRef.current.style.left = `${e.clientX - RADIUS}px`;
          circleRef.current.style.top = `${e.clientY - RADIUS}px`;
          circleRef.current.style.opacity = '1';
        }

        if (Date.now() - lastUpdate > 200) {
          cacheRects();
        }

        for (let i = 0; i < funElements.length; i++) {
          const el = funElements[i] as HTMLElement;
          const rect = rects[i];
          const relX = e.clientX - rect.left;
          const relY = e.clientY - rect.top;
          el.style.setProperty('--lx', `${relX}px`);
          el.style.setProperty('--ly', `${relY}px`);
        }
      });
    };

    const onLeave = () => {
      if (circleRef.current) circleRef.current.style.opacity = '0';
    };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);

    const observer = new MutationObserver(() => { cacheRects(); });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('mouseleave', onLeave);
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={circleRef}
      className="fun-lens-circle"
      aria-hidden="true"
    />
  );
}

export default FunLens;
