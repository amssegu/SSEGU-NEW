import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const file =
  process.argv.find((argument) => argument.startsWith('--file='))?.slice(7) ??
  'docs/migration/phase-7/artifacts/redirects/dual-site-redirects.csv';

function parseCsvLine(line) {
  const cells = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && line[index + 1] === '"' && quoted) {
      cell += '"';
      index += 1;
    } else if (character === '"') quoted = !quoted;
    else if (character === ',' && !quoted) {
      cells.push(cell);
      cell = '';
    } else cell += character;
  }
  cells.push(cell);
  return cells;
}

function readRows(contents) {
  const lines = contents.trim().split(/\r?\n/);
  const columns = parseCsvLine(lines.shift());
  return lines.filter(Boolean).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(columns.map((column, index) => [column, values[index] ?? '']));
  });
}

function validate(rows) {
  const errors = [];
  const destinations = new Map();
  for (const row of rows) {
    const oldUrl = row.old_url;
    const newUrl = row.new_url;
    const key = `${row.site}:${oldUrl}`;
    if (!/^\/(?!\/)/.test(oldUrl) || !/^\/(?!\/)/.test(newUrl))
      errors.push({ code: 'malformed-target', row });
    if (/[?#]/.test(oldUrl) || /[?#]/.test(newUrl))
      errors.push({ code: 'query-or-fragment-in-map', row });
    if (row.verified !== 'true') errors.push({ code: 'unverified', row });
    if (!['301', '410'].includes(row.redirect_type))
      errors.push({ code: 'invalid-redirect-type', row });
    if (destinations.has(key)) errors.push({ code: 'collision', row });
    destinations.set(key, newUrl);
    if (oldUrl === newUrl && row.redirect_type !== '410')
      errors.push({ code: 'self-redirect', row });
    if (newUrl === '/' && oldUrl !== '/' && row.redirect_type !== '410')
      errors.push({ code: 'blanket-homepage-redirect', row });
  }
  for (const [key, destination] of destinations) {
    const site = key.slice(0, key.indexOf(':'));
    const seen = new Set([key]);
    let next = `${site}:${destination}`;
    while (destinations.has(next)) {
      if (seen.has(next)) {
        errors.push({ code: 'redirect-loop', key });
        break;
      }
      seen.add(next);
      next = `${site}:${destinations.get(next)}`;
    }
  }
  return errors;
}

if (!existsSync(file)) throw new Error(`Redirect map does not exist: ${file}`);
const rows = readRows(await readFile(file, 'utf8'));
const errors = validate(rows);
console.log(
  JSON.stringify({ file, rowCount: rows.length, valid: errors.length === 0, errors }, null, 2),
);
if (errors.length) process.exitCode = 1;
