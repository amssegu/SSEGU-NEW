interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<{ success?: boolean }>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

interface Env {
  JOB_SUBMISSIONS_DB?: D1Database;
  RATE_LIMIT_KV?: KVNamespace;
  TURNSTILE_SECRET_KEY?: string;
  TURNSTILE_EXPECTED_HOSTNAME?: string;
}

interface PagesFunctionContext {
  request: Request;
  env: Env;
}

type FieldName =
  | 'organisation'
  | 'contactName'
  | 'contactEmail'
  | 'jobTitle'
  | 'description'
  | 'location'
  | 'employmentType'
  | 'deadline'
  | 'applicationDetails'
  | 'salary'
  | 'website'
  | 'logo'
  | 'supportingInformation'
  | 'turnstile';

interface SubmissionInput {
  organisation: string;
  contactName: string;
  contactEmail: string;
  jobTitle: string;
  description: string;
  location: string;
  employmentType: string;
  deadline: string;
  applicationDetails: string;
  salary: string;
  website: string;
  logo: string;
  supportingInformation: string;
  turnstile: string;
  fax: string;
}

export const MAX_BODY_BYTES = 64 * 1024;
export const RETENTION_DAYS = 90;
export const RATE_LIMIT_MAX_REQUESTS = 5;
export const RATE_LIMIT_WINDOW_SECONDS = 60;
const TURNSTILE_ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const EMPLOYMENT_TYPES = new Set([
  'full-time',
  'part-time',
  'contract',
  'temporary',
  'internship',
  'volunteer',
]);

const MAX_LENGTHS: Record<FieldName, number> = {
  organisation: 160,
  contactName: 120,
  contactEmail: 254,
  jobTitle: 160,
  description: 10000,
  location: 160,
  employmentType: 30,
  deadline: 10,
  applicationDetails: 4000,
  salary: 160,
  website: 2048,
  logo: 2048,
  supportingInformation: 4000,
  turnstile: 2048,
};

function normaliseText(value: unknown, multiline = false) {
  if (typeof value !== 'string') return '';
  const normalised = value
    .normalize('NFKC')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  return multiline
    ? normalised.replace(/\r\n?/g, '\n').trim()
    : normalised.replace(/\s+/g, ' ').trim();
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function valueFor(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === 'string' ? value : '';
}

export function parseSubmissionPayload(payload: unknown): SubmissionInput {
  const record = asRecord(payload);
  return {
    organisation: valueFor(record, 'organisation'),
    contactName: valueFor(record, 'contactName'),
    contactEmail: valueFor(record, 'contactEmail'),
    jobTitle: valueFor(record, 'jobTitle'),
    description: valueFor(record, 'description'),
    location: valueFor(record, 'location'),
    employmentType: valueFor(record, 'employmentType'),
    deadline: valueFor(record, 'deadline'),
    applicationDetails: valueFor(record, 'applicationDetails'),
    salary: valueFor(record, 'salary'),
    website: valueFor(record, 'website'),
    logo: valueFor(record, 'logo'),
    supportingInformation: valueFor(record, 'supportingInformation'),
    turnstile: valueFor(record, 'cf-turnstile-response') || valueFor(record, 'turnstile'),
    fax: valueFor(record, 'fax'),
  };
}

function validHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      (url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password
    );
  } catch {
    return false;
  }
}

function validDate(value: string, today: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < today) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

