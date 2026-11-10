export function referenceId(value: unknown) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const reference = value as { id?: string; slug?: string };
    return reference.id ?? reference.slug ?? '';
  }
  return '';
}

const legacyArticleLead = /^\s*(?:<p[^>]*>(?:\s|&nbsp;|&#160;)*<\/p>\s*)?<h1\b[^>]*>[\s\S]*?<\/h1>\s*<div\b[^>]*>[\s\S]*?(?:<img\b[^>]*>|<a\b[^>]*>[\s\S]*?<\/a>)[\s\S]*?<\/div>[\s\S]*?<\/div>\s*/i;

export function stripLegacyArticleLead(body: string) {
  const cleaned = body.replace(legacyArticleLead, '');
  return cleaned === body ? undefined : cleaned;
}
