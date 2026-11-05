import { FiArrowLeft } from 'react-icons/fi';
import { Link, useParams } from 'react-router-dom';
import Markdown from '../components/Blog/Markdown';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Shared/Footer';
import { formatDate, posts } from '../content/blog';
import { useDocumentHead } from '../hooks/useDocumentHead';
import NotFound from './NotFound';
import '../styles/components/pages/blog.scss';

function BlogPost() {
  const { slug } = useParams();
  const post = posts.find((p) => p.slug === slug);

  useDocumentHead({
    title: post ? `${post.title} · Gabriel Moreno Ribeiro` : 'Blog · Gabriel Moreno Ribeiro',
    description: post?.description || "Notes on what I'm building and reading.",
    canonical: `https://gabrielmr.com/blog/${slug ?? ''}`,
    noindex: !post || post.draft,
  });

  if (!post) return <NotFound />;

  return (
    <main className="page-wrapper" id="main-content">
      <div className="page-nav"><Navbar /></div>
      <article className="page-content blog-post">
        <Link to="/blog" className="page-back"><FiArrowLeft aria-hidden="true" /> Blog</Link>
        <header className="blog-post__header">
          <h1 className="page-title">{post.title}</h1>
          <p className="blog-meta">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span aria-hidden="true">·</span>
            <span>{post.minutes} min read</span>
            {post.draft && <span className="blog-meta__draft">Draft</span>}
          </p>
        </header>
        <div className="blog-prose">
          <Markdown source={post.body} />
        </div>
      </article>
      <Footer />
    </main>
  );
}

export default BlogPost;
