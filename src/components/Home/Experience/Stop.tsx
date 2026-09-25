import { renderEmphasis, type ExperienceEntry } from '../../../lib/data';

interface StopProps {
  entry: ExperienceEntry;
  side: 'left' | 'right';
  /** Card sob o farol: o carro está nesta parada. */
  lit: boolean;
}

export default function Stop({ entry, side, lit }: StopProps) {
  const present = entry.end === 'present';
  return (
    <li
      id={`exp-${entry.id}`}
      className={`exp__stop exp__stop--${side}${lit ? ' is-lit' : ''}`}
      tabIndex={-1}
    >
      <article className="exp__card">
        <p className="exp__card-meta">
          <span className="exp__card-year">{entry.start.slice(0, 4)}</span>
          {entry.city && <span className="exp__card-city">{entry.city}</span>}
        </p>
        <h3 className="exp__card-org">
          {entry.url ? (
            <a href={entry.url} target="_blank" rel="noopener noreferrer">
              {entry.org}
            </a>
          ) : (
            entry.org
          )}
        </h3>
        <p className="exp__card-role">{entry.role}</p>
        <p className="exp__card-period">
          {entry.periodLabel}
          {present && <span className="exp__tag">present</span>}
        </p>
        {entry.note && <p className="exp__card-note">{entry.note}</p>}
        <ul className="exp__bullets">
          {entry.bullets.map((b, i) => (
            <li key={i}>{renderEmphasis(b)}</li>
          ))}
        </ul>
      </article>
    </li>
  );
}
