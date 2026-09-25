import type { ExperienceEntry } from '../../../lib/data';

interface StopsIndexProps {
  /** Ordem cronológica crescente; o índice mostra do mais recente para o mais antigo. */
  entries: ExperienceEntry[];
  currentId: string | null;
}

export default function StopsIndex({ entries, currentId }: StopsIndexProps) {
  return (
    <nav className="exp__index" aria-label="Experience stops">
      <ul>
        {[...entries].reverse().map((e) => (
          <li key={e.id}>
            <a href={`#exp-${e.id}`} aria-current={e.id === currentId ? 'true' : undefined}>
              {e.org}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
