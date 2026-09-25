import { memo } from 'react';
import { renderEmphasis, type ExperienceEntry } from '../../../lib/data';

interface StopProps {
  entry: ExperienceEntry;
  side: 'left' | 'right';
  /** Última parada: ganha o link de contato como última linha do card. */
  cta?: boolean;
}

/**
 * `is-lit` (card sob o farol) e `is-on` no CTA são escritos no DOM pelo Experience.
 * `memo`: nenhuma prop muda depois da 1ª montagem, e o Experience re-renderiza quando o
 * `useVisible` dispara — sem isso os 6 cards eram remontados no meio do scroll.
 */
function Stop({ entry, side, cta }: StopProps) {
  const present = entry.end === 'present';
  return (
    <li
      id={`exp-${entry.id}`}
      className={`exp__stop exp__stop--${side}`}
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
        {cta && (
          <a className="exp__card-cta" href="#contact">
            Let&rsquo;s talk <span aria-hidden="true">&darr;</span>
          </a>
        )}
      </article>
    </li>
  );
}

export default memo(Stop);
