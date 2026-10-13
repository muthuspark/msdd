import test from 'node:test'; import assert from 'node:assert/strict'; import { buildFeatures, buildTree, defaultFile, filesFromDirectory, filesFromInput } from '../src/viewer/tree.js';
test('builds sorted nested Markdown tree and prefers spec.md', () => { const files = ['b/task.md','a/explore.md','a/spec.md'].map((relativePath) => ({ relativePath })); const tree = buildTree(files); assert.deepEqual(tree.directories.map((item) => item.name), ['a','b']); assert.equal(defaultFile(files).relativePath, 'a/spec.md'); });
test('accepts only Markdown under direct specs input directory', () => { const file = (webkitRelativePath) => ({ webkitRelativePath, name: webkitRelativePath.split('/').pop(), text: async () => '' }); assert.equal(filesFromInput([file('root/specs/a.md'), file('root/other/b.md')]).length, 1); });
test('groups a feature files into one sidebar entry', () => { const files = ['reader/explore.md', 'reader/spec.md', 'reader/task.md', 'other/spec.md'].map((relativePath) => ({ relativePath })); assert.deepEqual(buildFeatures(files).map(({ name, files: items }) => [name, items.map((item) => item.relativePath.split('/').pop())]), [['other', ['spec.md']], ['reader', ['explore.md', 'spec.md', 'task.md']]]); });
test('sorts features by their earliest artifact date, newest first, with deterministic ties', () => {
  const files = [
    { relativePath: 'older/explore.md', lastModified: 100 },
    { relativePath: 'older/task.md', lastModified: 900 },
    { relativePath: 'newer/spec.md', lastModified: 200 },
    { relativePath: 'equal/spec.md', lastModified: 200 },
    { relativePath: 'unknown/spec.md' }
  ];
  assert.deepEqual(buildFeatures(files).map((feature) => feature.path), ['equal', 'newer', 'older', 'unknown']);
});
test('retains live file handles and reads current contents for directory selections', async () => {
  let content = 'first';
  const fileHandle = { kind: 'file', name: 'spec.md', async getFile() { return { lastModified: content.length, size: content.length, text: async () => content }; } };
  const specs = { kind: 'directory', name: 'specs', async *values() { yield fileHandle; } };
  const root = { async *values() { yield specs; } };
  const [file] = await filesFromDirectory(root);
  assert.equal(file.mode, 'live');
  assert.equal(file.handle, fileHandle);
  assert.equal(file.size, 5);
  assert.equal(await file.readText(), 'first');
  content = 'updated';
  assert.equal(await file.readText(), 'updated');
});
test('marks directory-upload files as snapshots with no live handle', () => {
  const file = { webkitRelativePath: 'root/specs/spec.md', name: 'spec.md', lastModified: 4, size: 4, text: async () => 'text' };
  const [descriptor] = filesFromInput([file]);
  assert.equal(descriptor.mode, 'snapshot');
  assert.equal(descriptor.handle, undefined);
  assert.equal(descriptor.size, 4);
});
