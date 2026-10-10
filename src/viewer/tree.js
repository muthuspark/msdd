export function buildTree(files) {
  const root = { directories: new Map(), files: [] };
  for (const file of files.filter((file) => file.relativePath.endsWith('.md'))) {
    const parts = file.relativePath.split('/').filter(Boolean); let node = root;
    for (const part of parts.slice(0, -1)) { if (!node.directories.has(part)) node.directories.set(part, { directories: new Map(), files: [] }); node = node.directories.get(part); }
    node.files.push(file);
  }
  const sort = (node) => ({ directories: [...node.directories].sort(([a], [b]) => a.localeCompare(b)).map(([name, child]) => ({ name, ...sort(child) })), files: node.files.sort((a, b) => a.relativePath.localeCompare(b)) });
  return sort(root);
}
export function buildFeatures(files) {
  const groups = new Map();
  for (const file of files.filter((item) => item.relativePath.endsWith('.md'))) {
    const parts = file.relativePath.split('/').filter(Boolean);
    const path = parts.slice(0, -1).join('/') || 'root';
    if (!groups.has(path)) groups.set(path, { path, name: parts.at(-2) || parts[0], files: [] });
    groups.get(path).files.push(file);
  }
  return [...groups.values()].map((group) => ({ ...group, files: group.files.sort((a, b) => a.relativePath.localeCompare(b)) })).sort((a, b) => a.path.localeCompare(b.path));
}
export function defaultFile(files) { return files.find((file) => file.relativePath.split('/').pop() === 'spec.md') || [...files].sort((a, b) => a.relativePath.localeCompare(b))[0]; }
export async function filesFromDirectory(handle) {
  let specs; for await (const entry of handle.values()) if (entry.kind === 'directory' && entry.name === 'specs') specs = entry;
  if (!specs) throw new Error('The selected folder must contain a direct specs directory.');
  const files = []; async function walk(directory, prefix = '') { for await (const entry of directory.values()) { const next = `${prefix}${entry.name}`; if (entry.kind === 'directory') await walk(entry, `${next}/`); else if (entry.kind === 'file' && entry.name.endsWith('.md')) { const value = await entry.getFile(); files.push({ relativePath: next, readText: () => value.text() }); } } }
  await walk(specs); return files;
}
export function filesFromInput(files) {
  const values = [...files].filter((file) => file.webkitRelativePath.split('/').slice(1, 2)[0] === 'specs' && file.name.endsWith('.md')).map((file) => ({ relativePath: file.webkitRelativePath.split('/').slice(2).join('/'), readText: () => file.text() }));
  if (!values.length) throw new Error('The selected folder must contain a direct specs directory with Markdown files.'); return values;
}
