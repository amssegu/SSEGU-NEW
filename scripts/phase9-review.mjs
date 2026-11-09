import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const artifactRoot = join(root, 'docs/quality/phase-9/artifacts');
mkdirSync(artifactRoot, { recursive: true });
const date = process.env.PHASE9_DATE ?? new Date().toISOString().slice(0, 10);
const npmCli = process.env.npm_execpath ?? '/usr/lib/node_modules/npm/bin/npm-cli.js';

function addDays(dateText, days) {
  const dateValue = new Date(`${dateText}T00:00:00.000Z`);
  dateValue.setUTCDate(dateValue.getUTCDate() + days);
  return dateValue.toISOString().slice(0, 10);
}

function run(command, args, timeout = 180_000, displayCommand = [command, ...args].join(' ')) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    timeout,
    maxBuffer: 2 * 1024 * 1024,
  });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
  return {
    command: displayCommand,
    exitCode: result.status,
    status: result.error ? 'not-run' : result.status === 0 ? 'pass' : 'fail',
    output: output.slice(-4000),
    error: result.error?.message,
  };
}

function filesIn(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? filesIn(path) : [path];
  });
}

function staticReview() {
  const findings = [];
  const headers = readFileSync(join(root, 'public/_headers'), 'utf8');
  const functionSource = readFileSync(join(root, 'functions/api/job-submissions.ts'), 'utf8');
  const adminConfig = readFileSync(join(root, 'public/admin/config.yml'), 'utf8');
  const envExample = readFileSync(join(root, '.env.example'), 'utf8');

  for (const [label, condition] of [
    [
      'security headers',
      /X-Content-Type-Options:\s+nosniff/.test(headers) && /Referrer-Policy:/.test(headers),
    ],
    ['admin noindex', /\/admin\/\*\s+X-Robots-Tag:\s+noindex, nofollow/s.test(headers)],
    ['search noindex', /\/search\/\*\s+X-Robots-Tag:\s+noindex, nofollow/s.test(headers)],
    [
      'submission fail-closed bindings',
      /RATE_LIMIT_KV/.test(functionSource) &&
        /JOB_SUBMISSIONS_DB/.test(functionSource) &&
        /503/.test(functionSource),
    ],
    ['submission body limit', /MAX_BODY_BYTES\s*=\s*64 \* 1024/.test(functionSource)],
    ['submission origin check', /request\.headers\.get\('Origin'\)/.test(functionSource)],
    ['Turnstile verification', /siteverify/.test(functionSource)],
    ['CMS editorial workflow', /publish_mode:\s*editorial_workflow/.test(adminConfig)],
    ['production secret separation', !/TURNSTILE_SECRET_KEY\s*=\s*[^\s#]/.test(envExample)],
  ]) {
    if (!condition) findings.push({ severity: 'high', label });
  }

  const sourceFiles = [
    ...filesIn(join(root, 'src')),
    ...filesIn(join(root, 'functions')),
    join(root, 'astro.config.mjs'),
    join(root, 'wrangler.toml'),
  ];
  const secretPatterns = [
    /-----BEGIN (?:RSA|EC|OPENSSH|PRIVATE) KEY-----/,
    /\bAKIA[0-9A-Z]{16}\b/,
    /\bgh[pousr]_[A-Za-z0-9_]{30,}\b/,
  ];
  for (const file of sourceFiles) {
    const source = readFileSync(file, 'utf8');
    if (secretPatterns.some((pattern) => pattern.test(source))) {
      findings.push({ severity: 'critical', label: `possible secret in ${relative(root, file)}` });
    }
  }

  if (existsSync(join(root, 'dist'))) {
    const publicHtml = filesIn(join(root, 'dist')).filter((file) => file.endsWith('.html'));
    const privateTokens =
      /job_submissions|contact_name|retention_until|reviewed_by|supporting_information/;
    for (const file of publicHtml) {
      const html = readFileSync(file, 'utf8');
      const isAdmin = relative(join(root, 'dist'), file).startsWith('admin/');
      if (privateTokens.test(html))
        findings.push({
          severity: 'critical',
          label: `private submission data in ${relative(root, file)}`,
        });
      if (!/<html[^>]+lang="[^"]+"/i.test(html))
        findings.push({
          severity: 'high',
          label: `missing document language in ${relative(root, file)}`,
        });
      if (!isAdmin && !/<meta[^>]+name="description"/i.test(html))
        findings.push({
          severity: 'high',
          label: `missing description in ${relative(root, file)}`,
        });
      if (/<img\b(?![^>]*\balt=)[^>]*>/i.test(html))
        findings.push({
          severity: 'high',
          label: `image without alt text in ${relative(root, file)}`,
        });
    }
  } else {
    findings.push({
      severity: 'high',
      label: 'static build not present for HTML security/accessibility review',
    });
  }

  return { status: findings.length ? 'fail' : 'pass', findings };
}

const commands = [
  ['format', ['run', 'format:check']],
  ['typecheck', ['run', 'check']],
  ['unit', ['test']],
  ['submission-security', ['run', 'test:security']],
  ['content', ['run', 'validate:content']],
  ['redirects', ['run', 'validate:redirects']],
  ['build', ['run', 'build']],
  ['static-smoke', ['run', 'test:e2e']],
  ['dependency-audit', ['audit', '--omit=dev', '--audit-level=high', '--json']],
];
const checks = commands.map(([id, args]) => ({
  id,
  ...run(process.execPath, [npmCli, ...args], 180_000, ['npm', ...args].join(' ')),
}));
const staticSecurity = staticReview();
const auditCheck = checks.find((check) => check.id === 'dependency-audit');
let auditReport;
try {
  const jsonStart = auditCheck?.output.indexOf('{') ?? -1;
  if (jsonStart >= 0) auditReport = JSON.parse(auditCheck.output.slice(jsonStart));
} catch {
  // The command result remains the source of truth when npm returns non-JSON output.
}
const auditCounts = auditReport?.metadata?.vulnerabilities ?? {};
const acceptedWarnings = [];
if (auditCounts.low > 0) {
  acceptedWarnings.push({
    id: 'dependency-audit-low',
    owner: 'SSEGU engineering',
    followUpDate: process.env.PHASE9_FOLLOW_UP_DATE ?? addDays(date, 7),
    detail: `${auditCounts.low} low-severity dependency finding(s) remain; no high or critical findings are accepted.`,
  });
}

let phase8Gate = { decision: 'UNKNOWN' };
try {
  phase8Gate = JSON.parse(
    readFileSync(join(root, 'docs/migration/phase-8/artifacts/reports/phase-8-gate.json'), 'utf8'),
  );
} catch {
  // The missing gate is reported below as a blocker.
}

const externalEvidence = {
  lighthouse: process.env.PHASE9_LIGHTHOUSE_REPORT
    ? 'provided'
    : 'not-run: supply measured mobile/desktop Lighthouse reports',
  preview: process.env.PHASE9_PREVIEW_URL
    ? 'provided'
    : 'not-run: set PHASE9_PREVIEW_URL and run the preview probes',
  backupRestore: process.env.PHASE9_BACKUP_EVIDENCE
    ? 'provided'
    : 'not-run: attach a redacted D1 backup/restore record',
  rollback: process.env.PHASE9_ROLLBACK_EVIDENCE
    ? 'provided'
    : 'not-run: attach a previous-release rollback record',
};

const blockers = [];
if (phase8Gate.decision !== 'PASS')
  blockers.push(
    'Phase 8 is not PASS; resolve the reviewed Work-subdomain redirect failure before entering Phase 9.',
  );
for (const check of checks.filter((check) => check.status !== 'pass'))
  blockers.push(`${check.id} check ${check.status}.`);
for (const finding of staticSecurity.findings)
  blockers.push(`${finding.severity}: ${finding.label}.`);
for (const [name, status] of Object.entries(externalEvidence))
  if (!status.startsWith('provided')) blockers.push(`${name} evidence is ${status}.`);

const result = {
  date,
  decision: blockers.length ? 'BLOCK' : 'PASS',
  title: blockers.length
    ? 'PHASE 9: BLOCK — DO NOT PROCEED TO PHASE 10'
    : 'PHASE 9: PASS — PROCEED TO PHASE 10',
  owner: 'SSEGU engineering, editorial, security and deployment reviewers',
  phase8: {
    decision: phase8Gate.decision,
    source: 'docs/migration/phase-8/artifacts/reports/phase-8-gate.json',
  },
  checks: checks.map(({ id, command, status, exitCode, error }) => ({
    id,
    command,
    status,
    exitCode,
    error,
  })),
  dependencyAudit: { counts: auditCounts, acceptedWarnings },
  staticSecurity,
  externalEvidence,
  blockers,
  nextActions: [
    'Resolve all blockers and rerun npm run review:phase9.',
    'Do not mark Lighthouse, preview, backup/restore or rollback as passed from source inspection alone.',
  ],
};

writeFileSync(join(artifactRoot, 'phase-9-gate.json'), `${JSON.stringify(result, null, 2)}\n`);
const matrix = [
  '# Phase 9 QA matrix',
  '',
  `- Date: ${date}`,
  `- Decision: **${result.decision}**`,
  '- Reproduction: `npm run review:phase9`',
  '',
  '| Area | Evidence command or record | Result |',
  '| --- | --- | --- |',
  ...checks.map((check) => `| ${check.id} | \`${check.command}\` | ${check.status} |`),
  `| Static security and accessibility contract | \`scripts/phase9-review.mjs\` | ${staticSecurity.status} |`,
  `| Lighthouse mobile/desktop | External measured report | ${externalEvidence.lighthouse} |`,
  `| Preview deployment probes | \`PHASE9_PREVIEW_URL\` | ${externalEvidence.preview} |`,
  `| Backup/restore | Redacted operational record | ${externalEvidence.backupRestore} |`,
  `| Rollback | Previous verified release record | ${externalEvidence.rollback} |`,
  `| Accepted dependency warnings | Owner/date in phase-9-gate.json | ${acceptedWarnings.length ? acceptedWarnings.map((warning) => `${warning.owner} / ${warning.followUpDate}`).join('; ') : 'None'} |`,
  '',
  '## Blockers',
  '',
  blockers.length ? blockers.map((blocker) => `- ${blocker}`).join('\n') : '- None',
  '',
].join('\n');
writeFileSync(join(artifactRoot, 'phase-9-qa-matrix.md'), matrix);
const rehearsal = [
  '# Phase 9 release rehearsal',
  '',
  `- Date: ${date}`,
  '- Local rehearsal command: `npm run review:phase9`',
  `- Clean checkout, preview deployment, production configuration, backup/restore and rollback require deployment-owner evidence and remain **${Object.values(externalEvidence).every((status) => status === 'provided') ? 'recorded' : 'open'}**.`,
  '',
  'The repository checks and their exact results are recorded in `phase-9-gate.json`. No external deployment or rollback is claimed by this repository run.',
  '',
].join('\\n');
writeFileSync(join(artifactRoot, 'phase-9-release-rehearsal.md'), rehearsal);

console.log(
  JSON.stringify({ date, decision: result.decision, blockers: blockers.length }, null, 2),
);
process.exitCode = result.decision === 'PASS' ? 0 : 1;
