import { motion } from 'motion/react';
import { useEffect } from 'react';
import { FiArrowLeft, FiRadio } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Shared/Footer';

function News() {
  const navigate = useNavigate();

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    document.title = 'News — Gabriel Moreno Ribeiro';
    return () => { document.head.removeChild(meta); };
  }, []);

  return (
    <div className="page-wrapper">
      <Navbar />
      <motion.div
        className="page-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <button className="page-back" onClick={() => navigate('/')}>
          <FiArrowLeft /> Back
        </button>
        <h1 className="page-title">News.</h1>
        <p className="page-subtitle">Press coverage and media mentions.</p>

        <div className="page-empty-state">
          <FiRadio className="page-empty-state__icon" />
          <h3>Nothing yet</h3>
          <p>News and press mentions will appear here.</p>
        </div>
      </motion.div>
      <Footer />
    </div>
  );
}

export default News;
