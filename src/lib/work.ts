import { absoluteUrl } from './seo';
import { getCollection, type CollectionEntry } from 'astro:content';
import { referenceId } from './content';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export type WorkStatus = 'active' | 'expired' | 'withdrawn' | 'unverified';

export interface WorkJob {
  slug: string;
  title: string;
  employer: string;
  location: string;
  country?: string;
  publishedAt?: string;
  deadline?: string;
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  arrangement: 'On-site' | 'Hybrid' | 'Remote';
  status: WorkStatus;
  description: string;
  salaryText?: string;
  salaryCurrency?: string;
  salaryPeriod?: string;
  category: string;
  origin?: 'imported' | 'editorial' | 'fixture';
  sourceId?: string;
  sourceUrl?: string;
  applicationUrl?: string;
  sourceAttribution?: string;
  sourcePermission?: string;
  prohibitJobpostingSchema?: boolean;
}

export function isEligibleWorkJob(job: WorkJob, today = new Date()) {
  if (
    job.status !== 'active' ||
    job.sourcePermission === 'permission_required' ||
    job.prohibitJobpostingSchema
  )
    return false;
  const todayValue = today.toISOString().slice(0, 10);
  return !job.deadline || job.deadline >= todayValue;
}

export function workJobStatusLabel(status: WorkStatus) {
  return {
    active: 'Active',
    expired: 'Expired',
    withdrawn: 'Withdrawn',
    unverified: 'Unverified',
  }[status];
}

export function getWorkJobStatus(job: WorkJob, today = new Date()): WorkStatus {
  return job.status === 'active' && !isEligibleWorkJob(job, today) ? 'expired' : job.status;
}

export function jobPostingJsonLd(job: WorkJob) {
  if (
    job.prohibitJobpostingSchema ||
    job.sourcePermission === 'permission_required' ||
    !job.deadline ||
    !isEligibleWorkJob(job)
  )
    return undefined;
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
  origin?: 'imported' | 'editorial' | 'fixture';
  sourceUrl?: string;
  enrolmentUrl?: string;
  subject?: string;
  level?: string;
  deliveryMode?: string;
  language?: string;
  duration?: string;
  coursePriceStatus?: string;
  certificatePriceStatus?: string;
  availabilityStatus?: string;
}

type GeneratedJobRecord = {
  sourceEnabled?: boolean;
  permissionType?: string;
  status?: string;
  sourceId?: string;
  canonicalUrl?: string;
  applicationUrl?: string;
  slug?: string;
  title?: string;
  employer?: string;
  location?: string;
  country?: string;
  category?: string;
  employmentType?: string;
  workMode?: string;
  permittedExcerpt?: string;
  salaryText?: string;
  salaryCurrency?: string;
  salaryPeriod?: string;
  publishedAt?: string;
  deadlineAt?: string;
  sourceAttribution?: string;
  prohibitJobpostingSchema?: boolean;
};

type GeneratedCourseRecord = {
  sourceEnabled?: boolean;
  permissionType?: string;
  availabilityStatus?: string;
  canonicalUrl?: string;
  enrolmentUrl?: string;
  slug?: string;
  title?: string;
  provider?: string;
  summary?: string;
  subject?: string;
  level?: string;
  deliveryMode?: string;
  language?: string;
  duration?: string;
  coursePriceStatus?: string;
  certificatePriceStatus?: string;
};

