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
      document.title = 'Gabriel Moreno Ribeiro';
      const meta = document.querySelector('meta[name="description"]');
      if (meta) {
        meta.setAttribute(
          'content',
          'Gabriel Moreno Ribeiro — 18-year-old founder and researcher on a build year. Building Backoffice AI for SMBs at HIBEEX. 39 olympiad medals. Founder of Projeto Candela.'
        );
      }
      const link = document.querySelector('link[rel="canonical"]');
      if (link) link.setAttribute('href', 'https://gabrielmr.com');
    };
  }, [title, description, canonical]);
}
