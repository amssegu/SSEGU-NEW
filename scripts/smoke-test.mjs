import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

assert.equal(existsSync('dist/index.html'), true, 'Build dist/index.html first');
assert.equal(existsSync('dist/smoke/index.html'), true, 'Build dist/smoke/index.html first');
assert.match(readFileSync('dist/smoke/index.html', 'utf8'), /Smoke test passed/);
console.log('static smoke checks passed');
