import type { APIRoute } from 'astro';
import {
  cvResources,
  internships,
  isEligibleWorkJob,
  getPublishedWorkArticles,
  workCourses,
  workJobs,
} from '../lib/work';
import { sitemapXml } from '../lib/sitemap';

export const GET: APIRoute = async () => {
  const workArticles = await getPublishedWorkArticles();
  const paths = [
    '/work/',
    '/work/jobs/',
    '/work/internships/',
    '/work/career-advice/',
    '/work/courses/',
    '/work/cv-resources/',
    '/work/employers/',
    ...workJobs.filter((job) => isEligibleWorkJob(job)).map((job) => `/work/jobs/${job.slug}/`),
    ...internships.map((internship) => `/work/internships/${internship.slug}/`),
    ...workArticles.map((article) => `/work/career-advice/${article.slug}/`),
    ...workCourses.map((course) => `/work/courses/${course.slug}/`),
    ...cvResources.map((resource) => `/work/cv-resources/${resource.slug}/`),
  ];
  return new Response(sitemapXml(paths), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
