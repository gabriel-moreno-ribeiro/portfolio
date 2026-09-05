import { useEffect } from 'react';

interface DocumentHeadOptions {
  title: string;
  description?: string;
  canonical?: string;
}

export function useDocumentHead({ title, description, canonical }: DocumentHeadOptions) {
  useEffect(() => {
    document.title = title;

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
      document.title = 'Gabriel Moreno Ribeiro — Founder, HIBEEX';
      const meta = document.querySelector('meta[name="description"]');
      if (meta) {
        meta.setAttribute(
          'content',
          '18, founder and researcher on a build year. CEO of HIBEEX, backoffice AI for small and medium businesses. Founder of Projeto Candela. 39 olympiad medals.'
        );
      }
      const link = document.querySelector('link[rel="canonical"]');
      if (link) link.setAttribute('href', 'https://gabrielmr.com');
    };
  }, [title, description, canonical]);
}
