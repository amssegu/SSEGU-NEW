import { defineCollection, reference } from 'astro:content';
import { z } from 'astro/zod';

const slug = z
  .string()
  .trim()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a lowercase URL-safe slug.');
const date = z.coerce.date();
const status = z.enum(['draft', 'published', 'expired']);
const imageFields = {
  image: z.string().trim().min(1).optional(),
  imageFallback: z.url().optional(),
  imageAlt: z.string().trim().min(1).optional(),
  imageCaption: z.string().trim().min(1).optional(),
  imageCredit: z.string().trim().min(1).optional(),
};
const seoFields = {
  seoTitle: z.string().trim().min(1).max(70).optional(),
  metaDescription: z.string().trim().min(1).max(160).optional(),
  canonicalUrl: z.url().optional(),
};

const articleFields = {
  title: z.string().trim().min(1),
  slug,
  excerpt: z.string().trim().min(1).max(300),
  author: reference('authors'),
  categories: z.array(reference('categories')).min(1),
  tags: z.array(z.string().trim().min(1)).default([]),
  publishedAt: date,
  updatedAt: date.optional(),
  status,
  featured: z.boolean().default(false),
  ...imageFields,
  ...seoFields,
};

const workArticleFields = {
  title: z.string().trim().min(1),
  slug,
  excerpt: z.string().trim().min(1).max(300),
  author: reference('authors'),
  categories: z.array(reference('work-categories')).min(1),
  tags: z.array(z.string().trim().min(1)).default([]),
  publishedAt: date,
  updatedAt: date.optional(),
  status,
  featured: z.boolean().default(false),
  ...imageFields,
  ...seoFields,
};

const opportunityFields = {
  title: z.string().trim().min(1),
  slug,
  employer: reference('employers'),
  location: z.string().trim().min(1),
  arrangement: z.enum(['on-site', 'hybrid', 'remote']),
  employmentType: z.enum([
    'full-time',
    'part-time',
    'contract',
    'temporary',
    'internship',
    'volunteer',
  ]),
  salary: z.string().trim().min(1).optional(),
  requirements: z.array(z.string().trim().min(1)).default([]),
  qualifications: z.array(z.string().trim().min(1)).default([]),
  applicationMethod: z.enum(['external-url', 'email', 'instructions']),
  applicationUrl: z.url().optional(),
  applicationEmail: z.email().optional(),
  applicationInstructions: z.string().trim().min(1).optional(),
  deadline: date.optional(),
  sourceUrl: z.url(),
  verificationNote: z.string().trim().min(1),
  publishedAt: date,
  status,
  featured: z.boolean().default(false),
  ...seoFields,
};

const internshipFields = {
  ...opportunityFields,
  eligibility: z.array(z.string().trim().min(1)).default([]),
};

const withImageRule = (schema: any) =>
  schema.superRefine((value: Record<string, any>, context: any) => {
    if (value.image && !value.imageAlt) {
      context.addIssue({
        code: 'custom',
        path: ['imageAlt'],
        message: 'imageAlt is required when image is supplied',
      });
    }
  });

const withApplicationRule = (fields: Record<string, any>) =>
  z.object(fields).superRefine((value: Record<string, any>, context) => {
    const supplied =
      value.applicationMethod === 'external-url'
        ? value.applicationUrl
        : value.applicationMethod === 'email'
          ? value.applicationEmail
          : value.applicationInstructions;
    if (!supplied) {
      context.addIssue({
        code: 'custom',
        path: ['applicationMethod'],
        message: `application${value.applicationMethod === 'external-url' ? 'Url' : value.applicationMethod === 'email' ? 'Email' : 'Instructions'} is required for this method`,
      });
    }
  });

