import {
  GENRE_LABEL_MAP,
  VJ_LABEL_MAP,
  type BloggerPageItem,
  type MovieItem,
  type MoviePart,
  type PlayerType,
} from '../types/movie.ts';

export interface RawBloggerEntry {
  id?: { $t?: string };
  published?: { $t?: string };
  updated?: { $t?: string };
  title?: { $t?: string };
  content?: { $t?: string };
  summary?: { $t?: string };
  category?: Array<{ term?: string }>;
  link?: Array<{ rel?: string; type?: string; href?: string; title?: string }>;
  media$thumbnail?: { url?: string };
}

const ENTITY_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&#039;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
  '&#8212;': '—',
  '&#8211;': '–',
  '&#8226;': '•',
  '&mdash;': '—',
  '&ndash;': '–',
  '&bull;': '•',
};

export function decodeHtmlEntities(input: string): string {
  if (!input) return '';
  return input
    .replace(/&(?:amp|lt|gt|quot|apos|nbsp|mdash|ndash|bull|#0?39|#8211|#8212|#8226);/gi, (m) => {
      return ENTITY_MAP[m.toLowerCase()] ?? m;
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = Number(dec);
      return Number.isFinite(code) && code > 0 && code < 0x10ffff ? String.fromCodePoint(code) : '';
    });
}

