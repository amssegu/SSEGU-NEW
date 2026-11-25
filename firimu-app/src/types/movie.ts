export type PlayerType = 'video' | 'youtube' | 'iframe' | 'none';

export interface MoviePart {
  index: number;
  label: string;
  poster: string;
  videoUrl: string;
  playerType: PlayerType;
  youtubeId?: string;
}

export interface MovieItem {
  id: string;
  title: string;
  displayTitle: string;
  path: string;
  originalUrl: string;
  published: string;
  updated: string;
  poster: string;
  backdrop: string;
  categories: string[];
  genres: string[];
  vj: string;
  vjSlug: string;
  synopsis: string;
  altSummary: string;
  videoUrl: string;
  playerType: PlayerType;
  youtubeId?: string;
  parts: MoviePart[];
}

export interface BloggerPageItem {
  id: string;
  title: string;
  path: string;
  originalUrl: string;
  published: string;
  updated: string;
  paragraphs: string[];
  headings: string[];
  emails: string[];
}

export interface CatalogResponse {
  movies: MovieItem[];
  total: number;
  categories: Array<{ label: string; slug: string; count: number }>;
  vjs: Array<{ label: string; slug: string; count: number }>;
  syncedAt: string;
  source: string;
}

export interface NavItem {
  label: string;
  to?: string;
  href?: string;
  external?: boolean;
  children?: Array<{ label: string; to: string }>;
}

export const SSEGU_NAVIGATION: NavItem[] = [
  { label: 'Home', to: '/' },
  {
    label: 'Movies',
    children: [
      { label: 'Action', to: '/search/label/action' },
      { label: 'Adventure', to: '/search/label/adventure' },
      { label: 'Scifi', to: '/search/label/scifi' },
      { label: 'Comedy', to: '/search/label/comedy' },
      { label: 'Crime', to: '/search/label/crime' },
      { label: 'Horror', to: '/search/label/horror' },
      { label: 'Animation And Fantasy', to: '/search/label/animation-fantasy' },
    ],
  },
  {
    label: 'VJ',
    children: [
      { label: 'Vj Junior', to: '/search/label/vj-junior' },
      { label: 'Vj Emmy', to: '/search/label/vj-emmy' },
      { label: 'Vj Mark', to: '/search/label/vj-mark' },
      { label: 'Vj KeVo', to: '/search/label/vj-kevo' },
      { label: 'Vj Jingo', to: '/search/label/vj-jingo' },
      { label: 'Vj Muba', to: '/search/label/vj-muba' },
      { label: 'Vj Ulio', to: '/search/label/vj-ulio' },
    ],
  },
  { label: 'Series', to: '/search/label/series' },
  { label: 'Live TV', href: 'https://www.ssegu.com/tv/', external: true },
  { label: 'About', to: '/p/about-us.html' },
];

export const GENRE_LABEL_MAP: Record<string, string> = {
  action: 'Action',
  adventure: 'Adventure',
  scifi: 'Sci-Fi',
  comedy: 'Comedy',
  crime: 'Crime',
  horror: 'Horror',
  'animation-fantasy': 'Animation & Fantasy',
  series: 'Series',
};

export const VJ_LABEL_MAP: Record<string, string> = {
  'vj-junior': 'VJ Junior',
  'vj-emmy': 'VJ Emmy',
  'vj-mark': 'VJ Mark',
  'vj-kevo': 'VJ KeVo',
  'vj-jingo': 'VJ Jingo',
  'vj-muba': 'VJ Muba',
  'vj-ulio': 'VJ Ulio',
  'vj-icep': 'VJ Icep',
  'vj-chris-edwards': 'VJ Chris Edwards',
  'vj-mk-kisuule': 'VJ MK Kisuule',
  'vj-shield': 'VJ Shield',
  'vj-son': 'VJ Son',
  'vj-tonny': 'VJ Tonny',
  'vj-jovan': 'VJ Jovan',
  'vj-kriss-sweet': 'VJ Kriss Sweet',
  'vj-shaolin-khan-lee': 'VJ Shaolin Khan Lee',
};