export function validateSubmission(input: SubmissionInput, now = new Date()) {
  const errors: Partial<Record<FieldName, string>> = {};
  const today = now.toISOString().slice(0, 10);
  const organisation = normaliseText(input.organisation);
  const contactName = normaliseText(input.contactName);
  const contactEmail = normaliseText(input.contactEmail).toLowerCase();
  const jobTitle = normaliseText(input.jobTitle);
  const description = normaliseText(input.description, true);
  const location = normaliseText(input.location);
  const employmentType = normaliseText(input.employmentType).toLowerCase();
  const deadline = normaliseText(input.deadline);
  const applicationDetails = normaliseText(input.applicationDetails, true);
  const salary = normaliseText(input.salary, true);
  const website = normaliseText(input.website);
  const logo = normaliseText(input.logo);
  const supportingInformation = normaliseText(input.supportingInformation, true);
  const turnstile = normaliseText(input.turnstile);

  const required: Array<[FieldName, string, string, number]> = [
    ['organisation', organisation, 'Organisation name is required.', MAX_LENGTHS.organisation],
    ['contactName', contactName, 'Contact name is required.', MAX_LENGTHS.contactName],
    ['contactEmail', contactEmail, 'A contact email is required.', MAX_LENGTHS.contactEmail],
    ['jobTitle', jobTitle, 'Job title is required.', MAX_LENGTHS.jobTitle],
    ['description', description, 'A job description is required.', MAX_LENGTHS.description],
    ['location', location, 'Location is required.', MAX_LENGTHS.location],
    ['employmentType', employmentType, 'Select an employment type.', MAX_LENGTHS.employmentType],
    ['deadline', deadline, 'An application deadline is required.', MAX_LENGTHS.deadline],
    [
      'applicationDetails',
      applicationDetails,
      'Application details are required.',
      MAX_LENGTHS.applicationDetails,
    ],
  ];

  for (const [field, value, message, maxLength] of required) {
    if (!value) errors[field] = message;
    else if (value.length > maxLength)
      errors[field] = `Keep this field to ${maxLength} characters or fewer.`;
  }

  for (const [field, value] of [
    ['salary', salary],
    ['supportingInformation', supportingInformation],
  ] as const) {
    if (value.length > MAX_LENGTHS[field])
      errors[field] = `Keep this field to ${MAX_LENGTHS[field]} characters or fewer.`;
  }

  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    errors.contactEmail = 'Enter a valid contact email.';
  }
  if (employmentType && !EMPLOYMENT_TYPES.has(employmentType)) {
    errors.employmentType = 'Select a valid employment type.';
  }
  if (deadline && !validDate(deadline, today)) {
    errors.deadline = 'Enter a valid future application deadline.';
  }
  if (website && (!validHttpUrl(website) || website.length > MAX_LENGTHS.website)) {
    errors.website = 'Enter a valid website URL beginning with http:// or https://.';
  }
  if (logo && (!validHttpUrl(logo) || logo.length > MAX_LENGTHS.logo)) {
    errors.logo = 'Enter a valid logo URL beginning with http:// or https://.';
  }
  if (!turnstile || turnstile.length > MAX_LENGTHS.turnstile) {
    errors.turnstile = 'Complete the verification challenge and try again.';
  }

  if (Object.keys(errors).length > 0) return { errors };
  return {
    data: {
      organisation,
      contactName,
      contactEmail,
      jobTitle,
      description,
      location,
      employmentType,
      deadline,
      applicationDetails,
      salary: salary || null,
      website: website || null,
      logo: logo || null,
      supportingInformation: supportingInformation || null,
      turnstile,
    },
    errors: {},
  };
}

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

async function readPayload(request: Request) {
  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES)
    throw new Error('too-large');

  const contentType = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  const raw = await request.clone().arrayBuffer();
  if (raw.byteLength > MAX_BODY_BYTES) throw new Error('too-large');

  if (contentType === 'application/json') {
    try {
      return await request.json();
    } catch {
      throw new Error('malformed');
    }
  }
  if (contentType === 'application/x-www-form-urlencoded') {
    return Object.fromEntries(new URLSearchParams(new TextDecoder().decode(raw)));
  }
  if (contentType === 'multipart/form-data') {
    const formData = await request.formData();
    return Object.fromEntries(
      [...formData.entries()].map(([key, value]) => [key, typeof value === 'string' ? value : '']),
    );
  }
  throw new Error('unsupported');
}

async function verifyTurnstile(token: string, request: Request, env: Env) {
  if (!env.TURNSTILE_SECRET_KEY) return 'unavailable';
  try {
    const body = new FormData();
    body.set('secret', env.TURNSTILE_SECRET_KEY);
    body.set('response', token);
    const ip = request.headers.get('CF-Connecting-IP');
    if (ip) body.set('remoteip', ip);
    const response = await fetch(TURNSTILE_ENDPOINT, { method: 'POST', body });
    if (!response.ok) return false;
    const result = (await response.json()) as {
      success?: boolean;
      action?: string;
      hostname?: string;
    };
    if (!result.success || (result.action && result.action !== 'job_submission')) return false;
    if (env.TURNSTILE_EXPECTED_HOSTNAME && result.hostname !== env.TURNSTILE_EXPECTED_HOSTNAME)
      return false;
    return true;
  } catch {
    return false;
  }
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString();
}

