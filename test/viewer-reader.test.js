import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const appUrl = new URL('../src/viewer/app.js', import.meta.url);
const indexUrl = new URL('../src/viewer/index.html', import.meta.url);

test('provides a labelled reader landmark before a document is selected', async () => {
  const html = await fs.readFile(indexUrl, 'utf8');
  assert.match(html, /<article id="reader" aria-label="Document reader">/);
});

test('builds a labelled ARIA outline only when headings are available', async () => {
  const source = await fs.readFile(appUrl, 'utf8');
  assert.match(source, /if \(entries\.length\)/);
  assert.match(source, /toggle\.setAttribute\('aria-expanded', 'false'\)/);
  assert.match(source, /toggle\.setAttribute\('aria-controls', panel\.id\)/);
  assert.match(source, /panel\.setAttribute\('aria-label', 'On this page'\)/);
  assert.match(source, /event\.key === 'Escape'/);
  assert.match(source, /entry\.node\.focus\(\{ preventScroll: true \}\)/);
});

test('retains recoverable document and diagram failure paths', async () => {
  const source = await fs.readFile(appUrl, 'utf8');
  assert.match(source, /target\.textContent = 'This Mermaid diagram could not be rendered\.'/);
  assert.match(source, /elements\.reader\.textContent = 'Unable to read this Markdown file\.'/);
  assert.match(source, /outlineController\?\.abort\(\)/);
});
