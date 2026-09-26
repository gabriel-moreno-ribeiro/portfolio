// Progresso 0..1 de uma seção, suavizado, com velocidade derivada.
// Um único rAF por seção, e ele só existe enquanto há trabalho: para quando assenta, quando a
// seção sai da viewport e quando a aba fica oculta.
//
// O quadro não lê layout. `getBoundingClientRect`/`scrollY`/`innerHeight` forçam estilo e
// layout se algum rAF anterior no mesmo quadro escreveu no DOM (medido: 11–22 ms de layout
// forçado por quadro sob CPU 4×). A posição da seção no documento fica em cache e só é
// remedida quando algo pode tê-la movido (ResizeObserver, resize, entrada na viewport); o
// scroll só lê `scrollY` no próprio evento, antes dos rAF do quadro.
import { useMotionValue } from 'motion/react';
import { useEffect } from 'react';
import type { ElementRef, SectionProgress, SectionProgressOptions } from './types';
import { useReducedMotion } from './useReducedMotion';

const EPSILON = 0.0005;

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function useSectionProgress(
  ref: ElementRef,
  { smoothing = 0.12 }: SectionProgressOptions = {},
): SectionProgress {
  const progress = useMotionValue(0);
  const velocity = useMotionValue(0);
  const raw = useMotionValue(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    // Reduced-motion: estado final, sem listeners e sem rAF.
    if (reduced) {
      raw.set(1);
      progress.set(1);
      velocity.set(0);
      return;
    }
    const el = ref.current;
    if (!el || typeof window === 'undefined') return;

    const k = smoothing <= 0 ? 1 : Math.min(1, smoothing);
    let rafId = 0;
    let inView = true;
    let lastTime = 0;
    let smoothVelocity = 0;
    // Cache: topo da seção no documento, quanto dela rola, e o alvo atual.
    let docTop = 0;
    let span = 0;
    let target = 0;

    const retarget = (scrollY: number): void => {
      const top = docTop - scrollY;
      target = span <= 0 ? (top <= 0 ? 1 : 0) : clamp01(-top / span);
      raw.set(target);
    };

    // Só fora do rAF: callbacks de ResizeObserver/IntersectionObserver e `resize` rodam com o
    // layout recém-feito, então a leitura não força nada.
    const remeasure = (): void => {
      const rect = el.getBoundingClientRect();
      const scrollY = window.scrollY;
      docTop = rect.top + scrollY;
      span = rect.height - window.innerHeight;
      retarget(scrollY);
    };

    const canRun = (): boolean => inView && !document.hidden;

    // Por quadro: um lerp e dois `set`. Nenhuma leitura de layout, nenhuma alocação.
    const frame = (time: number): void => {
      rafId = 0;
      if (!canRun()) return;
      const dt = lastTime ? Math.max(0.001, (time - lastTime) / 1000) : 0.016;
      lastTime = time;

      const value = progress.get();
      const diff = target - value;
      if (Math.abs(diff) < EPSILON) {
        progress.set(target);
        smoothVelocity = 0;
        velocity.set(0);
        lastTime = 0;
        return;
      }
      const next = value + diff * k;
      progress.set(next);
      smoothVelocity += ((next - value) / dt - smoothVelocity) * 0.25;
      velocity.set(smoothVelocity);
      rafId = requestAnimationFrame(frame);
    };

    const start = (): void => {
      if (rafId || !canRun()) return;
      lastTime = 0;
      rafId = requestAnimationFrame(frame);
    };

    const stop = (): void => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      lastTime = 0;
      smoothVelocity = 0;
      velocity.set(0);
    };

    const onScroll = (): void => {
      retarget(window.scrollY);
      start();
    };

    const onResize = (): void => {
      remeasure();
      start();
    };

    const onVisibility = (): void => {
      if (document.hidden) stop();
      else {
        remeasure();
        progress.set(target);
        start();
      }
    };

    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              inView = entries[entries.length - 1].isIntersecting;
              if (inView) {
                remeasure();
                start();
              } else {
                stop();
              }
            },
            { rootMargin: '10% 0px' },
          )
        : null;
    io?.observe(el);

    // O topo da seção no documento só muda se algo ACIMA dela mudar de altura (ou ela mesma,
    // para `span`): observa a seção, o documento e cada irmão anterior da seção e dos ancestrais.
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null;
    if (ro) {
      ro.observe(el);
      ro.observe(document.documentElement);
      for (let node: Element | null = el; node && node !== document.body; node = node.parentElement) {
        for (let sib = node.previousElementSibling; sib; sib = sib.previousElementSibling) ro.observe(sib);
      }
    }

    remeasure();
    progress.set(target);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      io?.disconnect();
      ro?.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [ref, smoothing, reduced, progress, velocity, raw]);

  return { progress, velocity, raw };
}