export const collections = {
  articles: defineCollection({
    type: 'content',
    schema: withImageRule(z.object(articleFields)),
  }),
  categories: defineCollection({
    type: 'data',
    schema: z.object({
      name: z.string().trim().min(1),
      slug,
      description: z.string().trim().min(1),
      image: z.string().trim().min(1).optional(),
      navigationVisible: z.boolean().default(true),
      displayOrder: z.number().int().nonnegative().default(0),
    }),
  }),
  'work-categories': defineCollection({
    type: 'data',
    schema: z.object({
      name: z.string().trim().min(1),
      slug,
      description: z.string().trim().min(1),
      navigationVisible: z.boolean().default(true),
      displayOrder: z.number().int().nonnegative().default(0),
    }),
  }),
  authors: defineCollection({
    type: 'data',
    schema: z.object({
      name: z.string().trim().min(1),
      slug,
      biography: z.string().trim().min(1),
      portrait: z.string().trim().min(1).optional(),
      website: z.url().optional(),
      twitter: z.url().optional(),
      linkedin: z.url().optional(),
    }),
  }),
  pages: defineCollection({
    type: 'content',
    schema: z.object({
      title: z.string().trim().min(1),
      slug,
      description: z.string().trim().min(1),
      status,
      ...seoFields,
    }),
  }),
  jobs: defineCollection({
    type: 'content',
    schema: withApplicationRule(opportunityFields),
  }),
  internships: defineCollection({
    type: 'content',
    schema: withApplicationRule(internshipFields),
  }),
  'work-articles': defineCollection({
    type: 'content',
    schema: withImageRule(z.object(workArticleFields)),
  }),
  courses: defineCollection({
    type: 'content',
    schema: z.object({
      title: z.string().trim().min(1),
      slug,
      catalogueNumber: z.number().int().min(1).max(50).optional(),
      provider: z.string().trim().min(1),
      platform: z.string().trim().min(1).optional(),
      category: z.string().trim().min(1).optional(),
      description: z.string().trim().min(1),
      deliveryMode: z.enum(['in-person', 'online', 'hybrid', 'self-paced']),
      subject: z.string().trim().min(1).optional(),
      level: z.string().trim().min(1).optional(),
      language: z.string().trim().min(1).optional(),
      duration: z.string().trim().min(1).optional(),
      eligibility: z.array(z.string().trim().min(1)).default([]),
      skills: z.array(z.string().trim().min(1)).default([]),
      tools: z.array(z.string().trim().min(1)).default([]),
      careerRoles: z.array(z.string().trim().min(1)).default([]),
      prerequisites: z.array(z.string().trim().min(1)).default([]),
      equipment: z.array(z.string().trim().min(1)).default([]),
      curriculum: z.array(z.string().trim().min(1)).default([]),
      learningOutcomes: z.array(z.string().trim().min(1)).default([]),
      practicalSkills: z.array(z.string().trim().min(1)).default([]),
      transferableSkills: z.array(z.string().trim().min(1)).default([]),
      industries: z.array(z.string().trim().min(1)).default([]),
      freelanceApplications: z.array(z.string().trim().min(1)).default([]),
      regions: z.array(z.string().trim().min(1)).default(['Uganda', 'International']),
      approvalStatus: z.enum(['pending', 'approved']).default('pending'),
      researchStatus: z.enum(['research-required', 'in-research', 'review-required', 'verified', 'published', 'needs-recheck', 'archived']).default('research-required'),
      credentialType: z.string().trim().min(1).optional(),
      freeAccess: z.string().trim().min(1).optional(),
      paidAccess: z.string().trim().min(1).optional(),
      paidPrice: z.string().trim().min(1).optional(),
      billingModel: z.string().trim().min(1).optional(),
      freePaidRecommendation: z.enum(['free-sufficient', 'consider-paying', 'optional', 'not-recommended-yet']).optional(),
      freePaidRationale: z.string().trim().min(1).optional(),
      ugandaNotes: z.string().trim().min(1).optional(),
      portfolioProjects: z.array(z.string().trim().min(1)).default([]),
      nextSteps: z.array(z.string().trim().min(1)).default([]),
      relatedCourses: z.array(z.string().trim().min(1)).default([]),
      sources: z.array(z.object({ label: z.string().trim().min(1), url: z.url(), checkedAt: date.optional(), evidence: z.enum(['verified', 'supported', 'editorial-assessment', 'not-verified']).default('not-verified') })).default([]),
      jobEvidence: z.array(z.object({ title: z.string().trim().min(1), employer: z.string().trim().min(1), location: z.string().trim().min(1), url: z.url(), checkedAt: date, requestedSkills: z.array(z.string().trim().min(1)).default([]), requirements: z.array(z.string().trim().min(1)).default([]), courseCoverage: z.string().trim().min(1), remainingGaps: z.array(z.string().trim().min(1)).default([]) })).default([]),
      editorialAssessment: z.string().trim().min(1).optional(),
      cost: z.string().trim().min(1).optional(),
      coursePriceStatus: z.string().trim().min(1).optional(),
      certificatePriceStatus: z.string().trim().min(1).optional(),
      termsUrl: z.url().optional(),
      sourceAttribution: z.string().trim().min(1).optional(),
      lastCheckedAt: date.optional(),
      enrolmentUrl: z.url().optional(),
      applicationDeadline: date.optional(),
      sourceUrl: z.url(),
      publishedAt: date,
      updatedAt: date.optional(),
      status,
      ...seoFields,
    }),
  }),
  'course-categories': defineCollection({
    type: 'data',
    schema: z.object({ name: z.string().trim().min(1), slug, description: z.string().trim().min(1), displayOrder: z.number().int().nonnegative().default(0) }),
  }),
  pathways: defineCollection({
    type: 'content',
    schema: z.object({
      title: z.string().trim().min(1), slug, description: z.string().trim().min(1),
      intendedLearner: z.string().trim().min(1), roles: z.array(z.string().trim().min(1)).default([]),
      foundations: z.array(z.string().trim().min(1)).default([]), skills: z.array(z.string().trim().min(1)).default([]),
      stages: z.array(z.object({ title: z.string().trim().min(1), description: z.string().trim().min(1), courses: z.array(z.string().trim().min(1)).default([]), project: z.string().trim().optional() })).default([]),
      freeFirst: z.array(z.string().trim().min(1)).default([]), paidCredentials: z.array(z.string().trim().min(1)).default([]),
      furtherSpecialisation: z.array(z.string().trim().min(1)).default([]), regionalContext: z.string().trim().min(1),
      sources: z.array(z.object({ label: z.string().trim().min(1), url: z.url(), checkedAt: date.optional(), evidence: z.enum(['verified', 'supported', 'editorial-assessment', 'not-verified']).default('not-verified') })).default([]),
      lastVerified: date.optional(), status,
    }),
  }),
  employers: defineCollection({
    type: 'data',
    schema: z.object({
      name: z.string().trim().min(1),
      slug,
      logo: z.string().trim().min(1).optional(),
      website: z.url().optional(),
      description: z.string().trim().min(1),
      location: z.string().trim().min(1),
      verificationNote: z.string().trim().min(1),
      status: z.enum(['draft', 'verified']).default('draft'),
    }),
  }),
  navigation: defineCollection({
    type: 'data',
    schema: z.object({
      section: z.enum(['news', 'work']),
      items: z
        .array(
          z.object({
            label: z.string().trim().min(1),
            href: z.string().regex(/^\//, 'Navigation hrefs must be site-relative.'),
            order: z.number().int().nonnegative(),
            visible: z.boolean().default(true),
          }),
        )
        .min(1),
    }),
  }),
  'site-settings': defineCollection({
    type: 'data',
    schema: z.object({
      siteName: z.string().trim().min(1),
      tagline: z.string().trim().min(1),
      defaultDescription: z.string().trim().min(1),
      defaultImage: z.string().trim().min(1).optional(),
      contactEmail: z.email(),
    }),
  }),
  redirects: defineCollection({
    type: 'data',
    schema: z.object({
      oldUrl: z.string().regex(/^\//, 'oldUrl must be site-relative.'),
      newUrl: z.string().regex(/^\//, 'newUrl must be site-relative.'),
      redirectType: z.enum(['301', '302', '410']),
      verified: z.boolean(),
    }),
  }),
};
