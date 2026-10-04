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

// The robot has opinions about your streak
function milestone(best: number) {
  if (best >= 30) return 'okay, the zero is officially a tool now: #14';
  if (best >= 20) return 'more tries than the D-20 took to start';
  if (best >= 10) return 'numbered, like everything in the garage';
  if (best >= 5) return 'grandpa would have handed you the wrench (#1)';
  return '';
}

function NotFound() {
  useDocumentHead({
    title: '404 · Gabriel Moreno Ribeiro',
    description: 'Page not found.',
    noindex: true,
  });

  const [score, setScore] = useState({ streak: 0, best: 0 });
  const onScore = useCallback((streak: number, best: number) => setScore({ streak, best }), []);

  return (
    <main className="not-found" id="main-content">
      <div className="not-found__scene">
        <NotFoundRobot onScore={onScore} />
        <p className="not-found__score" aria-hidden="true">
          {score.streak > 0 && `${score.streak} in a row`}
          {score.streak > 0 && score.best > score.streak && ' · '}
          {score.best > score.streak && `best ${score.best}`}
          {milestone(score.best) && <span className="not-found__note"> · {milestone(score.best)}</span>}
        </p>
      </div>

      <div className="not-found__copy">
        <h1 className="section-title not-found__title">
          This page <em>doesn't exist</em>
        </h1>
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
