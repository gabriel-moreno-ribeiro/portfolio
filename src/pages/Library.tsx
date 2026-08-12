import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Books from "../components/Home/Books";

function Library() {
  const { bookId } = useParams<{ bookId?: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const title = bookId
      ? `${bookId.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())} - Library`
      : "Library - Gabriel Moreno Ribeiro";
    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", bookId
      ? `Gabriel's notes on ${bookId.replace(/-/g, " ")}`
      : "Gabriel Moreno Ribeiro's personal library - 28 books across 11 years of reading"
    );

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.href = bookId
      ? `https://gabrielmr.com/library/${bookId}`
      : "https://gabrielmr.com/library";

    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement("meta");
      ogTitle.setAttribute("property", "og:title");
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute("content", title);

    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement("meta");
      ogUrl.setAttribute("property", "og:url");
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute("content", canonical.href);

    return () => {
      document.title = "Gabriel Moreno Ribeiro";
    };
  }, [bookId]);

  const handleNavigate = (id: string | null) => {
    if (id) {
      navigate(`/library/${id}`, { replace: true });
    } else {
      navigate("/library", { replace: true });
    }
  };

  return (
    <div className="library-page" id="main-content">
      <h1 className="sr-only">Gabriel's Library</h1>
      <Books initialBookId={bookId} onNavigate={handleNavigate} />
    </div>
  );
}

export default Library;
