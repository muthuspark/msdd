import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const appUrl = new URL('../src/viewer/app.js', import.meta.url);
const indexUrl = new URL('../src/viewer/index.html', import.meta.url);

test('provides a labelled reader landmark before a document is selected', async () => {
  const html = await fs.readFile(indexUrl, 'utf8');
  assert.match(html, /<article id="reader" aria-label="Document reader">/);
});

test('builds a labelled desktop rail with a compact ARIA disclosure on small screens', async () => {
  const source = await fs.readFile(appUrl, 'utf8');
  assert.match(source, /if \(entries\.length\)/);
  assert.match(source, /toggle\.setAttribute\('aria-controls', panel\.id\)/);
  assert.match(source, /panel\.setAttribute\('aria-label', 'On this page'\)/);
  assert.match(source, /layout\.append\(panel\)/);
  assert.match(source, /toggle\.hidden = !compact; panel\.hidden = compact;/);
  assert.match(source, /compactQuery\.addEventListener\('change', syncOutline/);
  assert.match(source, /event\.key === 'Escape'/);
  assert.match(source, /entry\.node\.focus\(\{ preventScroll: true \}\)/);
});

test('uses feature entries in the sidebar and exposes document artifacts as reader tabs', async () => {
  const source = await fs.readFile(appUrl, 'utf8');
  assert.match(source, /import \{ buildFeatures, defaultFile/);
  assert.match(source, /button\.className = 'feature-button'/);
  assert.match(source, /const artifactOrder = \['explore\.md', 'spec\.md', 'task\.md'\]/);
  assert.match(source, /tabs\.className = 'reader-tabs'/);
  assert.match(source, /\{ 'explore\.md': 'Explore', 'spec\.md': 'Spec', 'task\.md': 'Tasks' \}/);
  assert.match(source, /selectFeature\(feature, button\)/);
});

test('uses a full-width title without a reader path line', async () => {
  const source = await fs.readFile(appUrl, 'utf8');
  assert.match(source, /context\.append\(title\); header\.append\(context\);/);
  assert.doesNotMatch(source, /reader-path/);
});

test('keeps reader announcements concise and excludes the document H1 from the outline', async () => {
  const [html, source] = await Promise.all([fs.readFile(indexUrl, 'utf8'), fs.readFile(appUrl, 'utf8')]);
  assert.doesNotMatch(html, /<main class="app" aria-live=/);
  assert.match(html, /id="reader-status" role="status"/);
  assert.match(source, /const headings = headingEntries\(content\);/);
  assert.match(source, /const entries = headings\.filter\(\(entry\) => entry\.level > 1\)/);
  assert.match(source, /link\.setAttribute\('aria-current', 'location'\)/);
});

test('uses the reader header as the only document title and keeps artifact tabs below it', async () => {
  const [source, css] = await Promise.all([fs.readFile(appUrl, 'utf8'), fs.readFile(new URL('../src/viewer/styles.css', import.meta.url), 'utf8')]);
  assert.match(source, /headings\.filter\(\(entry\) => entry\.level === 1\)\.forEach\(\(entry\) => entry\.node\.remove\(\)\)/);
  assert.match(css, /\.reader-tabs\s*\{[^}]*justify-content:flex-start;/);
});

test('retains recoverable document and diagram failure paths', async () => {
  const source = await fs.readFile(appUrl, 'utf8');
  assert.match(source, /target\.textContent = 'This Mermaid diagram could not be rendered\.'/);
  assert.match(source, /elements\.reader\.textContent = 'Unable to read this Markdown file\.'/);
  assert.match(source, /outlineController\?\.abort\(\)/);
});
