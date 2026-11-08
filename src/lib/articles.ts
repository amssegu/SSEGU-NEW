export interface Article {
  slug: string;
  title: string;
  description: string;
  category: string;
  author: string;
  publishedAt: string;
  image: string;
  imageAvif: string;
  body: string[];
  featured?: boolean;
}

const interimImages: Record<string, { webp: string; avif: string }> = {
  'government-unveils-new-ict-strategy-for-a-digital-uganda': {
    webp: '/uploads/article-ict.webp',
    avif: '/uploads/article-ict.avif',
  },
  'uce-results-pass-rate-recorded': {
    webp: '/uploads/article-education.webp',
    avif: '/uploads/article-education.avif',
  },
  'shilling-shows-renewed-stability': {
    webp: '/uploads/article-business.webp',
    avif: '/uploads/article-business.avif',
  },
  'ugandas-tech-startup-scene-grows': {
    webp: '/uploads/article-technology.webp',
    avif: '/uploads/article-technology.avif',
  },
  'cranes-edge-past-south-sudan': {
    webp: '/uploads/article-sports.webp',
    avif: '/uploads/article-sports.avif',
  },
  'exploring-the-hidden-gems-of-jinjas-tourism': {
    webp: '/uploads/article-travel.webp',
    avif: '/uploads/article-travel.avif',
  },
  'kampalas-top-5-nightlife-hotspots': {
    webp: '/uploads/article-lifestyle.webp',
    avif: '/uploads/article-lifestyle.avif',
  },
  'how-blockchain-is-shaping-ugandas-future-economy': {
    webp: '/uploads/article-blockchain.webp',
    avif: '/uploads/article-blockchain.avif',
  },
};
const seed: Array<Omit<Article, 'image' | 'body'> & { body?: string[] }> = [
  [
    'government-unveils-new-ict-strategy-for-a-digital-uganda',
    'Government unveils new ICT strategy for a digital Uganda',
    'A fixture report on Uganda’s digital transformation and the public institutions shaping its next chapter.',
    'politics',
    'SSEGU Editorial Desk (fixture)',
    '2026-02-10',
    true,
  ],
  [
    'uce-results-pass-rate-recorded',
    'UCE results: 62.4% pass rate recorded',
    'A fixture education report on examination results, learners and the work ahead.',
    'education',
    'SSEGU Editorial Desk (fixture)',
    '2026-02-09',
  ],
  [
    'shilling-shows-renewed-stability',
    'Shilling shows renewed stability',
    'A fixture business report about markets, households and Uganda’s changing economic outlook.',
    'business',
    'SSEGU Editorial Desk (fixture)',
    '2026-02-08',
  ],
  [
    'ugandas-tech-startup-scene-grows',
    'Uganda’s tech startup scene grows',
    'A fixture technology feature about founders, ideas and the infrastructure supporting local innovation.',
    'technology',
    'SSEGU Editorial Desk (fixture)',
    '2026-02-07',
  ],
  [
    'cranes-edge-past-south-sudan',
    'Cranes edge past South Sudan',
    'A fixture sports report celebrating a hard-fought result and the supporters behind the team.',
    'sports',
    'SSEGU Editorial Desk (fixture)',
    '2026-02-06',
  ],
  [
    'exploring-the-hidden-gems-of-jinjas-tourism',
    'Exploring the hidden gems of Jinja’s tourism',
    'A fixture travel guide to lesser-known experiences and planning considerations in Jinja.',
    'travel',
    'SSEGU Editorial Desk (fixture)',
    '2026-02-05',
  ],
  [
    'kampalas-top-5-nightlife-hotspots',
    'Kampala’s top five nightlife hotspots',
    'A fixture lifestyle guide to Kampala nightlife and responsible planning.',
    'lifestyle',
    'SSEGU Editorial Desk (fixture)',
    '2026-02-04',
  ],
  [
    'how-blockchain-is-shaping-ugandas-future-economy',
    'How blockchain is shaping Uganda’s future economy',
    'A fixture technology and business feature on blockchain’s possible economic uses in Uganda.',
    'technology',
    'SSEGU Editorial Desk (fixture)',
    '2026-02-03',
  ],
].map(
  ([slug, title, description, category, author, publishedAt, featured]) =>
    ({ slug, title, description, category, author, publishedAt, featured }) as Article,
);

export const articles: Article[] = seed.map((article) => ({
  ...article,
  image: interimImages[article.slug].webp,
  imageAvif: interimImages[article.slug].avif,
  body: [
    `${article.description} This synthetic fixture is used to exercise the main-site presentation while authoritative editorial content remains outside this phase.`,
    'The story illustrates the portable article shape used by the frontend: a title, summary, category, author, publication date, image alternative and readable body.',
  ],
}));
export const categories = [
  'news',
  'business',
  'politics',
  'technology',
  'education',
  'lifestyle',
  'travel',
  'sports',
];
export function getArticle(slug: string) {
  return articles.find((article) => article.slug === slug);
}
export function getArticles(category?: string) {
  return [...articles]
    .filter((article) => !category || article.category === category)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
export function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-UG', { dateStyle: 'medium' }).format(
    new Date(`${date}T12:00:00Z`),
  );
}
export function label(value: string) {
  return value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
