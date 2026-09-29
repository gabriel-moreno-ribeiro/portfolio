import { motion } from 'motion/react';
import { useEffect } from 'react';
import { FiArrowLeft, FiEdit3 } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Shared/Footer';

function Blog() {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    document.title = 'Blog — Gabriel Moreno Ribeiro';
    return () => { document.head.removeChild(meta); };
  }, []);

  return (
    <main className="page-wrapper" id="main-content">
      <Navbar />
      <motion.div
        className="page-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <Link to="/" className="page-back"><FiArrowLeft aria-hidden="true" /> Home</Link>
        <h1 className="page-title">Blog</h1>
        <p className="page-subtitle">Notes on what I'm building and reading.</p>

        <div className="page-empty-state">
          <FiEdit3 className="page-empty-state__icon" />
          <h2>Not yet</h2>
          <p>Nothing published yet. The first posts are on the way.</p>
        </div>
      </motion.div>
      <Footer />
    </main>
  );
}

export default Blog;
