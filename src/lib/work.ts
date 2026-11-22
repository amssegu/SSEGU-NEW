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
  employmentType:
    | 'Full-time'
    | 'Part-time'
    | 'Contract'
    | 'Temporary'
    | 'Internship'
    | 'Volunteer';
  arrangement: 'On-site' | 'Hybrid' | 'Remote' | 'Not specified';
  status: WorkStatus;
  description: string;
  requirements?: string[];
  qualifications?: string[];
  applicationInstructions?: string;
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
    job.sourcePermission === 'permission_required'
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
  updatedAt?: string;
  image: string;
  imageAlt?: string;
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
    updatedAt: entry.data.updatedAt?.toISOString().slice(0, 10),
    image: entry.data.image ?? '/uploads/article-technology.webp',
    imageAlt: entry.data.imageAlt,
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
export const WORK_PAGE_SIZE = 9;

export function workPageCount(total: number, pageSize = WORK_PAGE_SIZE) {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function workPageItems<T>(items: T[], page: number, pageSize = WORK_PAGE_SIZE) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export interface WorkCourse {
  slug: string;
  catalogueNumber?: number;
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
  termsUrl?: string;
  sourceAttribution?: string;
  lastCheckedAt?: string;
  sourcePermission?: string;
  category?: string;
  platform?: string;
  approvalStatus?: string;
  publicationStatus?: string;
  researchStatus?: string;
  skills?: string[];
  tools?: string[];
  careerRoles?: string[];
  prerequisites?: string[];
  credentialType?: string;
  freeAccess?: string;
  paidAccess?: string;
  freePaidRecommendation?: string;
  freePaidRationale?: string;
  ugandaNotes?: string;
  portfolioProjects?: string[];
  nextSteps?: string[];
  relatedCourses?: string[];
  body?: string;
  sources?: { label: string; url: string; checkedAt?: string; evidence: string }[];
  curriculum?: string[];
  learningOutcomes?: string[];
  practicalSkills?: string[];
  transferableSkills?: string[];
  equipment?: string[];
  industries?: string[];
  freelanceApplications?: string[];
  regions?: string[];
  paidPrice?: string;
  billingModel?: string;
  jobEvidence?: { title: string; employer: string; location: string; url: string; checkedAt: string; requestedSkills: string[]; requirements: string[]; courseCoverage: string; remainingGaps: string[] }[];
  editorialAssessment?: string;
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
  description?: string;
  publishedAt?: string;
  deadlineAt?: string;
  sourceAttribution?: string;
  requirements?: string[];
  qualifications?: string[];
  applicationInstructions?: string;
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
  termsUrl?: string;
  sourceAttribution?: string;
  lastCheckedAt?: string;
};

function readGeneratedData<T>(filename: string): T[] {
  const snapshotPath = resolve(process.cwd(), 'src/data/snapshots', filename);
  const path = existsSync(snapshotPath)
    ? snapshotPath
    : resolve(process.cwd(), 'src/data/generated', filename);
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
        temporary: 'Temporary',
        internship: 'Internship',
        volunteer: 'Volunteer',
      } as Record<string, WorkJob['employmentType']>
    )[value ?? ''] ?? 'Full-time'
  );
}

function importedArrangement(value?: string): WorkJob['arrangement'] {
  return (
    (
      {
        on_site: 'On-site',
        hybrid: 'Hybrid',
        remote: 'Remote',
        unknown: 'Not specified',
      } as Record<string, WorkJob['arrangement']>
    )[value ?? ''] ?? 'Not specified'
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
    description: (record.description ?? record.permittedExcerpt ?? '').replace(/\\n/g, '\n'),
    requirements: record.requirements ?? [],
    qualifications: record.qualifications ?? [],
    applicationInstructions: record.applicationInstructions,
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
    termsUrl: record.termsUrl,
    sourceAttribution: record.sourceAttribution,
    lastCheckedAt: record.lastCheckedAt,
    sourcePermission: record.permissionType,
  };
}

export function isPublishableWorkJob(job: WorkJob, today = new Date()) {
  return isEligibleWorkJob(job, today);
}

export function isPublishableWorkCourse(course: WorkCourse) {
  return Boolean(course.slug && course.title && course.provider);
}

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

