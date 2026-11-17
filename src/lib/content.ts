export function referenceId(value: unknown) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const reference = value as { id?: string; slug?: string };
    return reference.id ?? reference.slug ?? '';
  }
  return '';
}

const legacyArticleLead =
  /^\s*(?:<p[^>]*>(?:\s|&nbsp;|&#160;)*<\/p>\s*)?<h1\b[^>]*>[\s\S]*?<\/h1>\s*<div\b[^>]*>[\s\S]*?(?:<img\b[^>]*>|<a\b[^>]*>[\s\S]*?<\/a>)[\s\S]*?<\/div>[\s\S]*?<\/div>\s*/i;

export function stripLegacyArticleLead(body: string) {
  const cleaned = body.replace(legacyArticleLead, '');
  return cleaned === body ? undefined : cleaned;
}

export function normalizeArticleBody(body: string) {
  return body
    .replace(/<h([1-6])[^>]*>/gi, '<h$1>')
    .replace(/<p[^>]*>\s*(?:&nbsp;|&#160;|<br\s*\/?>)?\s*<\/p>/gi, '')
    .replace(/(<h[1-6]>)(?:\s*<br\s*\/?>)+/gi, '$1')
    .replace(/(?:<br\s*\/?>\s*)+(<\/h[1-6]>)/gi, '$1')
    .replace(/<h[1-6]>\s*<\/h[1-6]>/gi, '')
    .trim();
}

export function estimateReadingTime(value: string | string[]) {
  const text = Array.isArray(value) ? value.join(' ') : value;
  const words = text
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
