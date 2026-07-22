import { useEffect, useRef, useState } from 'react';

const SMALL_RADIUS = 15;
const BIG_RADIUS = 70;

function FunLens() {
  const circleRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [funText, setFunText] = useState('');
  const [isOverText, setIsOverText] = useState(false);

  useEffect(() => {
    let raf = 0;
    let currentTarget: Element | null = null;

    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!circleRef.current) return;

        const el = document.elementFromPoint(e.clientX, e.clientY);
        const funEl = el?.closest('[data-fun]');

        if (funEl && funEl.getAttribute('data-fun')) {
          const text = funEl.getAttribute('data-fun') || '';
          if (funEl !== currentTarget) {
            currentTarget = funEl;
            setFunText(text);
          }
          setIsOverText(true);
          circleRef.current.style.width = `${BIG_RADIUS * 2}px`;
          circleRef.current.style.height = `${BIG_RADIUS * 2}px`;
          circleRef.current.style.left = `${e.clientX - BIG_RADIUS}px`;
          circleRef.current.style.top = `${e.clientY - BIG_RADIUS}px`;
        } else {
          currentTarget = null;
          setIsOverText(false);
          circleRef.current.style.width = `${SMALL_RADIUS * 2}px`;
          circleRef.current.style.height = `${SMALL_RADIUS * 2}px`;
          circleRef.current.style.left = `${e.clientX - SMALL_RADIUS}px`;
          circleRef.current.style.top = `${e.clientY - SMALL_RADIUS}px`;
        }
        circleRef.current.style.opacity = '1';
      });
    };

    const onLeave = () => {
      if (circleRef.current) circleRef.current.style.opacity = '0';
    };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={circleRef}
      className={`fun-lens-circle ${isOverText ? 'active' : ''}`}
      aria-hidden="true"
    >
      <span ref={textRef} className="fun-lens-text">
        {funText}
      </span>
    </div>
  );
}

export default FunLens;
