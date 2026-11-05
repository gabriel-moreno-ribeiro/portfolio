import { FiArrowLeft, FiArrowRight, FiEdit3 } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Shared/Footer';
import { formatDate, posts } from '../content/blog';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { Reveal } from '../lib/motion';
import '../styles/components/pages/blog.scss';

function Blog() {
  useDocumentHead({
    title: 'Blog · Gabriel Moreno Ribeiro',
    description: "Notes on what I'm building and reading.",
    canonical: 'https://gabrielmr.com/blog',
    noindex: posts.length === 0,
  });

  return (
    <main className="page-wrapper" id="main-content">
      <div className="page-nav"><Navbar /></div>
      <div className="page-content">
        <Link to="/" className="page-back"><FiArrowLeft aria-hidden="true" /> Home</Link>
        <h1 className="page-title">Blog</h1>
        <p className="page-subtitle">Notes on what I'm building and reading.</p>

        {posts.length === 0 ? (
          <div className="page-empty-state">
            <FiEdit3 className="page-empty-state__icon" aria-hidden="true" />
            <h2>Not yet</h2>
            <p>Nothing published yet. The first posts are on the way.</p>
          </div>
        ) : (
          <ol className="blog-list">
            {posts.map((p) => (
              <Reveal as="li" key={p.slug} className="blog-list__item">
                <Link to={`/blog/${p.slug}`} className="blog-list__link">
                  <p className="blog-meta">
                    <time dateTime={p.date}>{formatDate(p.date)}</time>
                    <span aria-hidden="true">·</span>
                    <span>{p.minutes} min read</span>
                    {p.draft && <span className="blog-meta__draft">Draft</span>}
                  </p>
                  <h2 className="blog-list__title">{p.title}</h2>
                  {p.description && <p className="blog-list__desc">{p.description}</p>}
                  <span className="blog-list__more">Read <FiArrowRight aria-hidden="true" /></span>
                </Link>
              </Reveal>
            ))}
          </ol>
        )}
      </div>
      <Footer />
    </main>
  );
}

export default Blog;
