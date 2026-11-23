import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import {
  cvResources,
  getCourseDirectory,
  isEligibleWorkJob,
  getPublishedWorkArticles,
  getPublishedWorkCourses,
  getPublishedWorkJobs,
  workPageCount,
} from '../lib/work';
import { sitemapXml } from '../lib/sitemap';

export const GET: APIRoute = async () => {
  const workArticles = await getPublishedWorkArticles();
  const publishedJobs = await getPublishedWorkJobs();
  const publishedCourses = await getPublishedWorkCourses();
  const courseDirectory = await getCourseDirectory();
  const courseCategories = await getCollection('course-categories');
  const publishedPathways = (await getCollection('pathways')).filter(
    ({ data }) => data.status === 'published',
  );
  const articlePages = Array.from(
    { length: workPageCount(workArticles.length) - 1 },
    (_, index) => `/work/career-advice/page/${index + 2}/`,
  );
  const coursePages = Array.from(
    { length: Math.max(0, Math.ceil(courseDirectory.length / 9) - 1) },
    (_, index) => `/work/courses/page/${index + 2}/`,
  );
  const paths = [
    '/work/',
    '/work/jobs/',
    '/work/career-advice/',
    '/work/career-pathways/',
    '/work/cv-resources/cover-letter/',
    '/work/cv-resources/interview-practice/',
    ...articlePages,
    '/work/courses/',
    '/work/courses/categories/',
    '/work/courses/free/',
    '/work/courses/how-we-evaluate/',
    ...coursePages,
    ...courseCategories.map(({ data }) => `/work/courses/category/${data.slug}/`),
    ...publishedPathways.map(({ data }) => `/work/career-pathways/${data.slug}/`),
    '/work/cv-resources/',
    '/work/employers/',
    ...publishedJobs
      .filter((job) => isEligibleWorkJob(job))
      .map((job) => `/work/jobs/${job.slug}/`),
    ...workArticles.map((article) => `/work/career-advice/${article.slug}/`),
    ...publishedCourses.map((course) => `/work/courses/${course.slug}/`),
    ...cvResources.map((resource) => `/work/cv-resources/${resource.slug}/`),
  ];
  return new Response(sitemapXml(paths), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
