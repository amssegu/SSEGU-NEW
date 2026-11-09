import { absoluteUrl } from './seo';
import { getCollection, type CollectionEntry } from 'astro:content';
import { referenceId } from './content';

export type WorkStatus = 'active' | 'expired';

export interface WorkJob {
  slug: string;
  title: string;
  employer: string;
  location: string;
  deadline: string;
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  arrangement: 'On-site' | 'Hybrid' | 'Remote';
  status: WorkStatus;
  description: string;
  category: string;
}

export function isEligibleWorkJob(job: WorkJob, today = new Date()) {
  if (job.status !== 'active') return false;
  const todayValue = today.toISOString().slice(0, 10);
  return !job.deadline || job.deadline >= todayValue;
}

export function jobPostingJsonLd(job: WorkJob) {
  if (!isEligibleWorkJob(job)) return undefined;
  const employmentType = job.employmentType.toUpperCase().replace('-', '_');
  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: new Date().toISOString().slice(0, 10),
    validThrough: job.deadline,
    employmentType,
    hiringOrganization: { '@type': 'Organization', name: job.employer },
    ...(job.arrangement === 'Remote'
      ? {
          jobLocationType: 'TELECOMMUTE',
          applicantLocationRequirements: { '@type': 'Country', name: 'Uganda' },
        }
      : {
          jobLocation: {
            '@type': 'Place',
            address: {
              '@type': 'PostalAddress',
              addressLocality: job.location,
              addressCountry: 'UG',
            },
          },
        }),
    url: absoluteUrl(`/work/jobs/${job.slug}/`),
  };
}

export interface WorkArticle {
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  author: string;
  publishedAt: string;
  image: string;
}

const ignoredWorkTags = new Set(['ssegu', 'bbc', 'facebook', 'twitter', 'youtube']);

