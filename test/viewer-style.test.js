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
  assert.match(css, /#reader ul,#reader ol\s*\{\s*padding-inline-start:16px;/);
});

test('keeps reader context sticky, floats a desktop rail, and makes it compact on small screens', async () => {
  const css = await fs.readFile(new URL('../src/viewer/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.reader-header\s*\{[^}]*position:sticky;[^}]*top:-44px;/);
  assert.match(css, /\.reader-layout\s*\{[^}]*display:grid;[^}]*grid-template-columns:minmax\(0,74ch\) minmax\(11rem,13rem\);/);
  assert.match(css, /\.reader-context\s*\{[^}]*flex:1 1 100%;/);
  assert.match(css, /\.reader-title\s*\{[^}]*font:400 24px\/1\.2 var\(--serif\);/);
  assert.match(css, /\.outline-panel\s*\{[^}]*position:sticky;[^}]*top:152px;/);
  assert.match(css, /\.outline-toggle\s*\{[^}]*display:none;/);
  assert.match(css, /#reader h1\s*\{[^}]*scroll-margin-top:152px;/);
  assert.match(css, /@media \(max-width:700px\)[\s\S]*?\.reader-header\s*\{[^}]*top:-24px;/);
  assert.match(css, /@media \(max-width:700px\)[\s\S]*?\.outline-panel\s*\{[^}]*top:160px;/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)\s*\{\s*#reader\s*\{\s*scroll-behavior:auto;/);
});

test('keeps reader controls usable and collapses the rail before tablet prose becomes cramped', async () => {
  const css = await fs.readFile(new URL('../src/viewer/styles.css', import.meta.url), 'utf8');
  assert.match(css, /button:focus-visible\s*\{[^}]*outline:2px solid var\(--ink\)/);
  assert.match(css, /\.feature-button\s*\{[^}]*min-height:40px/);
  assert.match(css, /\.outline-list button\s*\{[^}]*min-height:40px/);
  assert.match(css, /@media \(max-width:960px\)[\s\S]*?\.outline-panel\s*\{[^}]*position:fixed/);
});
