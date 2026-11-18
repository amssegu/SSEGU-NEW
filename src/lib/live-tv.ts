export interface LiveTvChannel {
  id: string;
  name: string;
  category: string;
  color: string;
  stream: string;
}

export const liveTvChannels: LiveTvChannel[] = [
  {
    id: 'citizentv',
    name: 'Citizen TV',
    category: 'News',
    color: '#e11d48',
    stream: 'https://live-onesignal.royalmedia.co.ke/live/jgB35emfPsiW5aFjKJjbjg.m3u8',
  },
  {
    id: 'salttv',
    name: 'Salt TV',
    category: 'Entertainment',
    color: '#f59e0b',
    stream: 'https://live.salttelevision.com/hls/3/stream.m3u8',
  },
  {
    id: 'sparktv',
    name: 'Spark TV',
    category: 'Entertainment',
    color: '#8b5cf6',
    stream: 'https://ams-2629.antmedia.cloud/LiveApp/streams/spark2026.m3u8',
  },
  {
    id: 'bukedde1',
    name: 'Bukedde 1 TV',
    category: 'News',
    color: '#22c55e',
    stream: 'https://stream.hydeinnovations.com/bukedde1flussonic/tracks-v1a1/index.m3u8',
  },
  {
    id: 'ntv',
    name: 'NTV Uganda',
    category: 'News',
    color: '#3b82f6',
    stream: 'https://ams-2629.antmedia.cloud/LiveApp/streams/abul2026.m3u8',
  },
  {
    id: 'galaxytv',
    name: 'Galaxy TV',
    category: 'Entertainment',
    color: '#ec4899',
    stream: 'https://livestream.galaxytv.ug/jikonkone/playlist.m3u8',
  },
  {
    id: 'bukedde2',
    name: 'Bukedde 2 TV',
    category: 'Entertainment',
    color: '#14b8a6',
    stream: 'https://stream.hydeinnovations.com/bukedde2flussonic/tracks-v1a1/mono.m3u8',
  },
  {
    id: 'sabcnews',
    name: 'SABC News',
    category: 'News',
    color: '#ef4444',
    stream: 'https://sabconetanw.cdn.mangomolo.com/news/smil:news.stream.smil/master.m3u8',
  },
  {
    id: 'capetowntv',
    name: 'Cape Town TV',
    category: 'Community',
    color: '#f97316',
    stream: 'https://cdn.freevisiontv.co.za/sttv/smil:ctv.stream.smil/playlist.m3u8',
  },
  {
    id: 'tshwanetv',
    name: 'Tshwane TV',
    category: 'Community',
    color: '#a855f7',
    stream: 'https://cdn.freevisiontv.co.za/sttv/smil:tshwane.stream.smil/playlist.m3u8',
  },
  {
    id: 'sowetotv',
    name: 'Soweto TV',
    category: 'Community',
    color: '#06b6d4',
    stream: 'https://cdn.freevisiontv.co.za/sttv/smil:soweto.stream.smil/playlist.m3u8',
  },
  {
    id: 'nrgradio',
    name: 'NRG Radio UG',
    category: 'Entertainment',
    color: '#84cc16',
    stream: 'https://live2.tensila.com/nrg-radio-v-1.nrgug/hls/live/mystream.m3u8',
  },
  {
    id: 'babatv',
    name: 'Baba TV',
    category: 'Entertainment',
    color: '#f43f5e',
    stream: 'https://babatv.co.ug/live/ch04/index.m3u8',
  },
  {
    id: 'sudantv',
    name: 'Sudan TV',
    category: 'News',
    color: '#eab308',
    stream: 'https://cdn-globecast.akamaized.net/live/eds/sudan_tv/hls_roku/index.m3u8',
  },
  {
    id: 'france24',
    name: 'France 24',
    category: 'News',
    color: '#2563eb',
    stream: 'https://a-cdn.klowdtv.com/live2/france24_720p/playlist.m3u8',
  },
  {
    id: 'fifaplus',
    name: 'FIFA+',
    category: 'Sports',
    color: '#16a34a',
    stream:
      'https://a62dad94.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/UmFrdXRlblRWLWV1X0ZJRkFQbHVzRW5nbGlzaF9ITFM/playlist.m3u8',
  },
  {
    id: 'dw',
    name: 'DW',
    category: 'News',
    color: '#0ea5e9',
    stream:
      'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/stream04/streamPlaylist.m3u8',
  },
  {
    id: 'ewtn',
    name: 'EWTN',
    category: 'Faith',
    color: '#7c3aed',
    stream: 'https://cdn3.wowza.com/1/YW5wSWZiRGd2eFlU/bGV0aVBq/hls/live/playlist.m3u8',
  },
  {
    id: 'ebstv',
    name: 'EBS TV Ethiopia',
    category: 'News',
    color: '#d946ef',
    stream: 'https://rpn.bozztv.com/ebstv/ebstv/index.m3u8',
  },
];
