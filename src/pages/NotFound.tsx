import { motion } from 'motion/react';
import { FiArrowLeft } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useDocumentHead } from '../hooks/useDocumentHead';

function NotFound() {
  useDocumentHead({
    title: '404 — Gabriel Moreno Ribeiro',
    description: 'Page not found.',
    canonical: 'https://gabrielmr.com/404',
  });

  return (
    <div className="not-found">
      <motion.div
        className="not-found__container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <span className="not-found__code">404</span>
        <h1 className="not-found__title">Page not found</h1>
        <p className="not-found__desc">
          This page doesn't exist — but the builder does.
        </p>
        <Link to="/" className="not-found__link">
          <FiArrowLeft />
          Back to gabrielmr.com
        </Link>
      </motion.div>
    </div>
  );
}

export default NotFound;