export const workJobs: WorkJob[] = generatedWorkJobs;
export const workCourses: WorkCourse[] = generatedWorkCourses;

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
  const data = entry.data as {
    slug: string;
    title: string;
    employer: string;
    location: string;
    deadline?: Date;
    employmentType: string;
    arrangement: string;
    qualifications: string[];
    requirements: string[];
    applicationInstructions?: string;
    sourceUrl?: string;
    applicationUrl?: string;
    status: string;
  };
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
    requirements: data.requirements,
    qualifications: data.qualifications,
    applicationInstructions: data.applicationInstructions,
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
    catalogueNumber: data.catalogueNumber,
    title: data.title,
    provider: data.provider,
    format: data.deliveryMode.replace(/-/g, ' '),
    description: data.description,
    origin: 'editorial',
    sourceUrl: data.sourceUrl,
    enrolmentUrl: data.enrolmentUrl,
    subject: data.subject,
    level: data.level,
    language: data.language,
    duration: data.duration,
    coursePriceStatus: data.coursePriceStatus ?? data.cost,
    certificatePriceStatus: data.certificatePriceStatus,
    availabilityStatus: data.status === 'expired' ? 'unavailable' : 'not verified',
    termsUrl: data.termsUrl,
    lastCheckedAt:
      data.lastCheckedAt?.toISOString().slice(0, 10) ?? data.updatedAt?.toISOString().slice(0, 10),
    sourceAttribution:
      data.sourceAttribution ??
      `Course details supplied by ${data.provider}. SSEGU is not affiliated with the provider.`,
    category: data.category,
    platform: data.platform,
    approvalStatus: data.approvalStatus,
    publicationStatus: data.status,
    researchStatus: data.researchStatus,
    skills: data.skills,
    tools: data.tools,
    careerRoles: data.careerRoles,
    prerequisites: data.prerequisites,
    credentialType: data.credentialType,
    freeAccess: data.freeAccess,
    paidAccess: data.paidAccess,
    freePaidRecommendation: data.freePaidRecommendation,
    freePaidRationale: data.freePaidRationale,
    ugandaNotes: data.ugandaNotes,
    portfolioProjects: data.portfolioProjects,
    nextSteps: data.nextSteps,
    relatedCourses: data.relatedCourses,
    body: entry.body,
    sources: data.sources?.map((source: { label: string; url: string; checkedAt?: Date; evidence: string }) => ({ ...source, checkedAt: source.checkedAt?.toISOString().slice(0, 10) })),
    curriculum: data.curriculum,
    learningOutcomes: data.learningOutcomes,
    practicalSkills: data.practicalSkills,
    transferableSkills: data.transferableSkills,
    equipment: data.equipment,
    industries: data.industries,
    freelanceApplications: data.freelanceApplications,
    regions: data.regions,
    paidPrice: data.paidPrice,
    billingModel: data.billingModel,
    jobEvidence: data.jobEvidence?.map((evidence) => ({
      ...evidence,
      checkedAt: evidence.checkedAt.toISOString().slice(0, 10),
    })),
    editorialAssessment: data.editorialAssessment,
  };
}

let cachedPublishedWorkJobs: WorkJob[] | undefined;
let cachedPublishedWorkCourses: WorkCourse[] | undefined;
let cachedCourseDirectory: WorkCourse[] | undefined;

export async function getPublishedWorkJobs(options: { status?: WorkStatus | 'all' } = {}) {
  if (cachedPublishedWorkJobs) {
    const requestedStatus = options.status ?? 'active';
    if (requestedStatus === 'all') return cachedPublishedWorkJobs;
    return cachedPublishedWorkJobs.filter((job) =>
      requestedStatus === 'expired'
        ? job.status === 'expired' || (job.status === 'active' && !isEligibleWorkJob(job))
        : isPublishableWorkJob(job),
    );
  }
  const editorial = (await getCollection('jobs'))
    .filter(({ data }) => data.status === 'published' || data.status === 'expired')
    .map(fromEditorialJobEntry);
  cachedPublishedWorkJobs = mergeBySlug(generatedWorkJobs, editorial);
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
    .filter(({ data }) => data.status === 'published' && data.approvalStatus === 'approved')
    .map(fromEditorialCourseEntry);
  cachedPublishedWorkCourses = mergeBySlug(generatedWorkCourses, editorial).filter(
    isPublishableWorkCourse,
  );
  return cachedPublishedWorkCourses;
}

