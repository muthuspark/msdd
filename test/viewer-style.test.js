import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

test('keeps hidden viewer states out of layout', async () => {
  const css = await fs.readFile(new URL('../src/viewer/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\[hidden\]\s*\{\s*display:none !important;/);
});
