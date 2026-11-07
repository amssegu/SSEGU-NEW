import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

assert.equal(existsSync('src/pages/index.astro'), true);
assert.equal(existsSync('src/pages/smoke.astro'), true);
assert.match(readFileSync('astro.config.mjs', 'utf8'), /output:\s*'static'/);
console.log('unit checks passed');
