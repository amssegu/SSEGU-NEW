export function referenceId(value: unknown) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const reference = value as { id?: string; slug?: string };
    return reference.id ?? reference.slug ?? '';
  }
  return '';
}
