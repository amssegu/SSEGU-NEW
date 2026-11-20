import { readFile } from 'node:fs/promises';

const path = process.argv[2];
if (!path) throw new Error('usage: verify-pages-deployment.mjs DEPLOYMENTS_JSON');
const payload = JSON.parse(await readFile(path, 'utf8'));
const deployments = Array.isArray(payload)
  ? payload
  : Array.isArray(payload.result)
    ? payload.result
    : payload.Environment || payload.environment
      ? [payload]
      : null;
if (!Array.isArray(deployments)) throw new Error('Pages deployment response is malformed');

const production = deployments.find((deployment) => {
  const environment = deployment.Environment ?? deployment.environment;
  const url = deployment.URL ?? deployment.url;
  return String(environment).toLowerCase() === 'production' && typeof url === 'string' && url;
});
if (!production) throw new Error('no production Pages deployment was returned');

console.log(
  JSON.stringify({
    id: production.Id ?? production.id ?? null,
    url: production.URL ?? production.url,
    environment: production.Environment ?? production.environment,
  }),
);
