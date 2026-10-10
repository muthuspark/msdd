import { buildTree, defaultFile, filesFromDirectory, filesFromInput } from './tree.js';
import { readHistory, saveHistory } from './history.js';
import { createHeadingMetadata, headingSlug } from './headings.js';
const elements = {
  landing: document.querySelector('#landing'), workspace: document.querySelector('#workspace'),
  choose: document.querySelector('#choose-folder'), input: document.querySelector('#directory-input'),
  tree: document.querySelector('#spec-tree'), reader: document.querySelector('#reader'), message: document.querySelector('#message'), recent: document.querySelector('#recent-folders'), recentList: document.querySelector('#recent-list')
};

export function showMessage(message = '', error = false) { elements.message.textContent = message; elements.message.classList.toggle('error', error); }
export function showWorkspace() { elements.landing.hidden = true; elements.workspace.hidden = false; }
function renderTree(node, parent) { for (const directory of node.directories) { const details = document.createElement('details'); details.open = true; const summary = document.createElement('summary'); summary.textContent = directory.name; details.append(summary); const child = document.createElement('div'); child.className = 'tree-children'; renderTree(directory, child); details.append(child); parent.append(details); } for (const file of node.files) { const button = document.createElement('button'); button.className = 'tree-button'; button.textContent = file.relativePath.split('/').pop(); button.addEventListener('click', () => selectFile(file, button)); parent.append(button); } }
let mermaidLoader;
let markdownLoader;
let outlineController;
async function getMarkdownRenderer() { if (!markdownLoader) markdownLoader = Promise.all([import('/vendor/marked.js'), import('/vendor/purify.js')]).then(([{ marked }, { default: DOMPurify }]) => ({ marked, DOMPurify })); return markdownLoader; }
async function getMermaid() { if (!mermaidLoader) mermaidLoader = import('/vendor/mermaid/mermaid.esm.mjs').then(({ default: mermaid }) => { mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' }); return mermaid; }); return mermaidLoader; }

function headingEntries(content) {
  const nodes = [...content.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter((node) => node.textContent.trim());
  const metadata = createHeadingMetadata(nodes.map((node) => ({ text: node.textContent, level: Number(node.tagName.slice(1)) })));
  const reserved = new Set(nodes.map((node) => node.id).filter((id) => /^[A-Za-z][\w:.-]*$/.test(id) && nodes.filter((item) => item.id === id).length === 1));
  return metadata.map((entry, index) => {
    const node = nodes[index];
    const existing = node.id;
    let id = reserved.has(existing) ? existing : entry.id;
    let suffix = 2;
    while (reserved.has(id) && id !== existing) id = `${headingSlug(entry.text)}-${suffix++}`;
    reserved.add(id); node.id = id; node.tabIndex = -1;
    return { ...entry, id, node };
  });
}

function renderReader(file, html) {
  outlineController?.abort();
  const controller = new AbortController(); outlineController = controller;
  const content = document.createElement('div'); content.className = 'reader-content'; content.innerHTML = html;
  const entries = headingEntries(content);
  const header = document.createElement('header'); header.className = 'reader-header';
  const context = document.createElement('div'); context.className = 'reader-context';
  const title = document.createElement('p'); title.className = 'reader-title'; title.textContent = file.relativePath.split('/').pop();
  const path = document.createElement('p'); path.className = 'reader-path'; path.textContent = file.relativePath;
  context.append(title, path); header.append(context);
  if (entries.length) {
    const toggle = document.createElement('button'); toggle.className = 'outline-toggle'; toggle.type = 'button'; toggle.textContent = 'On this page';
    const panel = document.createElement('nav'); panel.className = 'outline-panel'; panel.id = 'reader-outline'; panel.hidden = true; panel.setAttribute('aria-label', 'On this page');
    toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-controls', panel.id);
    const list = document.createElement('ol'); list.className = 'outline-list';
    for (const entry of entries) { const item = document.createElement('li'); item.style.setProperty('--heading-level', entry.level); const link = document.createElement('button'); link.type = 'button'; link.textContent = entry.text; link.addEventListener('click', () => { panel.hidden = true; toggle.setAttribute('aria-expanded', 'false'); entry.node.focus({ preventScroll: true }); entry.node.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); }); item.append(link); list.append(item); }
    panel.append(list); header.append(toggle, panel);
    const close = (restoreFocus = false) => { panel.hidden = true; toggle.setAttribute('aria-expanded', 'false'); if (restoreFocus) toggle.focus(); };
    toggle.addEventListener('click', () => { const open = panel.hidden; panel.hidden = !open; toggle.setAttribute('aria-expanded', String(open)); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); close(true); } }, { signal: controller.signal });
    document.addEventListener('pointerdown', (event) => { if (!panel.hidden && !header.contains(event.target)) close(); }, { signal: controller.signal });
  }
  elements.reader.replaceChildren(header, content);
  return content;
}

async function selectFile(file, button) { try { document.querySelectorAll('.tree-button').forEach((item) => item.removeAttribute('aria-current')); button?.setAttribute('aria-current', 'page'); const source = await file.readText(); const { marked, DOMPurify } = await getMarkdownRenderer(); const content = renderReader(file, DOMPurify.sanitize(marked.parse(source))); const blocks = [...content.querySelectorAll('pre code.language-mermaid')]; await Promise.all(blocks.map(async (block, index) => { const target = document.createElement('div'); try { const { svg } = await (await getMermaid()).render(`mermaid-${index}`, block.textContent); target.innerHTML = svg; block.parentElement.replaceWith(target); } catch { target.textContent = 'This Mermaid diagram could not be rendered.'; block.parentElement.replaceWith(target); } })); } catch { outlineController?.abort(); elements.reader.textContent = 'Unable to read this Markdown file.'; } }
async function load(files) { if (!files.length) { showMessage('No Markdown files were found in specs.', true); return; } elements.tree.replaceChildren(); renderTree(buildTree(files), elements.tree); showWorkspace(); const first = defaultFile(files); const button = [...elements.tree.querySelectorAll('.tree-button')].find((item) => item.textContent === first.relativePath.split('/').pop()); await selectFile(first, button); }
async function loadHandle(handle, remember = true) { const files = await filesFromDirectory(handle); if (remember) await saveHistory({ name: handle.name, handle }); await load(files); }
async function renderHistory() { try { const entries = await readHistory(); elements.recentList.replaceChildren(); for (const entry of entries) { const card = document.createElement('button'); card.className = 'recent-card'; card.textContent = entry.name; card.addEventListener('click', async () => { try { if ((await entry.handle.queryPermission({ mode: 'read' })) !== 'granted' && (await entry.handle.requestPermission({ mode: 'read' })) !== 'granted') throw new Error('Folder permission was not granted.'); await loadHandle(entry.handle); } catch (error) { showMessage(error.message, true); } }); elements.recentList.append(card); } elements.recent.hidden = !entries.length; } catch { elements.recent.hidden = true; } }

elements.choose.addEventListener('click', async () => {
  if ('showDirectoryPicker' in window) { try { await loadHandle(await window.showDirectoryPicker()); } catch (error) { if (error.name !== 'AbortError') showMessage(error.message, true); } return; }
  elements.input.click();
});
elements.input.addEventListener('change', async () => { try { await load(filesFromInput(elements.input.files)); } catch (error) { showMessage(error.message, true); } });
renderHistory();
