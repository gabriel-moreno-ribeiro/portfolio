import { useEffect, useRef } from 'react';

const RADIUS = 75;

function FunLens() {
  const circleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (circleRef.current) {
          circleRef.current.style.left = `${e.clientX - RADIUS}px`;
          circleRef.current.style.top = `${e.clientY - RADIUS}px`;
          circleRef.current.style.opacity = '1';
        }
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
      className="fun-lens-circle"
      aria-hidden="true"
    />
  );
}

export default FunLens;
