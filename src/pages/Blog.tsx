import { motion } from 'motion/react';
import { useEffect } from 'react';
import { FiArrowLeft, FiEdit3 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Shared/Footer';

function Blog() {
  const navigate = useNavigate();

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    document.title = 'Blog — Gabriel Moreno Ribeiro';
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
        <h1 className="page-title">Blog.</h1>
        <p className="page-subtitle">Thoughts on building, research, and everything in between.</p>

        <div className="page-empty-state">
          <FiEdit3 className="page-empty-state__icon" />
          <h3>Coming soon</h3>
          <p>I'm working on my first posts. Check back soon.</p>
        </div>
      </motion.div>
      <Footer />
    </div>
  );
}

export default Blog;
