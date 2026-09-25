// Digita e apaga frases. Só roda visível e com a aba ativa; sob reduced-motion troca seca.
// O HTML inicial já traz a frase inteira: sem JS, o conteúdo está lá.
import { useEffect, useRef, useState } from 'react';
import type { TypewriterProps } from './types';
import { usePageVisible } from './usePageVisible';
import { useReducedMotion } from './useReducedMotion';
import { useVisible } from './useVisible';

type Phase = 'hold' | 'typing' | 'deleting';

export function Typewriter({
  phrases,
  intervalMs = 4000,
  typeMs = 45,
  ariaLive = 'polite',
  className,
}: TypewriterProps) {
  const hostRef = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const inView = useVisible(hostRef, { rootMargin: '0px' });
  const pageVisible = usePageVisible();

  const list = phrases.length > 0 ? phrases : [''];
  // Ref: `phrases` costuma ser um literal inline, que muda de identidade a cada render.
  const listRef = useRef(list);
  listRef.current = list;
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('hold');
  const phrase = list[index % list.length];
  const [chars, setChars] = useState(phrase.length);

  const running = inView && pageVisible && list.length > 1;

  useEffect(() => {
    if (!running) return;
    const advance = () => setIndex((i) => (i + 1) % listRef.current.length);

    if (reduced) {
      // Troca seca, sem digitar.
      const id = setTimeout(() => {
        advance();
        setChars(listRef.current[(index + 1) % listRef.current.length].length);
      }, intervalMs);
      return () => clearTimeout(id);
    }

    if (phase === 'hold') {
      const id = setTimeout(() => setPhase('deleting'), intervalMs);
      return () => clearTimeout(id);
    }
    if (phase === 'deleting') {
      if (chars === 0) {
        advance();
        setPhase('typing');
        return;
      }
      const id = setTimeout(() => setChars((c) => c - 1), Math.max(8, typeMs / 2));
      return () => clearTimeout(id);
    }
    if (chars >= phrase.length) {
      setPhase('hold');
      return;
    }
    const id = setTimeout(() => setChars((c) => c + 1), typeMs);
    return () => clearTimeout(id);
  }, [running, reduced, phase, chars, index, phrase.length, intervalMs, typeMs, list.length]);

  // Ao ficar parado (fora da tela, aba oculta ou frase única), mostra a frase inteira.
  useEffect(() => {
    if (!running && phase !== 'hold') {
      setPhase('hold');
      setChars(phrase.length);
    }
  }, [running, phase, phrase.length]);

  const shown = phase === 'hold' ? phrase : phrase.slice(0, chars);

  return (
    <span ref={hostRef} className={className} aria-live={ariaLive} data-phase={phase}>
      <span aria-hidden="true">{shown}</span>
      <span className="sr-only">{phase === 'hold' ? phrase : ''}</span>
    </span>
  );
}
