export const SITE_URL = 'https://ssegu.com';

export type JsonLd = Record<string, unknown> | Array<Record<string, unknown>>;

export function absoluteUrl(pathOrUrl: string) {
  return new URL(pathOrUrl, SITE_URL).toString();
}

export function canonicalFor(pathname: string) {
  const path = pathname.split(/[?#]/, 1)[0] || '/';
  return absoluteUrl(path.startsWith('/') ? path : `/${path}`);
}

export function jsonLd(value: JsonLd) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; path?: string }>,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.path ? { item: absoluteUrl(item.path) } : {}),
    })),
  };
}

export function articleJsonLd(input: {
  headline: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  author: string;
  path: string;
  section?: string;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    description: input.description,
    ...(input.image ? { image: [absoluteUrl(input.image)] } : {}),
    datePublished: input.datePublished,
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
    author: { '@type': 'Person', name: input.author },
    publisher: { '@type': 'Organization', name: 'SSEGU', url: SITE_URL },
    mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(input.path) },
    ...(input.section ? { articleSection: input.section } : {}),
  };
}