export function workCategoryLabel(value: string) {
  return value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function cleanWorkText(value: string) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function getWorkTags(entry: CollectionEntry<'work-articles'>) {
  const block =
    (entry.body ?? '').match(
      /<div[^>]+aria-label=["']Article tags["'][^>]*>([\s\S]*?)<\/div>/i,
    )?.[1] ?? '';
  const supplied = entry.data.tags.map((tag: string) => cleanWorkText(tag));
  const embedded = [...block.matchAll(/<span[^>]*>([\s\S]*?)<\/span>/gi)].map((match) =>
    cleanWorkText(match[1]),
  );
  return [...supplied, ...embedded]
    .filter(
      (tag) =>
        tag.length >= 2 &&
        tag.length <= 64 &&
        tag.split(/\s+/).length <= 8 &&
        !/[.!?]/.test(tag) &&
        !ignoredWorkTags.has(tag.toLowerCase()),
    )
    .filter(
      (tag, index, tags) =>
        tags.findIndex((candidate) => candidate.toLowerCase() === tag.toLowerCase()) === index,
    )
    .slice(0, 3);
}

export function fromWorkEntry(entry: CollectionEntry<'work-articles'>): WorkArticle {
  return {
    slug: entry.data.slug,
    title: entry.data.title,
    description: entry.data.metaDescription ?? entry.data.excerpt,
    category: workCategoryLabel(referenceId(entry.data.categories[0]) || 'career-advice'),
    tags: getWorkTags(entry),
    author:
      referenceId(entry.data.author) === 'editorial-desk'
        ? 'SSEGU Editorial Desk'
        : referenceId(entry.data.author),
    publishedAt: entry.data.publishedAt.toISOString().slice(0, 10),
    image: entry.data.image ?? '/uploads/article-technology.webp',
  };
}

let cachedPublishedWorkArticles: WorkArticle[] | undefined;

async function getAllPublishedWorkArticles() {
  if (cachedPublishedWorkArticles) return cachedPublishedWorkArticles;
  const entries = (await getCollection('work-articles')).filter(
    ({ data }) => data.status === 'published',
  );
  const migrated = entries.map(fromWorkEntry);
  const migratedSlugs = new Set(migrated.map((article) => article.slug));
  const fixtures = workArticles.filter((article) => !migratedSlugs.has(article.slug));
  cachedPublishedWorkArticles = [...migrated, ...fixtures].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );
  return cachedPublishedWorkArticles;
}

export async function getPublishedWorkArticles(category?: string) {
  const allArticles = await getAllPublishedWorkArticles();
  return [...allArticles]
    .filter(
      (article) => !category || article.category.toLowerCase().replace(/\s+/g, '-') === category,
    )
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export const workCategories = ['career-advice'] as const;
export const WORK_PAGE_SIZE = 24;

export function workPageCount(total: number, pageSize = WORK_PAGE_SIZE) {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function workPageItems<T>(items: T[], page: number, pageSize = WORK_PAGE_SIZE) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export interface WorkCourse {
  slug: string;
  title: string;
  provider: string;
  format: string;
  description: string;
}

export const workJobs: WorkJob[] = [
  {
    slug: 'customer-experience-officer-mtn-uganda',
    title: 'Customer Experience Officer',
    employer: 'MTN Uganda',
    location: 'Kampala',
    deadline: '2026-11-15',
    employmentType: 'Full-time',
    arrangement: 'On-site',
    status: 'active',
    description: 'Help shape thoughtful customer journeys across MTN Uganda services and channels.',
    category: 'Customer service',
  },
  {
    slug: 'relationship-manager-stanbic-bank-uganda',
    title: 'Relationship Manager',
    employer: 'Stanbic Bank Uganda',
    location: 'Kampala',
    deadline: '2026-11-20',
    employmentType: 'Full-time',
    arrangement: 'Hybrid',
    status: 'active',
    description: 'Build trusted client relationships and deliver practical financial solutions.',
    category: 'Banking',
  },
  {
    slug: 'lecturer-computer-science-makerere',
    title: 'Lecturer – Computer Science',
    employer: 'Makerere University',
    location: 'Kampala',
    deadline: '2026-11-18',
    employmentType: 'Contract',
    arrangement: 'On-site',
    status: 'active',
    description:
      'Support the next generation of computing professionals through teaching and mentorship.',
    category: 'Education',
  },
  {
    slug: 'software-engineer-innovation-hub',
    title: 'Software Engineer',
    employer: 'Innovation Hub Uganda',
    location: 'Remote',
    deadline: '2026-12-05',
    employmentType: 'Full-time',
    arrangement: 'Remote',
    status: 'active',
    description: 'Build useful digital products with a collaborative team working across Uganda.',
    category: 'ICT',
  },
  {
    slug: 'graduate-trainee-nile-breweries',
    title: 'Graduate Trainee',
    employer: 'Nile Breweries',
    location: 'Kampala',
    deadline: '2026-08-30',
    employmentType: 'Full-time',
    arrangement: 'Hybrid',
    status: 'expired',
    description: 'A fixture listing retained to demonstrate expired-vacancy filtering behavior.',
    category: 'Graduate programme',
  },
];

export const workArticles: WorkArticle[] = [
  {
    slug: 'how-to-write-a-winning-cv-in-uganda',
    title: 'How to Write a Winning CV in Uganda',
    description: 'Tips and practical examples to help you stand out in today’s job market.',
    category: 'Career Advice',
    tags: [],
    author: 'SSEGU Work Team',
    publishedAt: '2026-11-05',
    image: '/uploads/article-education.webp',
  },
  {
    slug: 'prepare-for-your-next-job-interview',
    title: 'Prepare for Your Next Job Interview',
    description:
      'A practical checklist for making your experience and strengths easy to understand.',
    category: 'Career Advice',
    tags: [],
    author: 'SSEGU Work Team',
    publishedAt: '2026-10-30',
    image: '/uploads/article-business.webp',
  },
  {
    slug: 'skills-that-open-doors-in-ict',
    title: 'Skills That Open Doors in ICT',
    description: 'Explore the habits and foundational skills that support a career in technology.',
    category: 'Skills',
    tags: [],
    author: 'SSEGU Work Team',
    publishedAt: '2026-10-22',
    image: '/uploads/article-technology.webp',
  },
  {
    slug: 'build-a-career-plan-that-works-for-you',
    title: 'Build a Career Plan That Works for You',
    description: 'Turn your goals into a practical plan with small steps you can take this month.',
    category: 'Career Growth',
    tags: [],
    author: 'SSEGU Work Team',
    publishedAt: '2026-10-15',
    image: '/uploads/article-business.webp',
  },
];

export const workCourses: WorkCourse[] = [
  {
    slug: 'digital-skills-foundation',
    title: 'Digital Skills Foundation',
    provider: 'SSEGU Work learning guide',
    format: 'Self-paced guide',
    description:
      'Build confidence with everyday digital tools, online safety and workplace communication.',
  },
  {
    slug: 'introduction-to-data-analysis',
    title: 'Introduction to Data Analysis',
    provider: 'Fixture learning partner',
    format: 'Online course',
    description: 'Start working with spreadsheets, questions and evidence for better decisions.',
  },
  {
    slug: 'project-management-essentials',
    title: 'Project Management Essentials',
    provider: 'SSEGU Work learning guide',
    format: 'Practical series',
    description: 'Learn the basic routines that help teams plan, communicate and deliver work.',
  },
];

export const cvResources = [
  {
    slug: 'cv-checklist',
    title: 'CV Checklist',
    description: 'A clear checklist for reviewing your CV before you send it.',
    detail:
      'Review your contact details, profile, experience, skills and references before sharing your CV.',
  },
  {
    slug: 'cover-letter-guide',
    title: 'Cover Letter Guide',
    description: 'A simple structure for connecting your experience to the opportunity.',
    detail:
      'Connect your experience to the specific role, show what you understand and finish with a clear next step.',
  },
  {
    slug: 'interview-preparation',
    title: 'Interview Preparation',
    description: 'Prompts to help you prepare examples and thoughtful questions.',
    detail:
      'Prepare short examples that show your actions, decisions and results, then practise saying them naturally.',
  },
];

export const internships = [
  {
    slug: 'ict-internship-kampala',
    title: 'ICT Internship',
    employer: 'SSEGU Work fixture partner',
    location: 'Kampala',
    deadline: '2026-12-12',
    arrangement: 'On-site',
    description:
      'A supervised placement for learners building practical digital and support skills.',
  },
  {
    slug: 'communications-internship-hybrid',
    title: 'Communications Internship',
    employer: 'Community impact organisation',
    location: 'Kampala / Hybrid',
    deadline: '2026-12-18',
    arrangement: 'Hybrid',
    description: 'Practice clear storytelling, research and community-facing communications.',
  },
];

export function formatWorkDate(date: string) {
  return new Intl.DateTimeFormat('en-UG', { dateStyle: 'medium' }).format(
    new Date(`${date}T12:00:00Z`),
  );
}

export function getWorkJob(slug: string) {
  return workJobs.find((job) => job.slug === slug);
}

export function getWorkArticle(slug: string) {
  return workArticles.find((article) => article.slug === slug);
}

export function getWorkCourse(slug: string) {
  return workCourses.find((course) => course.slug === slug);
}
