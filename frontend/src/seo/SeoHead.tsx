import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { resolveSeoMetadata } from './metadata';

const ensureMeta = (selector: string, attribute: 'name' | 'property', key: string, content: string) => {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);

  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }

  tag.setAttribute('content', content);
};

const ensureCanonical = (href: string) => {
  let tag = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', 'canonical');
    document.head.appendChild(tag);
  }

  tag.setAttribute('href', href);
};

const ensureJsonLd = (jsonData?: Record<string, unknown> | Array<Record<string, unknown>>) => {
  const existing = document.head.querySelector<HTMLScriptElement>('script[data-seo-json-ld="true"]');

  if (!jsonData) {
    existing?.remove();
    return;
  }

  const script = existing ?? document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-seo-json-ld', 'true');
  script.text = JSON.stringify(jsonData);

  if (!existing) {
    document.head.appendChild(script);
  }
};

const normalizeSiteUrl = (siteUrl?: string) => {
  if (!siteUrl) {
    return window.location.origin;
  }

  return siteUrl.replace(/\/+$/, '');
};

export const SeoHead = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const metadata = resolveSeoMetadata(pathname);
    const siteUrl = normalizeSiteUrl(import.meta.env.VITE_SITE_URL);
    const canonicalUrl = `${siteUrl}${metadata.canonicalPath}`;
    const imageUrl = `${siteUrl}${metadata.imagePath}`;

    document.title = metadata.title;

    ensureMeta('meta[name="description"]', 'name', 'description', metadata.description);
    ensureMeta('meta[name="robots"]', 'name', 'robots', metadata.robots);
    ensureMeta('meta[name="googlebot"]', 'name', 'googlebot', metadata.robots);
    ensureMeta('meta[name="keywords"]', 'name', 'keywords', metadata.keywords);

    ensureMeta('meta[property="og:type"]', 'property', 'og:type', metadata.type);
    ensureMeta('meta[property="og:site_name"]', 'property', 'og:site_name', 'TrueMatch');
    ensureMeta('meta[property="og:title"]', 'property', 'og:title', metadata.title);
    ensureMeta('meta[property="og:description"]', 'property', 'og:description', metadata.description);
    ensureMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    ensureMeta('meta[property="og:image"]', 'property', 'og:image', imageUrl);
    ensureMeta('meta[property="og:image:secure_url"]', 'property', 'og:image:secure_url', imageUrl);
    ensureMeta('meta[property="og:image:type"]', 'property', 'og:image:type', 'image/png');
    ensureMeta('meta[property="og:image:width"]', 'property', 'og:image:width', '1200');
    ensureMeta('meta[property="og:image:height"]', 'property', 'og:image:height', '630');
    ensureMeta('meta[property="og:image:alt"]', 'property', 'og:image:alt', 'TrueMatch Study Abroad and Work Abroad Services');

    ensureMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    ensureMeta('meta[name="twitter:title"]', 'name', 'twitter:title', metadata.title);
    ensureMeta('meta[name="twitter:description"]', 'name', 'twitter:description', metadata.description);
    ensureMeta('meta[name="twitter:url"]', 'name', 'twitter:url', canonicalUrl);
    ensureMeta('meta[name="twitter:image"]', 'name', 'twitter:image', imageUrl);

    ensureCanonical(canonicalUrl);
    ensureJsonLd(metadata.structuredData);
  }, [pathname]);

  return null;
};
