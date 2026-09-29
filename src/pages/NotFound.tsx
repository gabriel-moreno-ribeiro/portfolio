import { useCallback, useState } from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import NotFoundRobot from '../components/Shared/NotFoundRobot';
import { useDocumentHead } from '../hooks/useDocumentHead';
import '../styles/components/shared/notFound.scss';

const ELSEWHERE = [
  { to: '/story', label: 'Story' },
  { to: '/library', label: 'Library' },
  { to: '/news', label: 'News' },
];

function NotFound() {
  useDocumentHead({
    title: '404 · Gabriel Moreno Ribeiro',
    description: 'Page not found.',
    canonical: 'https://gabrielmr.com/404',
  });

  const [headers, setHeaders] = useState(0);
  const onHeader = useCallback((n: number) => setHeaders(n), []);

  return (
    <main className="not-found" id="main-content">
      <div className="not-found__scene">
        <p className="nf-digits" aria-label="404">
          <span className="nf-digit" aria-hidden="true">4</span>
          <NotFoundRobot onHeader={onHeader} />
          <span className="nf-digit" aria-hidden="true">4</span>
        </p>
        <p className="not-found__score" aria-hidden="true">
          {headers > 0 ? `${headers} ${headers === 1 ? 'header' : 'headers'}` : ' '}
        </p>
      </div>

      <div className="not-found__copy">
        <h1 className="section-title not-found__title">
          This page <em>doesn't exist</em>
        </h1>
        <p className="not-found__desc">
          The robot found the missing zero and won't give it back. Everything else is where you left it.
        </p>

        <div className="not-found__actions">
          <Link to="/" className="not-found__home">
            <FiArrowLeft aria-hidden="true" /> Back to home
          </Link>
          <nav className="not-found__elsewhere" aria-label="Other pages">
            {ELSEWHERE.map((l) => (
              <Link key={l.to} to={l.to}>{l.label}</Link>
            ))}
          </nav>
        </div>
      </div>
    </main>
  );
}

export default NotFound;