function readGeneratedData<T>(filename: string): T[] {
  const path = resolve(process.cwd(), 'src/data/generated', filename);
  if (!existsSync(path)) return [];
  try {
    const value = JSON.parse(readFileSync(path, 'utf8'));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function importedEmploymentType(value?: string): WorkJob['employmentType'] {
  return (
    (
      {
        full_time: 'Full-time',
        part_time: 'Part-time',
        contract: 'Contract',
        internship: 'Internship',
      } as Record<string, WorkJob['employmentType']>
    )[value ?? ''] ?? 'Full-time'
  );
}

function importedArrangement(value?: string): WorkJob['arrangement'] {
  return (
    (
      { on_site: 'On-site', hybrid: 'Hybrid', remote: 'Remote' } as Record<
        string,
        WorkJob['arrangement']
      >
    )[value ?? ''] ?? 'On-site'
  );
}

function fromImportedJob(record: GeneratedJobRecord): WorkJob | undefined {
  if (
    !record.sourceEnabled ||
    !record.slug ||
    !record.title ||
    !record.employer ||
    !record.location ||
    !record.canonicalUrl
  )
    return undefined;
  if (
    !['active', 'expired', 'withdrawn', 'unverified'].includes(record.status ?? '') ||
    record.permissionType === 'permission_required'
  )
    return undefined;
  return {
    slug: record.slug,
    title: record.title,
    employer: record.employer,
    location: record.location,
    country: record.country,
    publishedAt: record.publishedAt,
    deadline: record.deadlineAt?.slice(0, 10) ?? '',
    employmentType: importedEmploymentType(record.employmentType),
    arrangement: importedArrangement(record.workMode),
    status: (record.status ?? 'unverified') as WorkStatus,
    description: record.permittedExcerpt ?? '',
    salaryText: record.salaryText,
    salaryCurrency: record.salaryCurrency,
    salaryPeriod: record.salaryPeriod,
    category: record.category ?? 'Uncategorised',
    origin: 'imported',
    sourceId: record.sourceId,
    sourceUrl: record.canonicalUrl,
    applicationUrl: record.applicationUrl,
    sourceAttribution: record.sourceAttribution,
    sourcePermission: record.permissionType,
    prohibitJobpostingSchema: record.prohibitJobpostingSchema,
  };
}

function fromImportedCourse(record: GeneratedCourseRecord): WorkCourse | undefined {
  if (
    !record.sourceEnabled ||
    !record.slug ||
    !record.title ||
    !record.provider ||
    !record.canonicalUrl
  )
    return undefined;
  if (
    !['available', 'unavailable', 'unverified'].includes(record.availabilityStatus ?? '') ||
    record.permissionType === 'permission_required'
  )
    return undefined;
  return {
    slug: record.slug,
    title: record.title,
    provider: record.provider,
    format: record.deliveryMode?.replace(/_/g, ' ') ?? 'Online course',
    description: record.summary ?? '',
    origin: 'imported',
    sourceUrl: record.canonicalUrl,
    enrolmentUrl: record.enrolmentUrl,
    subject: record.subject,
    level: record.level,
    deliveryMode: record.deliveryMode,
    language: record.language,
    duration: record.duration,
    coursePriceStatus: record.coursePriceStatus,
    certificatePriceStatus: record.certificatePriceStatus,
    availabilityStatus: record.availabilityStatus,
  };
}

export function isPublishableWorkJob(job: WorkJob, today = new Date()) {
  return isEligibleWorkJob(job, today);
}

export function isPublishableWorkCourse(course: WorkCourse) {
  return Boolean(course.slug && course.title && course.provider);
}

const fixtureWorkJobs: WorkJob[] = [
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
  {
    slug: 'communications-officer-withdrawn-fixture',
    title: 'Communications Officer',
    employer: 'SSEGU Work fixture partner',
    location: 'Jinja',
    deadline: '2026-12-01',
    employmentType: 'Full-time',
    arrangement: 'Hybrid',
    status: 'withdrawn',
    description: 'A withdrawn fixture listing retained to verify stable detail URLs.',
    category: 'Communications',
  },
  {
    slug: 'project-assistant-unverified-fixture',
    title: 'Project Assistant',
    employer: 'SSEGU Work fixture partner',
    location: 'Gulu',
    deadline: '2026-12-03',
    employmentType: 'Contract',
    arrangement: 'On-site',
    status: 'unverified',
    description: 'An unverified fixture listing retained to verify safe presentation.',
    category: 'Operations',
  },
  {
    slug: 'community-liaison-missing-deadline-fixture',
    title: 'Community Liaison',
    employer: 'SSEGU Work fixture partner',
    location: 'Mbarara',
    employmentType: 'Part-time',
    arrangement: 'Remote',
    status: 'active',
    description: 'An active fixture listing with no published deadline.',
    category: 'Community',
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

const fixtureWorkCourses: WorkCourse[] = [
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

const generatedWorkJobs = readGeneratedData<GeneratedJobRecord>('jobs.json')
  .map(fromImportedJob)
  .filter((job): job is WorkJob => Boolean(job));
const generatedWorkCourses = readGeneratedData<GeneratedCourseRecord>('courses.json')
  .map(fromImportedCourse)
  .filter((course): course is WorkCourse => Boolean(course));

function mergeBySlug<T extends { slug: string }>(...groups: T[][]) {
  const seen = new Set<string>();
  return groups.flatMap((group) =>
    group.filter((item) => {
      if (seen.has(item.slug)) return false;
      seen.add(item.slug);
      return true;
    }),
  );
}

export const workJobs: WorkJob[] = mergeBySlug(generatedWorkJobs, fixtureWorkJobs);
export const workCourses: WorkCourse[] = mergeBySlug(generatedWorkCourses, fixtureWorkCourses);

function editorialEmploymentType(value: string): WorkJob['employmentType'] {
  return (
    (
      {
        'full-time': 'Full-time',
        'part-time': 'Part-time',
        contract: 'Contract',
        internship: 'Internship',
      } as Record<string, WorkJob['employmentType']>
    )[value] ?? 'Full-time'
  );
}

function editorialArrangement(value: string): WorkJob['arrangement'] {
  return (
    (
      { 'on-site': 'On-site', hybrid: 'Hybrid', remote: 'Remote' } as Record<
        string,
        WorkJob['arrangement']
      >
    )[value] ?? 'On-site'
  );
}

function fromEditorialJobEntry(entry: CollectionEntry<'jobs'>): WorkJob {
  const data = entry.data;
  const employer = workCategoryLabel(referenceId(data.employer) || 'editorial-employer');
  return {
    slug: data.slug,
    title: data.title,
    employer,
    location: data.location,
    deadline: data.deadline?.toISOString().slice(0, 10) ?? '',
    employmentType: editorialEmploymentType(data.employmentType),
    arrangement: editorialArrangement(data.arrangement),
    status: data.status === 'expired' ? 'expired' : 'active',
    description: [...data.qualifications, ...data.requirements].join(' '),
    category: employer,
    origin: 'editorial',
    sourceUrl: data.sourceUrl,
    applicationUrl: data.applicationUrl,
  };
}

function fromEditorialCourseEntry(entry: CollectionEntry<'courses'>): WorkCourse {
  const data = entry.data;
  return {
    slug: data.slug,
    title: data.title,
    provider: data.provider,
    format: data.deliveryMode.replace(/-/g, ' '),
    description: data.description,
    origin: 'editorial',
    sourceUrl: data.sourceUrl,
    enrolmentUrl: data.enrolmentUrl,
    duration: data.duration,
    availabilityStatus: data.status === 'expired' ? 'unavailable' : 'available',
  };
}

let cachedPublishedWorkJobs: WorkJob[] | undefined;
let cachedPublishedWorkCourses: WorkCourse[] | undefined;

export async function getPublishedWorkJobs(options: { status?: WorkStatus | 'all' } = {}) {
  if (cachedPublishedWorkJobs) return cachedPublishedWorkJobs;
  const editorial = (await getCollection('jobs'))
    .filter(({ data }) => data.status === 'published' || data.status === 'expired')
    .map(fromEditorialJobEntry);
  cachedPublishedWorkJobs = mergeBySlug(generatedWorkJobs, editorial, fixtureWorkJobs);
  const requestedStatus = options.status ?? 'active';
  if (requestedStatus === 'all') return cachedPublishedWorkJobs;
  return cachedPublishedWorkJobs.filter((job) =>
    requestedStatus === 'expired'
      ? job.status === 'expired' || (job.status === 'active' && !isEligibleWorkJob(job))
      : isPublishableWorkJob(job),
  );
}

export async function getPublishedWorkCourses() {
  if (cachedPublishedWorkCourses) return cachedPublishedWorkCourses;
  const editorial = (await getCollection('courses'))
    .filter(({ data }) => data.status === 'published' || data.status === 'expired')
    .map(fromEditorialCourseEntry);
  cachedPublishedWorkCourses = mergeBySlug(
    generatedWorkCourses,
    editorial,
    fixtureWorkCourses,
  ).filter(isPublishableWorkCourse);
  return cachedPublishedWorkCourses;
}

export async function getWorkJobBySlug(slug: string) {
  return (await getPublishedWorkJobs({ status: 'all' })).find((job) => job.slug === slug);
}

export async function getWorkCourseBySlug(slug: string) {
  return (await getPublishedWorkCourses()).find((course) => course.slug === slug);
}

export function getJobFilterOptions(jobs: WorkJob[] = workJobs) {
  const unique = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b));
  return {
    locations: unique(jobs.map((job) => job.location)),
    employmentTypes: unique(jobs.map((job) => job.employmentType)),
    arrangements: unique(jobs.map((job) => job.arrangement)),
    categories: unique(jobs.map((job) => job.category)),
    statuses: unique(jobs.map((job) => job.status)),
  };
}

export function toWorkJobClientData(job: WorkJob) {
  return {
    slug: job.slug,
    title: job.title,
    employer: job.employer,
    location: job.location,
    deadline: job.deadline ?? '',
    employmentType: job.employmentType,
    arrangement: job.arrangement,
    status: getWorkJobStatus(job),
    description: job.description,
    category: job.category,
    salaryText: job.salaryText ?? '',
    sourceAttribution: job.sourceAttribution ?? '',
    sourceUrl: job.sourceUrl ?? '',
    applicationUrl: job.applicationUrl ?? '',
  };
}

export function getCourseFilterOptions(courses: WorkCourse[] = workCourses) {
  const unique = (values: string[]) =>
    [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
  return {
    providers: unique(courses.map((course) => course.provider)),
    formats: unique(courses.map((course) => course.format)),
    subjects: unique(courses.map((course) => course.subject ?? '')),
    levels: unique(courses.map((course) => course.level ?? '')),
    availability: unique(courses.map((course) => course.availabilityStatus ?? '')),
  };
}

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

export function formatWorkDate(date?: string) {
  if (!date) return 'No deadline listed';
  const value = date.includes('T') ? date : `${date}T12:00:00Z`;
  return new Intl.DateTimeFormat('en-UG', { dateStyle: 'medium' }).format(new Date(value));
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
