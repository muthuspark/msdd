import { buildFeatures, defaultFile, filesFromDirectory, filesFromInput } from './tree.js';
import { readHistory, readMostRecent, saveHistory } from './history.js';
import { createHeadingMetadata, headingSlug } from './headings.js';
import { parseRoute, resolveRoute, routeFor } from './routes.js';
const elements = {
  landing: document.querySelector('#landing'), workspace: document.querySelector('#workspace'),
  choose: document.querySelector('#choose-folder'), input: document.querySelector('#directory-input'),
  tree: document.querySelector('#spec-tree'), reader: document.querySelector('#reader'), message: document.querySelector('#message'), status: document.querySelector('#reader-status'), recent: document.querySelector('#recent-folders'), recentList: document.querySelector('#recent-list')
};

export function showMessage(message = '', error = false) { elements.message.textContent = message; elements.message.classList.toggle('error', error); }
export function showWorkspace() { elements.landing.hidden = true; elements.workspace.hidden = false; }
function featureLabel(feature) { return feature.name.replace(/[-_]+/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase()); }
function renderFeatures(features) { for (const feature of features) { const button = document.createElement('button'); button.className = 'feature-button'; button.textContent = featureLabel(feature); button.addEventListener('click', () => selectFeature(feature, button, undefined, 'push')); elements.tree.append(button); } }
let mermaidLoader;
let markdownLoader;
let outlineController;
let navigationVersion = 0;
async function getMarkdownRenderer() { if (!markdownLoader) markdownLoader = Promise.all([import('/vendor/marked.js'), import('/vendor/purify.js')]).then(([{ marked }, { default: DOMPurify }]) => ({ marked, DOMPurify })); return markdownLoader; }
async function getMermaid() { if (!mermaidLoader) mermaidLoader = import('/vendor/mermaid/mermaid.esm.mjs').then(({ default: mermaid }) => { mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' }); return mermaid; }); return mermaidLoader; }

function headingEntries(content) {
  const nodes = [...content.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter((node) => node.textContent.trim());
  const metadata = createHeadingMetadata(nodes.map((node) => ({ text: node.textContent, level: Number(node.tagName.slice(1)) })));
  const idCounts = new Map();
  for (const node of nodes) if (/^[A-Za-z][\w:.-]*$/.test(node.id)) idCounts.set(node.id, (idCounts.get(node.id) || 0) + 1);
  const reserved = new Set([...idCounts].filter(([, count]) => count === 1).map(([id]) => id));
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

function renderReader(file, html, feature) {
  outlineController?.abort();
  const controller = new AbortController(); outlineController = controller;
  const content = document.createElement('div'); content.className = 'reader-content'; content.innerHTML = html;
  const headings = headingEntries(content);
  const entries = headings.filter((entry) => entry.level === 2);
  headings.filter((entry) => entry.level === 1).forEach((entry) => entry.node.remove());
  const header = document.createElement('header'); header.className = 'reader-header';
  const context = document.createElement('div'); context.className = 'reader-context';
  const title = document.createElement('p'); title.className = 'reader-title'; title.textContent = featureLabel(feature);
  context.append(title); header.append(context);
  const tabs = document.createElement('nav'); tabs.className = 'reader-tabs'; tabs.setAttribute('aria-label', 'Specification documents');
  const artifactOrder = ['explore.md', 'spec.md', 'task.md'];
  const artifacts = [...feature.files].sort((a, b) => { const aIndex = artifactOrder.indexOf(a.relativePath.split('/').pop()); const bIndex = artifactOrder.indexOf(b.relativePath.split('/').pop()); return (aIndex < 0 ? artifactOrder.length : aIndex) - (bIndex < 0 ? artifactOrder.length : bIndex) || a.relativePath.localeCompare(b.relativePath); });
  for (const artifact of artifacts) { const tab = document.createElement('button'); tab.type = 'button'; tab.textContent = ({ 'explore.md': 'Explore', 'spec.md': 'Spec', 'task.md': 'Tasks' })[artifact.relativePath.split('/').pop()] || artifact.relativePath.split('/').pop().replace(/\.md$/, ''); if (artifact === file) tab.setAttribute('aria-current', 'page'); tab.addEventListener('click', () => selectFile(artifact, null, feature, 'push')); tabs.append(tab); }
  header.append(tabs);
  const layout = document.createElement('div'); layout.className = 'reader-layout'; layout.append(content);
  if (entries.length) {
    const toggle = document.createElement('button'); toggle.className = 'outline-toggle'; toggle.type = 'button'; toggle.textContent = 'On this page';
    const panel = document.createElement('nav'); panel.className = 'outline-panel'; panel.id = 'reader-outline'; panel.setAttribute('aria-label', 'On this page');
    const label = document.createElement('p'); label.className = 'outline-title'; label.textContent = 'On this page';
    toggle.setAttribute('aria-controls', panel.id);
    const list = document.createElement('ol'); list.className = 'outline-list';
    const compactQuery = window.matchMedia('(max-width:960px)'); let compact = compactQuery.matches;
    const setOpen = (open, restoreFocus = false) => { if (!compact) return; panel.hidden = !open; toggle.setAttribute('aria-expanded', String(open)); if (restoreFocus) toggle.focus(); };
    const outlineLinks = new Map();
    const setCurrent = (current) => { for (const [entry, link] of outlineLinks) { if (entry === current) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); } };
    for (const entry of entries) { const item = document.createElement('li'); item.style.setProperty('--heading-level', entry.level); const link = document.createElement('button'); link.type = 'button'; link.textContent = entry.text; outlineLinks.set(entry, link); link.addEventListener('click', () => { setCurrent(entry); setOpen(false); entry.node.focus({ preventScroll: true }); entry.node.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); }); item.append(link); list.append(item); }
    panel.append(label, list); header.append(toggle); layout.append(panel);
    const observer = new IntersectionObserver((changes) => { const visible = changes.filter((change) => change.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top); if (visible.length) setCurrent(entries.find((entry) => entry.node === visible[0].target)); }, { root: elements.reader, rootMargin: '-160px 0px -55% 0px', threshold: 0 });
    entries.forEach((entry) => observer.observe(entry.node));
    controller.signal.addEventListener('abort', () => observer.disconnect(), { once: true });
    setCurrent(entries[0]);
    const syncOutline = () => { compact = compactQuery.matches; toggle.hidden = !compact; panel.hidden = compact; toggle.setAttribute('aria-expanded', String(!compact)); };
    syncOutline(); compactQuery.addEventListener('change', syncOutline, { signal: controller.signal });
    toggle.addEventListener('click', () => setOpen(panel.hidden));
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && compact && !panel.hidden) { event.preventDefault(); setOpen(false, true); } }, { signal: controller.signal });
    document.addEventListener('pointerdown', (event) => { if (compact && !panel.hidden && !panel.contains(event.target) && !toggle.contains(event.target)) setOpen(false); }, { signal: controller.signal });
  }
  elements.reader.replaceChildren(header, layout);
  return content;
}

