// Fonte ÚNICA de reduced-motion do site. Ninguém mais lê matchMedia direto.
import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function current(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(QUERY).matches
    : false;
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(current);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(QUERY);
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}
