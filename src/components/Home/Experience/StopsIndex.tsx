import { forwardRef, memo } from 'react';
import type { ExperienceEntry } from '../../../lib/data';

interface StopsIndexProps {
  /** Ordem cronológica crescente; o índice mostra do mais recente para o mais antigo. */
  entries: ExperienceEntry[];
}

/** `aria-current` é escrito direto no DOM pelo Experience (muda com o scroll). */
const StopsIndex = forwardRef<HTMLElement, StopsIndexProps>(function StopsIndex({ entries }, ref) {
  return (
    <nav className="exp__index" aria-label="Experience stops" ref={ref}>
      <ul>
        {[...entries].reverse().map((e) => (
          <li key={e.id}>
            <a href={`#exp-${e.id}`}>{e.org}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
});

export default memo(StopsIndex);
