import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

test('keeps hidden viewer states out of layout', async () => {
  const css = await fs.readFile(new URL('../src/viewer/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\[hidden\]\s*\{\s*display:none !important;/);
});

test('creates independent sidebar and reader scrollports within the viewport shell', async () => {
  const css = await fs.readFile(new URL('../src/viewer/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.app\s*\{[^}]*height:100dvh;[^}]*overflow:hidden;/);
  assert.match(css, /\.workspace\s*\{[^}]*height:100dvh;[^}]*overflow:hidden;/);
  assert.match(css, /aside\s*\{[^}]*min-height:0;[^}]*overflow-y:auto;/);
  assert.match(css, /#reader\s*\{[^}]*min-height:0;[^}]*overflow-y:auto;/);
  assert.match(css, /@media \(max-width:700px\)\s*\{\s*\.workspace\s*\{[^}]*grid-template-rows:minmax\(0,2fr\) minmax\(0,3fr\);/);
  assert.match(css, /\.message\s*\{[^}]*position:absolute;[^}]*bottom:0;/);
});
