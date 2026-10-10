import { buildTree, defaultFile, filesFromDirectory, filesFromInput } from './tree.js';
import { readHistory, saveHistory } from './history.js';
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
async function getMarkdownRenderer() { if (!markdownLoader) markdownLoader = Promise.all([import('/vendor/marked.js'), import('/vendor/purify.js')]).then(([{ marked }, { default: DOMPurify }]) => ({ marked, DOMPurify })); return markdownLoader; }
async function getMermaid() { if (!mermaidLoader) mermaidLoader = import('/vendor/mermaid/mermaid.esm.mjs').then(({ default: mermaid }) => { mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' }); return mermaid; }); return mermaidLoader; }
async function selectFile(file, button) { try { document.querySelectorAll('.tree-button').forEach((item) => item.removeAttribute('aria-current')); button?.setAttribute('aria-current', 'page'); const source = await file.readText(); const { marked, DOMPurify } = await getMarkdownRenderer(); const html = DOMPurify.sanitize(marked.parse(source)); elements.reader.innerHTML = html; const blocks = [...elements.reader.querySelectorAll('pre code.language-mermaid')]; await Promise.all(blocks.map(async (block, index) => { const target = document.createElement('div'); try { const { svg } = await (await getMermaid()).render(`mermaid-${index}`, block.textContent); target.innerHTML = svg; block.parentElement.replaceWith(target); } catch { target.textContent = 'This Mermaid diagram could not be rendered.'; block.parentElement.replaceWith(target); } })); } catch { elements.reader.textContent = 'Unable to read this Markdown file.'; } }
async function load(files) { if (!files.length) { showMessage('No Markdown files were found in specs.', true); return; } elements.tree.replaceChildren(); renderTree(buildTree(files), elements.tree); showWorkspace(); const first = defaultFile(files); const button = [...elements.tree.querySelectorAll('.tree-button')].find((item) => item.textContent === first.relativePath.split('/').pop()); await selectFile(first, button); }
async function loadHandle(handle, remember = true) { const files = await filesFromDirectory(handle); if (remember) await saveHistory({ name: handle.name, handle }); await load(files); }
async function renderHistory() { try { const entries = await readHistory(); elements.recentList.replaceChildren(); for (const entry of entries) { const card = document.createElement('button'); card.className = 'recent-card'; card.textContent = entry.name; card.addEventListener('click', async () => { try { if ((await entry.handle.queryPermission({ mode: 'read' })) !== 'granted' && (await entry.handle.requestPermission({ mode: 'read' })) !== 'granted') throw new Error('Folder permission was not granted.'); await loadHandle(entry.handle); } catch (error) { showMessage(error.message, true); } }); elements.recentList.append(card); } elements.recent.hidden = !entries.length; } catch { elements.recent.hidden = true; } }

elements.choose.addEventListener('click', async () => {
  if ('showDirectoryPicker' in window) { try { await loadHandle(await window.showDirectoryPicker()); } catch (error) { if (error.name !== 'AbortError') showMessage(error.message, true); } return; }
  elements.input.click();
});
elements.input.addEventListener('change', async () => { try { await load(filesFromInput(elements.input.files)); } catch (error) { showMessage(error.message, true); } });
renderHistory();
