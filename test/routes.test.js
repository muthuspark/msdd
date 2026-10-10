import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRoute, resolveRoute, routeFor } from '../src/viewer/routes.js';

const reader = { path: 'deep reader', files: [{ relativePath: 'deep reader/spec plan.md' }] };

test('creates and parses an encoded document pathname', () => {
  const route = routeFor(reader, reader.files[0]);
  assert.equal(route, '/specs/deep%20reader/deep%20reader%2Fspec%20plan.md');
  assert.deepEqual(parseRoute(route), { featurePath: 'deep reader', relativePath: 'deep reader/spec plan.md' });
});

test('supports root and nested feature paths', () => {
  const root = { path: 'root' };
  const rootFile = { relativePath: 'spec.md' };
  const nested = { path: 'area/nested' };
  const nestedFile = { relativePath: 'area/nested/task.md' };
  assert.deepEqual(parseRoute(routeFor(root, rootFile)), { featurePath: 'root', relativePath: 'spec.md' });
  assert.deepEqual(parseRoute(routeFor(nested, nestedFile)), { featurePath: 'area/nested', relativePath: 'area/nested/task.md' });
});

test('rejects malformed, non-Markdown, traversal, and mismatched routes', () => {
  assert.equal(parseRoute('/'), null);
  assert.equal(parseRoute('/specs/a'), null);
  assert.equal(parseRoute('/specs/%E0%A4%A/a.md'), null);
  assert.equal(parseRoute('/specs/a/%2E%2E%2Fsecret.md'), null);
  assert.equal(parseRoute('/specs/a/a%2Fnotes.txt'), null);
  assert.equal(routeFor({ path: 'a' }, { relativePath: 'other/spec.md' }), null);
});

test('resolves a parsed route to an existing feature and file only', () => {
  const route = parseRoute(routeFor(reader, reader.files[0]));
  assert.deepEqual(resolveRoute([reader], route), { feature: reader, file: reader.files[0] });
  assert.equal(resolveRoute([reader], { featurePath: 'deep reader', relativePath: 'deep reader/missing.md' }), null);
});