async function selectFile(file, button, feature, navigation = 'none') { const version = ++navigationVersion; try { button?.setAttribute('aria-current', 'page'); if (navigation === 'push') history.pushState({}, '', routeFor(feature, file)); const source = await file.readText(); const { marked, DOMPurify } = await getMarkdownRenderer(); if (version !== navigationVersion) return; const content = renderReader(file, DOMPurify.sanitize(marked.parse(source)), feature); const blocks = [...content.querySelectorAll('pre code.language-mermaid')]; await Promise.all(blocks.map(async (block, index) => { const target = document.createElement('div'); try { const { svg } = await (await getMermaid()).render(`mermaid-${index}`, block.textContent); target.innerHTML = svg; block.parentElement.replaceWith(target); } catch { target.textContent = 'This Mermaid diagram could not be rendered.'; block.parentElement.replaceWith(target); } })); if (version === navigationVersion) elements.status.textContent = `Opened ${file.relativePath.split('/').pop().replace(/\.md$/, '')} for ${featureLabel(feature)}.`; } catch { if (version === navigationVersion) { outlineController?.abort(); elements.reader.textContent = 'Unable to read this Markdown file.'; } } }
async function selectFeature(feature, button, file = defaultFile(feature.files), navigation = 'none') { document.querySelectorAll('.feature-button').forEach((item) => item.removeAttribute('aria-current')); button?.setAttribute('aria-current', 'page'); await selectFile(file, null, feature, navigation); }
let loadedFiles = [];
async function load(files, route = parseRoute(window.location.pathname), navigation = 'push') { if (!files.length) { showMessage('No Markdown files were found in specs.', true); return; } loadedFiles = files; const features = buildFeatures(files); elements.tree.replaceChildren(); renderFeatures(features); showWorkspace(); const match = resolveRoute(features, route); if (route && !match) { elements.reader.textContent = 'This specification document was not found. Choose another specification or open a project folder.'; return; } const first = match?.feature || features.find((feature) => feature.files.some((file) => file.relativePath.split('/').pop() === 'spec.md')) || features[0]; const file = match?.file || defaultFile(first.files); const button = [...elements.tree.querySelectorAll('.feature-button')].find((item) => item.textContent === featureLabel(first)); await selectFeature(first, button, file, match ? 'none' : navigation); }
async function loadHandle(handle, remember = true, route) { const files = await filesFromDirectory(handle); if (remember) await saveHistory({ name: handle.name, handle }); await load(files, remember ? null : route, remember ? 'push' : 'none'); }
async function renderHistory() { try { const entries = await readHistory(); elements.recentList.replaceChildren(); for (const entry of entries) { const card = document.createElement('button'); card.className = 'recent-card'; card.textContent = entry.name; card.addEventListener('click', async () => { try { if ((await entry.handle.queryPermission({ mode: 'read' })) !== 'granted' && (await entry.handle.requestPermission({ mode: 'read' })) !== 'granted') throw new Error('Folder permission was not granted.'); await loadHandle(entry.handle); } catch (error) { showMessage(error.message, true); } }); elements.recentList.append(card); } elements.recent.hidden = !entries.length; } catch { elements.recent.hidden = true; } }

elements.choose.addEventListener('click', async () => {
  if ('showDirectoryPicker' in window) { try { await loadHandle(await window.showDirectoryPicker()); } catch (error) { if (error.name !== 'AbortError') showMessage(error.message, true); } return; }
  elements.input.click();
});
elements.input.addEventListener('change', async () => { try { await load(filesFromInput(elements.input.files), null, 'push'); } catch (error) { showMessage(error.message, true); } });
renderHistory();
window.addEventListener('popstate', () => { if (loadedFiles.length) load(loadedFiles, parseRoute(window.location.pathname), 'none'); });
const initialRoute = parseRoute(window.location.pathname);
if (initialRoute) {
  readMostRecent().then(async (entry) => {
    if (!entry || (await entry.handle.queryPermission({ mode: 'read' })) !== 'granted') {
      showMessage('Reconnect the project folder to open this specification.', true);
      return;
    }
    await loadHandle(entry.handle, false, initialRoute);
  }).catch(() => showMessage('Reconnect the project folder to open this specification.', true));
}
