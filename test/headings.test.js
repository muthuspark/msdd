import test from 'node:test';
import assert from 'node:assert/strict';
import { createHeadingMetadata, headingSlug } from '../src/viewer/headings.js';

test('creates readable stable slugs with a section fallback', () => {
  assert.equal(headingSlug('  Résumé & Scope! '), 'resume-scope');
  assert.equal(headingSlug('---'), 'section');
});

test('creates unique heading metadata and omits empty labels', () => {
  assert.deepEqual(createHeadingMetadata([
    { text: 'Overview', level: 1 },
    { text: 'Overview', level: 2 },
    { text: '   ', level: 3 },
    { text: '!!!', level: 4 },
    { text: '!!!', level: 5 }
  ]), [
    { id: 'overview', text: 'Overview', level: 1 },
    { id: 'overview-2', text: 'Overview', level: 2 },
    { id: 'section', text: '!!!', level: 4 },
    { id: 'section-2', text: '!!!', level: 5 }
  ]);
});
