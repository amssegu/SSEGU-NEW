import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { categories, getPublishedArticles, pageCount } from '../lib/articles';
import {
  cvResources,
  getCourseDirectory,
  getPublishedWorkArticles,
  getPublishedWorkCourses,
  getPublishedWorkJobs,
  isEligibleWorkJob,
  workPageCount,
} from '../lib/work';
import { sitemapXml } from '../lib/sitemap';

export const GET: APIRoute = async () => {
  const articles = await getPublishedArticles();
  const workArticles = await getPublishedWorkArticles();
  const jobs = (await getPublishedWorkJobs()).filter((job) => isEligibleWorkJob(job));
  const courses = await getPublishedWorkCourses();
  const courseDirectory = await getCourseDirectory();
  const courseCategories = await getCollection('course-categories');
  const pathways = (await getCollection('pathways')).filter(
    ({ data }) => data.status === 'published',
  );

  const newsPages = Array.from(
    { length: pageCount(articles.length) - 1 },
    (_, index) => `/news/page/${index + 2}/`,
  );
  const newsCategoryPages = [];
  for (const category of categories.filter((value) => value !== 'news')) {
    const totalPages = pageCount((await getPublishedArticles(category)).length);
    newsCategoryPages.push(
      ...Array.from(
        { length: totalPages - 1 },
        (_, index) => `/category/${category}/page/${index + 2}/`,
      ),
    );
  }
  const workArticlePages = Array.from(
    { length: workPageCount(workArticles.length) - 1 },
    (_, index) => `/work/career-advice/page/${index + 2}/`,
  );
  const coursePages = Array.from(
    { length: Math.max(0, Math.ceil(courseDirectory.length / 9) - 1) },
    (_, index) => `/work/courses/page/${index + 2}/`,
  );

  const paths = [
    '/',
    '/news/',
    ...newsPages,
    ...categories
      .filter((category) => category !== 'news')
      .map((category) => `/category/${category}/`),
    ...newsCategoryPages,
    '/about/',
    '/contact/',
    '/privacy/',
    '/terms/',
    '/sitemap/',
    ...articles.map((article) => `/${article.slug}/`),
    '/work/',
    '/work/jobs/',
    '/work/career-advice/',
    '/work/career-pathways/',
    '/work/cv-resources/cover-letter/',
    '/work/cv-resources/interview-practice/',
    ...workArticlePages,
    '/work/courses/',
    '/work/courses/categories/',
    '/work/courses/free/',
    '/work/courses/how-we-evaluate/',
    '/work/cv-resources/',
    '/work/employers/',
    ...coursePages,
    ...courseCategories.map(({ data }) => `/work/courses/category/${data.slug}/`),
    ...pathways.map(({ data }) => `/work/career-pathways/${data.slug}/`),
    ...jobs.map((job) => `/work/jobs/${job.slug}/`),
    ...workArticles.map((article) => `/work/career-advice/${article.slug}/`),
    ...courses.map((course) => `/work/courses/${course.slug}/`),
    ...cvResources.map((resource) => `/work/cv-resources/${resource.slug}/`),
  ];

  return new Response(sitemapXml([...new Set(paths)]), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
