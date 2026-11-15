export type HttpFetchResult =
  | { kind: 'success'; status: number; body: string }
  | { kind: 'failed'; reason: string; retryable: boolean };

export interface HttpOptions {
  timeoutMs?: number;
  maxBytes?: number;
  retries?: number;
  userAgent?: string;
  fetchImpl?: typeof fetch;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function readBoundedBody(response: Response, maxBytes: number) {
  if (!response.body) {
    const body = await response.text();
    return new TextEncoder().encode(body).byteLength <= maxBytes ? body : undefined;
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let total = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      total += part.value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return undefined;
      }
      chunks.push(decoder.decode(part.value, { stream: true }));
    }
    chunks.push(decoder.decode());
    return chunks.join('');
  } finally {
    reader.releaseLock();
  }
}

export async function fetchBounded(
  url: string,
  options: HttpOptions = {},
): Promise<HttpFetchResult> {
  const timeoutMs = options.timeoutMs ?? 10_000;
  const maxBytes = options.maxBytes ?? 512_000;
  const retries = Math.max(0, Math.min(options.retries ?? 2, 3));
  const fetchImpl = options.fetchImpl ?? fetch;
  let lastReason = 'request failed';

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url, {
        headers: {
          accept: 'application/json, application/rss+xml, text/xml',
          'user-agent': options.userAgent ?? 'SSEGU-Aggregation/1.0',
        },
        signal: controller.signal,
      });
      if (!response.ok) {
        lastReason = `HTTP ${response.status}`;
        if (response.status < 500 && response.status !== 429)
          return { kind: 'failed', reason: lastReason, retryable: false };
      } else {
        const body = await readBoundedBody(response, maxBytes);
        if (body === undefined) {
          return { kind: 'failed', reason: `response exceeds ${maxBytes} bytes`, retryable: false };
        }
        return { kind: 'success', status: response.status, body };
      }
    } catch (error) {
      lastReason = error instanceof Error ? error.message : 'request failed';
    } finally {
      clearTimeout(timer);
    }
    if (attempt < retries) await sleep(100 * 2 ** attempt);
  }
  return { kind: 'failed', reason: lastReason.slice(0, 300), retryable: true };
}
