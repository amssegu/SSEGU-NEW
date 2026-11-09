import assert from 'node:assert/strict';
import {
  onRequest,
  parseSubmissionPayload,
  validateSubmission,
} from '../functions/api/job-submissions.ts';

const originalFetch = globalThis.fetch;

function validPayload(overrides = {}) {
  return {
    organisation: 'Phase 9 Test Organisation',
    contactName: 'Test Reviewer',
    contactEmail: 'reviewer@example.com',
    jobTitle: 'Security Test Vacancy',
    description: 'A synthetic submission used only by the Phase 9 security test.',
    location: 'Kampala',
    employmentType: 'full-time',
    deadline: '2099-12-31',
    applicationDetails: 'Apply at https://example.com/apply',
    salary: '',
    website: 'https://example.com',
    logo: '',
    supportingInformation: '',
    turnstile: 'synthetic-turnstile-token',
    fax: '',
    ...overrides,
  };
}

function request(body, headers = {}, init = {}) {
  return new Request('https://ssegu.com/api/job-submissions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://ssegu.com',
      'CF-Connecting-IP': '203.0.113.10',
      ...headers,
    },
    body: JSON.stringify(body),
    ...init,
  });
}

function mockEnvironment({ turnstileSuccess = true } = {}) {
  const values = new Map();
  const inserts = [];
  const env = {
    TURNSTILE_SECRET_KEY: 'synthetic-secret-not-a-production-secret',
    TURNSTILE_EXPECTED_HOSTNAME: 'ssegu.com',
    RATE_LIMIT_KV: {
      async get(key) {
        return values.get(key) ?? null;
      },
      async put(key, value) {
        values.set(key, value);
      },
    },
    JOB_SUBMISSIONS_DB: {
      prepare(sql) {
        return {
          bind(...parameters) {
            inserts.push({ sql, parameters });
            return { run: async () => ({ success: true }) };
          },
        };
      },
    },
  };
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        success: turnstileSuccess,
        action: 'job_submission',
        hostname: 'ssegu.com',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  return { env, inserts };
}

async function json(response) {
  return response.json();
}

try {
  const parsed = parseSubmissionPayload({ 'cf-turnstile-response': 'token', jobTitle: 'Parsed' });
  assert.equal(parsed.turnstile, 'token');
  assert.equal(parsed.jobTitle, 'Parsed');

  const valid = validateSubmission(validPayload(), new Date('2026-11-09T00:00:00.000Z'));
  assert.ok(valid.data, 'a complete submission should validate');
  assert.equal(valid.data.contactEmail, 'reviewer@example.com');

  const invalid = validateSubmission(
    validPayload({ contactEmail: 'not-an-email', employmentType: 'invalid' }),
    new Date('2026-11-09T00:00:00.000Z'),
  );
  assert.equal(invalid.data, undefined);
  assert.ok(invalid.errors.contactEmail);
  assert.ok(invalid.errors.employmentType);

  const missingServices = await onRequest({
    request: request(validPayload()),
    env: {},
  });
  assert.equal(missingServices.status, 503);

  const wrongMethod = await onRequest({
    request: new Request('https://ssegu.com/api/job-submissions', { method: 'GET' }),
    env: {},
  });
  assert.equal(wrongMethod.status, 405);

  const crossOrigin = await onRequest({
    request: request(validPayload(), { Origin: 'https://attacker.example' }),
    env: {},
  });
  assert.equal(crossOrigin.status, 403);

  const tooLarge = mockEnvironment();
  const oversized = await onRequest({
    request: request(validPayload(), { 'content-length': '65537' }),
    env: tooLarge.env,
  });
  assert.equal(oversized.status, 413);
  assert.equal(tooLarge.inserts.length, 0);

  const rejectedTurnstile = mockEnvironment({ turnstileSuccess: false });
  const rejected = await onRequest({
    request: request(validPayload(), { 'CF-Connecting-IP': '203.0.113.11' }),
    env: rejectedTurnstile.env,
  });
  assert.equal(rejected.status, 400);
  assert.equal(rejectedTurnstile.inserts.length, 0);
  assert.ok((await json(rejected)).errors.turnstile);

  const accepted = mockEnvironment();
  const created = await onRequest({
    request: request(validPayload(), { 'CF-Connecting-IP': '203.0.113.12' }),
    env: accepted.env,
  });
  assert.equal(created.status, 201);
  assert.match((await json(created)).message, /private editorial review/i);
  assert.equal(accepted.inserts.length, 1);
  assert.match(accepted.inserts[0].sql, /status, created_at,\s+reviewed_at, retention_until/);
  assert.match(accepted.inserts[0].sql, /'pending'/);

  console.log('Phase 9 submission security checks passed');
} finally {
  globalThis.fetch = originalFetch;
}
