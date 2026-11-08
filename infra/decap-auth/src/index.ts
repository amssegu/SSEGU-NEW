interface Env {
  GITHUB_OAUTH_ID: string;
  GITHUB_OAUTH_SECRET: string;
  ALLOWED_ORIGINS?: string;
  GITHUB_REPO_PRIVATE?: string;
}

const STATE_COOKIE = 'ssegu_decap_oauth_state';
const STATE_TTL_SECONDS = 600;

function allowedOrigins(env: Env): string[] {
  return (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

function originFromRequest(request: Request, env: Env): string {
  const requestOrigin = request.headers.get('Origin')?.replace(/\/$/, '');
  const configuredOrigins = allowedOrigins(env);

  if (requestOrigin && configuredOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }

  return configuredOrigins[0] ?? 'https://ssegu.pages.dev';
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

async function signingKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

async function signedState(origin: string, secret: string): Promise<string> {
  const payload = bytesToBase64Url(
    new TextEncoder().encode(
      JSON.stringify({ origin, nonce: bytesToBase64Url(randomBytes(24)), expires: Date.now() + STATE_TTL_SECONDS * 1000 }),
    ),
  );
  const signature = bytesToBase64Url(
    new Uint8Array(await crypto.subtle.sign('HMAC', await signingKey(secret), new TextEncoder().encode(payload))),
  );
  return `${payload}.${signature}`;
}

async function verifyState(value: string, secret: string): Promise<{ origin: string } | null> {
  const [payload, signature] = value.split('.');
  if (!payload || !signature) return null;

  const valid = await crypto.subtle.verify(
    'HMAC',
    await signingKey(secret),
    base64UrlToBytes(signature) as unknown as BufferSource,
    new TextEncoder().encode(payload),
  );
  if (!valid) return null;

  try {
    const parsed = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload))) as {
      origin?: string;
      expires?: number;
    };
    if (!parsed.origin || !parsed.expires || parsed.expires < Date.now()) return null;
    return { origin: parsed.origin };
  } catch {
    return null;
  }
}

function cookieValue(request: Request): string | null {
  const cookieHeader = request.headers.get('Cookie') ?? '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${STATE_COOKIE}=([^;]+)`));
  return match?.[1] ?? null;
}

function redirectUri(request: Request): string {
  const url = new URL(request.url);
  return `${url.origin}/callback?provider=github`;
}

function htmlResponse(status: 'success' | 'error', value: unknown, targetOrigin: string): Response {
  const serialized = JSON.stringify(value).replace(/</g, '\\u003c');
  const message = `authorization:github:${status}:${serialized}`;
  const script = `
    <!doctype html>
    <html><head><meta charset="utf-8"><title>Authorizing SSEGU</title></head>
    <body>
      <p>Authorizing Decap CMS…</p>
      <script>
        window.opener?.postMessage('authorizing:github', ${JSON.stringify(targetOrigin)});
        window.opener?.postMessage(${JSON.stringify(message)}, ${JSON.stringify(targetOrigin)});
        window.close();
      </script>
    </body></html>`;

  return new Response(script, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
      'Cache-Control': 'no-store',
    },
  });
}

function errorResponse(message: string, status = 400): Response {
  return new Response(message, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

async function handleAuth(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (url.searchParams.get('provider') !== 'github') {
    return errorResponse('Invalid provider');
  }

  const origin = originFromRequest(request, env);
  if (!allowedOrigins(env).includes(origin)) {
    return errorResponse('Origin is not allowed', 403);
  }

  const state = await signedState(origin, env.GITHUB_OAUTH_SECRET);
  const scope = env.GITHUB_REPO_PRIVATE === '1' ? 'repo,user' : 'public_repo,user';
  const authorizationUrl = new URL('https://github.com/login/oauth/authorize');
  authorizationUrl.searchParams.set('client_id', env.GITHUB_OAUTH_ID);
  authorizationUrl.searchParams.set('redirect_uri', redirectUri(request));
  authorizationUrl.searchParams.set('scope', scope);
  authorizationUrl.searchParams.set('state', state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorizationUrl.toString(),
      'Set-Cookie': `${STATE_COOKIE}=${state}; Max-Age=${STATE_TTL_SECONDS}; HttpOnly; Secure; SameSite=Lax; Path=/`,
      'Cache-Control': 'no-store',
    },
  });
}

async function exchangeCode(request: Request, env: Env, code: string): Promise<string> {
  const body = new URLSearchParams({
    client_id: env.GITHUB_OAUTH_ID,
    client_secret: env.GITHUB_OAUTH_SECRET,
    code,
    redirect_uri: redirectUri(request),
  });
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  const result = (await response.json()) as { access_token?: string; error?: string; error_description?: string };
  if (!response.ok || !result.access_token) {
    throw new Error(result.error_description ?? result.error ?? 'GitHub token exchange failed');
  }
  return result.access_token;
}

async function handleCallback(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (url.searchParams.get('provider') !== 'github') {
    return errorResponse('Invalid provider');
  }

  const state = url.searchParams.get('state');
  const code = url.searchParams.get('code');
  const stateCookie = cookieValue(request);
  if (!state || !stateCookie || state !== stateCookie) {
    return errorResponse('Invalid OAuth state', 403);
  }

  const verifiedState = await verifyState(state, env.GITHUB_OAUTH_SECRET);
  if (!verifiedState || !allowedOrigins(env).includes(verifiedState.origin)) {
    return errorResponse('Invalid OAuth state', 403);
  }
  if (!code) {
    return htmlResponse('error', { error: url.searchParams.get('error') ?? 'GitHub authorization was cancelled' }, verifiedState.origin);
  }

  try {
    const token = await exchangeCode(request, env, code);
    return htmlResponse('success', { token }, verifiedState.origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'GitHub authorization failed';
    return htmlResponse('error', { error: message }, verifiedState.origin);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method !== 'GET' && url.pathname !== '/callback') {
      return errorResponse('Method not allowed', 405);
    }
    if (url.pathname === '/auth') return handleAuth(request, env);
    if (url.pathname === '/callback') return handleCallback(request, env);
    return new Response('SSEGU Decap OAuth proxy is running.', {
      headers: { 'Cache-Control': 'no-store' },
    });
  },
};