async function rateLimitKey(clientKey: string, now = Date.now()) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(clientKey),
  );
  const clientHash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
  const window = Math.floor(now / (RATE_LIMIT_WINDOW_SECONDS * 1000));
  return `job-submission:${clientHash}:${window}`;
}

async function checkRateLimit(namespace: KVNamespace, clientKey: string) {
  const key = await rateLimitKey(clientKey);
  const currentValue = await namespace.get(key);
  const current = currentValue === null ? 0 : Number(currentValue);
  if (!Number.isSafeInteger(current) || current < 0)
    throw new Error('invalid-rate-limit-state');
  if (current >= RATE_LIMIT_MAX_REQUESTS) return false;

  await namespace.put(key, String(current + 1), {
    expirationTtl: RATE_LIMIT_WINDOW_SECONDS + 5,
  });
  return true;
}

export async function onRequest(context: PagesFunctionContext) {
  const { request, env } = context;
  if (request.method !== 'POST') {
    return jsonResponse({ message: 'Only POST requests are accepted.' }, 405);
  }

  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) {
    return jsonResponse({ message: 'This request could not be accepted.' }, 403);
  }
  if (!env.RATE_LIMIT_KV || !env.JOB_SUBMISSIONS_DB) {
    return jsonResponse({ message: 'Submission service is temporarily unavailable.' }, 503);
  }

  const clientKey = request.headers.get('CF-Connecting-IP') || 'unknown-client';
  try {
    const allowed = await checkRateLimit(env.RATE_LIMIT_KV, clientKey);
    if (!allowed)
      return jsonResponse({ message: 'Please wait before trying again.' }, 429);
  } catch {
    return jsonResponse({ message: 'Submission service is temporarily unavailable.' }, 503);
  }

  let input: SubmissionInput;
  try {
    input = parseSubmissionPayload(await readPayload(request));
  } catch (error) {
    const tooLarge = error instanceof Error && error.message === 'too-large';
    return jsonResponse(
      {
        message: tooLarge
          ? 'The submission is too large.'
          : 'The submission format could not be read.',
      },
      tooLarge ? 413 : 400,
    );
  }

  if (input.fax) return jsonResponse({ message: 'The submission could not be accepted.' }, 202);
  const validation = validateSubmission(input);
  if (!validation.data)
    return jsonResponse(
      { message: 'Please correct the highlighted fields.', errors: validation.errors },
      400,
    );

  const turnstile = await verifyTurnstile(validation.data.turnstile, request, env);
  if (turnstile === 'unavailable')
    return jsonResponse({ message: 'Submission service is temporarily unavailable.' }, 503);
  if (!turnstile)
    return jsonResponse(
      {
        message: 'Complete the verification challenge and try again.',
        errors: { turnstile: 'Verification failed. Please try again.' },
      },
      400,
    );

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  try {
    const result = await env.JOB_SUBMISSIONS_DB.prepare(
      `INSERT INTO job_submissions
          (id, organisation, contact_name, contact_email, job_title, location,
           employment_type, description, deadline, application_details, source_url,
           salary, logo_url, supporting_information, status, created_at,
           reviewed_at, retention_until)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, NULL, ?)`,
    )
      .bind(
        id,
        validation.data.organisation,
        validation.data.contactName,
        validation.data.contactEmail,
        validation.data.jobTitle,
        validation.data.location,
        validation.data.employmentType,
        validation.data.description,
        validation.data.deadline,
        validation.data.applicationDetails,
        validation.data.website,
        validation.data.salary,
        validation.data.logo,
        validation.data.supportingInformation,
        createdAt,
        addDays(new Date(createdAt), RETENTION_DAYS),
      )
      .run();
    if (result.success === false) throw new Error('insert-failed');
  } catch {
    return jsonResponse(
      { message: 'We could not save the submission. Please try again later.' },
      503,
    );
  }

  return jsonResponse(
    { message: 'Thank you. Your vacancy was sent for private editorial review.' },
    201,
  );
}
