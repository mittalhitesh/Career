import { useEffect } from 'react';

function upsertMeta(selector, attrs) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    Object.entries(attrs).forEach(([k, v]) => {
      if (k !== 'content') el.setAttribute(k, v);
    });
    document.head.appendChild(el);
  }
  el.setAttribute('content', attrs.content);
}

/**
 * Updates document title and Open Graph / description meta tags per route.
 */
export default function RouteMeta({ title, description }) {
  useEffect(() => {
    const fullTitle = title ? `${title} — Career Mitar AI` : 'Career Mitar AI';
    document.title = fullTitle;

    if (description) {
      upsertMeta('meta[name="description"]', {
        name: 'description',
        content: description,
      });
      upsertMeta('meta[property="og:description"]', {
        property: 'og:description',
        content: description,
      });
    }

    upsertMeta('meta[property="og:title"]', {
      property: 'og:title',
      content: fullTitle,
    });
  }, [title, description]);

  return null;
}
