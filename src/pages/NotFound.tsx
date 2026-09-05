import { useEffect, useState } from 'react';
import { FiArrowLeft, FiTerminal } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useDocumentHead } from '../hooks/useDocumentHead';
import '../styles/components/shared/notFound.scss';

const LINES: [string, string][] = [
  ['find / -name "this-page"', 'find: no results'],
  ['git log --oneline | head -1', 'fatal: not a git repository'],
  ['curl -I localhost:3000/???', 'HTTP/1.1 404 Not Found'],
  ['echo $?', '1'],
];

function NotFound() {
  useDocumentHead({
    title: '404 — Gabriel Moreno Ribeiro',
    description: 'Page not found.',
    canonical: 'https://gabrielmr.com/404',
  });

  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (visibleLines >= LINES.length * 2) return;
    const delay = visibleLines % 2 === 0 ? 700 : 450;
    const id = setTimeout(() => setVisibleLines(v => v + 1), delay);
    return () => clearTimeout(id);
  }, [visibleLines]);

  return (
    <div className="not-found">
      <div className="not-found__bg">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="not-found__scanline" style={{ animationDelay: `${i * 0.7}s` }} />
        ))}
      </div>

      <div className="not-found__container">
        <div className="not-found__code" data-text="404">404</div>
        <h1 className="not-found__title">Nothing here.</h1>
        <p className="not-found__desc">
          This page doesn't exist. The rest of the site does.
        </p>

        <div className="not-found__terminal">
          <div className="not-found__terminal-bar">
            <span className="dot" /><span className="dot" /><span className="dot" />
            <span className="not-found__terminal-tab">
              <FiTerminal size={11} /> zsh — 404
            </span>
          </div>
          <div className="not-found__terminal-body">
            {LINES.map(([cmd, out], i) => (
              <div key={i}>
                {visibleLines > i * 2 && (
                  <div className="not-found__cmd">
                    <span className="not-found__prompt">~</span> {cmd}
                  </div>
                )}
                {visibleLines > i * 2 + 1 && (
                  <div className="not-found__output">{out}</div>
                )}
              </div>
            ))}
            {visibleLines < LINES.length * 2 && (
              <div className="not-found__cmd">
                <span className="not-found__prompt">~</span>
                <span className="not-found__cursor" />
              </div>
            )}
            {visibleLines >= LINES.length * 2 && (
              <div className="not-found__cmd">
                <span className="not-found__prompt">~</span>{' '}
                <Link to="/" className="not-found__go-home">cd ~/home ↵</Link>
              </div>
            )}
          </div>
        </div>

        <Link to="/" className="not-found__link">
          <FiArrowLeft /> Take me home
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