export function stripHtmlTags(html: string): string {
  if (!html) return '';
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function isSafeHttpUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function upgradeBloggerImageUrl(url: string, sizeParam = 'w600-h900-c'): string {
  if (!url || !isSafeHttpUrl(url)) return '';
  return url
    .replace(/\/s\d+(-c)?\//, `/${sizeParam}/`)
    .replace(/\/w\d+-h\d+(-c)?\//, `/${sizeParam}/`);
}

export function extractYouTubeId(url: string): string {
  const match = url.match(/(?:v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&?#/]+)/i);
  return match?.[1] ?? '';
}

export function classifyVideoUrl(rawUrl: string): {
  videoUrl: string;
  playerType: PlayerType;
  youtubeId?: string;
} {
  const extractedUrl = decodeHtmlEntities(rawUrl.trim());
  if (!extractedUrl || !isSafeHttpUrl(extractedUrl)) {
    return { videoUrl: '', playerType: 'none' };
  }

  const isDirectVideo = /\.(mp4|webm|ogg|mkv|mov|m4v)(\?.*)?$/i.test(extractedUrl);
  if (isDirectVideo) {
    return { videoUrl: extractedUrl, playerType: 'video' };
  }

  const lower = extractedUrl.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    const youtubeId = extractYouTubeId(extractedUrl);
    if (youtubeId) {
      return { videoUrl: extractedUrl, playerType: 'youtube', youtubeId };
    }
  }

  return { videoUrl: extractedUrl, playerType: 'iframe' };
}

export function detectPlayerSource(rawHtml: string): {
  videoUrl: string;
  playerType: PlayerType;
  youtubeId?: string;
} {
  const ddrMatch = rawHtml.match(/\[\/ddr45\/\]([\s\S]*?)\[\/ddr45\/\]/i);
  if (ddrMatch?.[1]) {
    const res = classifyVideoUrl(ddrMatch[1]);
    if (res.playerType !== 'none') return res;
  }

  const iframeMatch = rawHtml.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (iframeMatch?.[1]) {
    const res = classifyVideoUrl(iframeMatch[1]);
    if (res.playerType !== 'none') return res;
  }

  const videoMatch = rawHtml.match(/<(?:video|source)[^>]+src=["']([^"']+)["']/i);
  if (videoMatch?.[1]) {
    const res = classifyVideoUrl(videoMatch[1]);
    if (res.playerType !== 'none') return res;
  }

  return { videoUrl: '', playerType: 'none' };
}

function cleanPartHeading(rawHeading: string): string {
  let cleaned = stripHtmlTags(rawHeading);
  // Remove trailing emojis/clapperboard and "Kali Mu: VJ ..." boilerplate
  cleaned = cleaned
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
    .replace(/kali\s*mu\s*:?/gi, '')
    .replace(/\bVJ\s+[A-Za-z]+(?:\s+[A-Za-z]+)?/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/^[-–:|\s]+|[-–:|\s]+$/g, '')
    .trim();
  return cleaned;
}

function inferPartLabel(
  precedingHeading: string,
  videoUrl: string,
  index: number,
  isSeriesContext: boolean
): string {
  const heading = cleanPartHeading(precedingHeading);
  if (heading) {
    const epMatch = heading.match(/\b(?:episode|ep\.?)\s*(\d+)\b/i);
    if (epMatch) {
      return `Episode ${Number(epMatch[1])}`;
    }
    const partMatch = heading.match(/\bpart\s*(\d+)\b/i);
    if (partMatch) {
      return `Part ${Number(partMatch[1])}`;
    }
    if (heading.length >= 2 && heading.length <= 45) {
      return heading;
    }
  }

  // Check URL filename hints like S01E02, part_2, ep03
  const epUrlMatch = videoUrl.match(/S\d+E(\d+)|(?:episode|ep)[_-]?(\d+)/i);
  if (epUrlMatch) {
    const num = Number(epUrlMatch[1] || epUrlMatch[2]);
    if (Number.isFinite(num) && num > 0) {
      return `Episode ${num}`;
    }
  }

  const partUrlMatch = videoUrl.match(/part[_-]?(\d+)/i);
  if (partUrlMatch) {
    const num = Number(partUrlMatch[1]);
    if (Number.isFinite(num) && num > 0) {
      return `Part ${num}`;
    }
  }

  return isSeriesContext ? `Episode ${index}` : `Part ${index}`;
}

export function extractMovieParts(
  rawHtml: string,
  fallbackPoster: string,
  isSeries: boolean
): MoviePart[] {
  const parts: MoviePart[] = [];
  const seenUrls = new Set<string>();

  const imgRegex = /<img\b[^>]*>/gi;
  const imgMatches = [...rawHtml.matchAll(imgRegex)];

  const hasSeriesHint =
    isSeries ||
    /episode\s*\d+|S\d+E\d+|nmj-series/i.test(rawHtml);

  let prevCursor = 0;

  for (const match of imgMatches) {
    const imgTag = match[0];
    const matchIndex = match.index ?? 0;
    const chunkBetween = rawHtml.slice(prevCursor, matchIndex);
    prevCursor = matchIndex + imgTag.length;

    const titleAttr = imgTag.match(/\btitle\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    const titleVal = decodeHtmlEntities(titleAttr?.[1] ?? titleAttr?.[2] ?? '');
    const ddrMatch = titleVal.match(/\[\/ddr45\/\]([\s\S]*?)\[\/ddr45\/\]/i);
    if (!ddrMatch?.[1]) continue;

    const classified = classifyVideoUrl(ddrMatch[1]);
    if (classified.playerType === 'none' || !classified.videoUrl) continue;
    if (seenUrls.has(classified.videoUrl)) continue;
    seenUrls.add(classified.videoUrl);

    const srcAttr = imgTag.match(/\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    const rawSrc = srcAttr?.[1] ?? srcAttr?.[2] ?? '';
    const partPoster = isSafeHttpUrl(rawSrc) ? decodeHtmlEntities(rawSrc) : fallbackPoster;

    // Look for last h2/h3/h4 heading immediately before this image
    const headingMatches = [...chunkBetween.matchAll(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/gi)];
    const lastHeading = headingMatches.length > 0 ? headingMatches[headingMatches.length - 1][1] : '';

    const partNumber = parts.length + 1;
    parts.push({
      index: partNumber,
      label: inferPartLabel(lastHeading, classified.videoUrl, partNumber, hasSeriesHint),
      poster: partPoster,
      videoUrl: classified.videoUrl,
      playerType: classified.playerType,
      youtubeId: classified.youtubeId,
    });
  }

  // Also scan any standalone [/ddr45/] tags outside <img> attributes
  const allDdrMatches = [...rawHtml.matchAll(/\[\/ddr45\/\]([\s\S]*?)\[\/ddr45\/\]/gi)];
  for (const m of allDdrMatches) {
    const classified = classifyVideoUrl(m[1] || '');
    if (classified.playerType === 'none' || !classified.videoUrl) continue;
    if (seenUrls.has(classified.videoUrl)) continue;
    seenUrls.add(classified.videoUrl);
    const partNumber = parts.length + 1;
    parts.push({
      index: partNumber,
      label: inferPartLabel('', classified.videoUrl, partNumber, hasSeriesHint),
      poster: fallbackPoster,
      videoUrl: classified.videoUrl,
      playerType: classified.playerType,
      youtubeId: classified.youtubeId,
    });
  }

  // Fallback for iframe/video tags when no [/ddr45/] tag exists
  if (parts.length === 0) {
    const fallback = detectPlayerSource(rawHtml);
    if (fallback.playerType !== 'none' && fallback.videoUrl) {
      parts.push({
        index: 1,
        label: hasSeriesHint ? 'Episode 1' : 'Full Movie',
        poster: fallbackPoster,
        videoUrl: fallback.videoUrl,
        playerType: fallback.playerType,
        youtubeId: fallback.youtubeId,
      });
    }
  }

  return parts;
}

export function extractPathname(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname.startsWith('/') ? u.pathname : `/${u.pathname}`;
  } catch {
    return '/';
  }
}

export function cleanDisplayTitle(rawTitle: string): string {
  let clean = decodeHtmlEntities(rawTitle).trim();
  clean = clean.replace(/\|\s*vj\.ssegu\.com/gi, '').trim();
  clean = clean.replace(/^Kali\s*Mu:\s*/i, '').trim();
  return clean || rawTitle.trim();
}

export function inferVjInfo(categories: string[], title: string): { vj: string; vjSlug: string } {
  for (const cat of categories) {
    const slug = cat.toLowerCase();
    if (VJ_LABEL_MAP[slug]) {
      return { vj: VJ_LABEL_MAP[slug], vjSlug: slug };
    }
  }
  for (const cat of categories) {
    const slug = cat.toLowerCase();
    const vjMatch = slug.match(/(vj-[a-z0-9-]+)/);
    if (vjMatch) {
      const matchedSlug = vjMatch[1];
      if (VJ_LABEL_MAP[matchedSlug]) {
        return { vj: VJ_LABEL_MAP[matchedSlug], vjSlug: matchedSlug };
      }
      const pretty = matchedSlug
        .split('-')
        .map((part, idx) => (idx === 0 ? 'VJ' : part.charAt(0).toUpperCase() + part.slice(1)))
        .join(' ');
      return { vj: pretty, vjSlug: matchedSlug };
    }
  }
  const titleMatch = title.match(/VJ\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
  if (titleMatch) {
    const label = `VJ ${titleMatch[1].trim()}`;
    const slug = label.toLowerCase().replace(/\s+/g, '-');
    return { vj: label, vjSlug: slug };
  }
  return { vj: 'Ssegu VJ', vjSlug: 'ssegu-vj' };
}

export function inferGenres(categories: string[]): string[] {
  const genres = new Set<string>();
  for (const cat of categories) {
    const lower = cat.toLowerCase();
    if (GENRE_LABEL_MAP[lower]) {
      genres.add(GENRE_LABEL_MAP[lower]);
      continue;
    }
    for (const [key, label] of Object.entries(GENRE_LABEL_MAP)) {
      if (lower.startsWith(`${key}-`) || lower.includes(`-${key}`)) {
        genres.add(label);
      }
    }
  }
  if (genres.size === 0) {
    genres.add('Movies');
  }
  return Array.from(genres);
}

export function parseBloggerPost(entry: RawBloggerEntry): MovieItem | null {
  const rawTitle = decodeHtmlEntities(entry.title?.$t || '').trim();
  if (!rawTitle) return null;

  const altLink = (entry.link || []).find((l) => l.rel === 'alternate')?.href || '';
  if (!altLink) return null;

  const path = extractPathname(altLink);
  const rawHtml = entry.content?.$t || entry.summary?.$t || '';

  const imgSrcMatch = rawHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
  const imgAltMatch = rawHtml.match(/<img[^>]+alt=["']([^"']*)["']/i);
  const rawImg = imgSrcMatch?.[1] ? decodeHtmlEntities(imgSrcMatch[1]) : '';
  const thumbUrl = entry.media$thumbnail?.url ? decodeHtmlEntities(entry.media$thumbnail.url) : '';

  const posterCandidate = rawImg || upgradeBloggerImageUrl(thumbUrl, 's1600');
  const poster = isSafeHttpUrl(posterCandidate) ? posterCandidate : '';
  const backdrop = poster
    ? upgradeBloggerImageUrl(poster, 'w1200-h675-c') || poster
    : '';

  const categories = (entry.category || [])
    .map((c) => (c.term || '').trim())
    .filter(Boolean);

  const pMatches = [...rawHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => stripHtmlTags(m[1]))
    .filter((t) => t.length > 10);

  const altSummary = imgAltMatch?.[1] ? decodeHtmlEntities(imgAltMatch[1]).trim() : '';
  const synopsis = pMatches.join('\n\n') || altSummary || rawTitle;

  const isSeries = categories.some((c) => c.toLowerCase().includes('series'));
  const parts = extractMovieParts(rawHtml, poster, isSeries);
  const primary = parts[0] || {
    index: 1,
    label: 'Full Movie',
    poster,
    ...detectPlayerSource(rawHtml),
  };

  const { vj, vjSlug } = inferVjInfo(categories, rawTitle);
  const genres = inferGenres(categories);

  const rawId = entry.id?.$t || path;
  const postIdMatch = rawId.match(/post-(\d+)/);
  const id = postIdMatch ? postIdMatch[1] : path;

  return {
    id,
    title: rawTitle,
    displayTitle: cleanDisplayTitle(rawTitle),
    path,
    originalUrl: altLink,
    published: entry.published?.$t || new Date().toISOString(),
    updated: entry.updated?.$t || entry.published?.$t || new Date().toISOString(),
    poster,
    backdrop,
    categories,
    genres,
    vj,
    vjSlug,
    synopsis,
    altSummary,
    videoUrl: primary.videoUrl,
    playerType: primary.playerType,
    youtubeId: primary.youtubeId,
    parts,
  };
}

export function parseBloggerPage(entry: RawBloggerEntry): BloggerPageItem | null {
  const title = decodeHtmlEntities(entry.title?.$t || '').trim();
  const altLink = (entry.link || []).find((l) => l.rel === 'alternate')?.href || '';
  if (!title || !altLink) return null;

  const path = extractPathname(altLink);
  const rawHtml = entry.content?.$t || '';

  const headings = [...rawHtml.matchAll(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi)]
    .map((m) => stripHtmlTags(m[1]))
    .filter(Boolean);

  const paragraphs = [...rawHtml.matchAll(/<(?:p|li)[^>]*>([\s\S]*?)<\/(?:p|li)>/gi)]
    .map((m) => stripHtmlTags(m[1]))
    .filter((t) => t.length > 2);

  if (paragraphs.length === 0) {
    const plain = stripHtmlTags(rawHtml);
    if (plain) {
      paragraphs.push(...plain.split('\n').filter((line) => line.trim().length > 0));
    }
  }

  const emails = Array.from(
    new Set(stripHtmlTags(rawHtml).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [])
  );

  const rawId = entry.id?.$t || path;
  const pageIdMatch = rawId.match(/page-(\d+)/);

  return {
    id: pageIdMatch ? pageIdMatch[1] : path,
    title,
    path,
    originalUrl: altLink,
    published: entry.published?.$t || '',
    updated: entry.updated?.$t || '',
    paragraphs,
    headings,
    emails,
  };
}
