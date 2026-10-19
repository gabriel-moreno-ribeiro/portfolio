import { useEffect } from 'react';

interface DocumentHeadOptions {
  title: string;
  description?: string;
  canonical?: string;
  /** Keep the page out of search results. The real guard is the X-Robots-Tag
   *  header in vercel.json; this only covers crawlers that run the page. */
  noindex?: boolean;
}

export function useDocumentHead({ title, description, canonical, noindex }: DocumentHeadOptions) {
  useEffect(() => {
    document.title = title;

    const robots = document.querySelector('meta[name="robots"]');
    if (noindex && robots) robots.setAttribute('content', 'noindex, nofollow');

    if (description) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', description);
    }

    if (canonical) {
      const link = document.querySelector('link[rel="canonical"]');
      if (link) link.setAttribute('href', canonical);
    }

    return () => {
      // Keep in sync with index.html
      robots?.setAttribute('content', 'index, follow, max-image-preview:large');
      document.title = 'Gabriel Moreno Ribeiro';
      const meta = document.querySelector('meta[name="description"]');
      if (meta) {
        meta.setAttribute(
          'content',
          'Building Backoffice AI for Small and Medium Businesses @ HIBEEX. Founder @ Projeto Candela.'
        );
      }
      const link = document.querySelector('link[rel="canonical"]');
      if (link) link.setAttribute('href', 'https://gabrielmr.com');
    };
  }, [title, description, canonical, noindex]);
}
