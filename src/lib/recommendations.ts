interface SluggedItem {
  slug: string;
}

function recommendationHash(seed: string, value: string) {
  let hash = 2166136261;
  const input = `${seed}:${value}`;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function selectRecommendations<T extends SluggedItem>(
  items: T[],
  seed: string,
  limit: number,
) {
  return [...items]
    .sort((first, second) => {
      const difference =
        recommendationHash(seed, first.slug) - recommendationHash(seed, second.slug);
      return difference || first.slug.localeCompare(second.slug);
    })
    .slice(0, limit);
}
