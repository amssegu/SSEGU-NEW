interface PagesFunctionContext {
  request: Request;
}

const STREAMS = {
  citizentv: 'https://live-onesignal.royalmedia.co.ke/live/jgB35emfPsiW5aFjKJjbjg.m3u8',
  salttv: 'https://live.salttelevision.com/hls/3/stream.m3u8',
  sparktv: 'https://ams-2629.antmedia.cloud/LiveApp/streams/spark2026.m3u8',
  bukedde1: 'https://stream.hydeinnovations.com/bukedde1flussonic/tracks-v1a1/index.m3u8',
  ntv: 'https://ams-2629.antmedia.cloud/LiveApp/streams/abul2026.m3u8',
  galaxytv: 'https://livestream.galaxytv.ug/jikonkone/playlist.m3u8',
  bukedde2: 'https://stream.hydeinnovations.com/bukedde2flussonic/tracks-v1a1/mono.m3u8',
  sabcnews: 'https://sabconetanw.cdn.mangomolo.com/news/smil:news.stream.smil/master.m3u8',
  capetowntv: 'https://cdn.freevisiontv.co.za/sttv/smil:ctv.stream.smil/playlist.m3u8',
  tshwanetv: 'https://cdn.freevisiontv.co.za/sttv/smil:tshwane.stream.smil/playlist.m3u8',
  sowetotv: 'https://cdn.freevisiontv.co.za/sttv/smil:soweto.stream.smil/playlist.m3u8',
  nrgradio: 'https://live2.tensila.com/nrg-radio-v-1.nrgug/hls/live/mystream.m3u8',
  babatv: 'https://babatv.co.ug/live/ch04/index.m3u8',
  sudantv: 'https://cdn-globecast.akamaized.net/live/eds/sudan_tv/hls_roku/index.m3u8',
  france24: 'https://a-cdn.klowdtv.com/live2/france24_720p/playlist.m3u8',
  fifaplus:
    'https://a62dad94.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/UmFrdXRlblRWLWV1X0ZJRkFQbHVzRW5nbGlzaF9ITFM/playlist.m3u8',
  dw: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/stream04/streamPlaylist.m3u8',
  ewtn: 'https://cdn3.wowza.com/1/YW5wSWZiRGd2eFlU/bGV0aVBq/hls/live/playlist.m3u8',
  ebstv: 'https://rpn.bozztv.com/ebstv/ebstv/index.m3u8',
  eternallife: 'https://live-tv.mfc-streaming-service.online/hls/orion_west.m3u8',
  ramogitv: 'https://live-onesignal.royalmedia.co.ke/live/-gEXRHc6nSl5aFegh5MrOg.m3u8',
  rtnews: 'https://rt-glb.rttv.com/dvr/rtnews/playlist.m3u8',
  kbstv: 'https://www.kbstv.co.ug/live/abr/master.m3u8',
  lbfdrtv: 'https://tnt-television.com/LBFD_RTV/index.m3u8',
  cgtn: 'https://english-livebkali.cgtn.com/live/encgtn.m3u8',
  ebscinema: 'https://rpn.bozztv.com/ebstv/ebscinema/index.m3u8',
  gcmxtv: 'https://viewmedia7219.bozztv.com/wmedia/viewmedia100/web_018/Stream/playlist.m3u8',
} as const;

type StreamId = keyof typeof STREAMS;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Range',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range',
};

function responseHeaders(source?: Headers) {
  const headers = new Headers(source);
  Object.entries(CORS_HEADERS).forEach(([key, value]) => headers.set(key, value));
  headers.set('Cache-Control', 'no-store');
  return headers;
}

function errorResponse(message: string, status: number) {
  return new Response(message, {
    status,
    headers: {
      ...CORS_HEADERS,
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

function proxiedUrl(request: Request, channel: StreamId, target: URL) {
  const url = new URL('/api/tv-stream', request.url);
  url.searchParams.set('channel', channel);
  url.searchParams.set('url', target.toString());
  return url.toString();
}

function rewritePlaylist(request: Request, channel: StreamId, playlist: string, baseUrl: URL) {
  const allowedOrigin = new URL(STREAMS[channel]).origin;
  const rewrite = (value: string) => {
    try {
      const target = new URL(value, baseUrl);
      if (target.origin !== allowedOrigin) return value;
      return proxiedUrl(request, channel, target);
    } catch {
      return value;
    }
  };

  return playlist
    .split(/\r?\n/)
    .map((line) => {
      if (!line.trim() || line.trim().startsWith('#')) {
        return line.replace(/URI="([^"]+)"/g, (_match, uri: string) => `URI="${rewrite(uri)}"`);
      }
      return rewrite(line.trim());
    })
    .join('\n');
}

export async function onRequest(context: PagesFunctionContext) {
  const { request } = context;
  const requestUrl = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return errorResponse('Only GET requests are accepted.', 405);
  }

  const channel = requestUrl.searchParams.get('channel') as StreamId | null;
  if (!channel || !(channel in STREAMS)) return errorResponse('Unknown channel.', 404);

  const configuredUrl = new URL(STREAMS[channel]);
  const requestedUrl = requestUrl.searchParams.get('url');
  let targetUrl = configuredUrl;
  if (requestedUrl) {
    try {
      targetUrl = new URL(requestedUrl);
    } catch {
      return errorResponse('Invalid stream URL.', 400);
    }
    if (targetUrl.protocol !== 'https:' || targetUrl.origin !== configuredUrl.origin) {
      return errorResponse('Stream URL is not allowed.', 403);
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const upstreamHeaders = new Headers({
      Accept: 'application/vnd.apple.mpegurl, video/mp2t, video/*, */*',
    });
    const range = request.headers.get('Range');
    if (range) upstreamHeaders.set('Range', range);

    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers: upstreamHeaders,
      redirect: 'follow',
      signal: controller.signal,
    });
    const headers = responseHeaders(upstream.headers);
    const contentType = upstream.headers.get('Content-Type') ?? '';
    const isPlaylist =
      contentType.includes('mpegurl') || targetUrl.pathname.toLowerCase().endsWith('.m3u8');

    if (!isPlaylist || request.method === 'HEAD') {
      return new Response(upstream.body, { status: upstream.status, headers });
    }

    const playlist = await upstream.text();
    headers.set('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
    headers.delete('Content-Length');
    return new Response(rewritePlaylist(request, channel, playlist, targetUrl), {
      status: upstream.status,
      headers,
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'AbortError';
    return errorResponse(
      timedOut ? 'Stream provider timed out.' : 'Stream provider unavailable.',
      504,
    );
  } finally {
    clearTimeout(timeout);
  }
}
