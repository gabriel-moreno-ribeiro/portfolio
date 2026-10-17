import { useEffect, useRef, type RefObject } from 'react';

// Modal viewer behaviour: focus to Close on open, Escape closes, arrows step,
// Tab cycles the dialog's buttons, body scroll locked, focus back to the opener.
export function useDialog(
  dialogRef: RefObject<HTMLElement | null>,
  closeRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  onStep: (delta: number) => void,
) {
  const handlers = useRef({ onClose, onStep });
  handlers.current = { onClose, onStep };

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handlers.current.onClose();
      if (e.key === 'ArrowRight') handlers.current.onStep(1);
      if (e.key === 'ArrowLeft') handlers.current.onStep(-1);
      if (e.key === 'Tab' && dialogRef.current) {
        const f = [...dialogRef.current.querySelectorAll<HTMLElement>('button')];
        const i = f.indexOf(document.activeElement as HTMLElement);
        e.preventDefault();
        f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length]?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      opener?.focus();
    };
  }, [dialogRef, closeRef]);
}
