import { motion } from 'motion/react';
import { useEffect } from 'react';
import { FiCheck } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useDocumentHead } from '../hooks/useDocumentHead';
import '../styles/components/shared/contact.scss';

function ThankYou() {
  useDocumentHead({
    title: 'Message Sent · Gabriel Moreno Ribeiro',
    description: 'Thank you for reaching out.',
    noindex: true,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate('/'), 8000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <main className="thank-you" id="main-content">
      <motion.div
        className="thank-you__container"
        initial={{ scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="thank-you__icon">
          <FiCheck />
        </div>
        <h1 className="thank-you__title">Message sent.</h1>
        <p className="thank-you__desc">
          Got it. I'll write back soon.
        </p>
        <p className="thank-you__redirect">
          Taking you back home in a few seconds.{' '}
          <Link to="/">Go now</Link>
        </p>
      </motion.div>
    </main>
  );
}

export default ThankYou;