/** Full editorial inventory for the research catalogue. Drafts remain visibly labelled. */
export async function getCourseDirectory() {
  if (cachedCourseDirectory) return cachedCourseDirectory;
  const editorial = (await getCollection('courses'))
    .filter(({ data }) => data.catalogueNumber !== undefined)
    .map(fromEditorialCourseEntry);
  cachedCourseDirectory = mergeBySlug(generatedWorkCourses, editorial).sort((a, b) =>
    a.title.localeCompare(b.title),
  );
  return cachedCourseDirectory;
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
    country: job.country ?? '',
    publishedAt: job.publishedAt ?? '',
    deadline: job.deadline ?? '',
    employmentType: job.employmentType,
    arrangement: job.arrangement,
    status: getWorkJobStatus(job),
    description: job.description,
    category: job.category,
    salaryText: job.salaryText ?? '',
    salaryCurrency: job.salaryCurrency ?? '',
    salaryPeriod: job.salaryPeriod ?? '',
    sourceAttribution: job.sourceAttribution ?? '',
    sourceUrl: isSafeHttpsUrl(job.sourceUrl) ? job.sourceUrl : '',
    applicationUrl: isSafeHttpsUrl(job.applicationUrl) ? job.applicationUrl : '',
  };
}

export function getCourseFilterOptions(courses: WorkCourse[] = workCourses) {
  const unique = (values: string[]) =>
    [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
  return {
    providers: unique(courses.map((course) => course.provider)),
    categories: unique(courses.map((course) => course.category ?? course.subject ?? '')),
    credentials: unique(courses.map((course) => course.credentialType ?? '')),
    formats: unique(courses.map((course) => course.format)),
    subjects: unique(courses.map((course) => course.subject ?? '')),
    levels: unique(courses.map((course) => course.level ?? '')),
    availability: unique(courses.map((course) => course.availabilityStatus ?? '')),
    deliveryModes: unique(courses.map((course) => course.deliveryMode ?? '')),
    coursePrices: unique(courses.map((course) => course.coursePriceStatus ?? '')),
    certificatePrices: unique(courses.map((course) => course.certificatePriceStatus ?? '')),
  };
}

function isSafeHttpsUrl(value?: string) {
  try {
    return Boolean(value && new URL(value).protocol === 'https:');
  } catch {
    return false;
  }
}

export const isSafeCourseUrl = isSafeHttpsUrl;

export function courseStatusLabel(value?: string) {
  return (value ?? 'unknown').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function toCourseJsonLd(course: WorkCourse) {
  if (
    !course.title ||
    !course.provider ||
    !course.description ||
    course.availabilityStatus !== 'available'
  )
    return undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description,
    provider: { '@type': 'Organization', name: course.provider },
    ...(course.language ? { inLanguage: course.language } : {}),
    url: absoluteUrl(`/work/courses/${course.slug}/`),
  };
}

export const cvResources = [
  {
    slug: 'cv-checklist',
    title: 'CV Checklist',
    description: 'Check your details, evidence, formatting and application instructions before you send your CV.',
    detail:
      'Start with the vacancy and check that your CV makes the relevant qualifications and experience easy to find. Confirm your name, phone number, professional email address and location. Use clear headings, consistent dates and simple formatting. Check spelling, open the final file to make sure it displays correctly, and follow the employer’s requested file type and naming instructions. Include referees only when requested or when you have their permission.',
  },
  {
    slug: 'cover-letter-guide',
    title: 'Cover Letter Guide',
    description: 'Write a concise, tailored letter that connects your evidence to the role.',
    detail:
      'Address the letter to the named contact when one is provided. In the opening, state the role and where you saw it. Choose one or two requirements from the advert and explain, with a specific example, how your experience meets them. Keep the letter focused, use a professional tone, and finish by thanking the reader and inviting them to review your application. Do not repeat your whole CV.',
  },
  {
    slug: 'interview-preparation',
    title: 'Interview Preparation',
    description: 'Prepare honest examples, role-specific questions and a confident introduction.',
    detail:
      'Review the job description and learn what the organisation does. Prepare a few examples that explain the situation, the action you took and the result. Use real details, including what you learned when an outcome was difficult. Practise a short introduction, plan questions about the role, and check the interview time, location or joining link in advance.',
  },
];

export const internships: Array<{
  slug: string;
  title: string;
  employer: string;
  location: string;
  deadline?: string;
  arrangement: string;
  description: string;
}> = [];

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
