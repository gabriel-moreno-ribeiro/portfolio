import { motion } from 'motion/react';
import { useEffect } from 'react';
import { FiCheck } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useDocumentHead } from '../hooks/useDocumentHead';

function ThankYou() {
  useDocumentHead({
    title: 'Message Sent — Gabriel Moreno Ribeiro',
    description: 'Thank you for reaching out.',
    canonical: 'https://gabrielmr.com/obrigado',
  });

  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate('/'), 8000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="thank-you">
      <motion.div
        className="thank-you__container"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="thank-you__icon">
          <FiCheck />
        </div>
        <h1 className="thank-you__title">Message sent!</h1>
        <p className="thank-you__desc">
          Thanks for reaching out. I'll get back to you soon.
        </p>
        <p className="thank-you__redirect">
          Redirecting to homepage in a few seconds...
        </p>
      </motion.div>
    </div>
  );
}

export default ThankYou;
