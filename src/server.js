import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceRoot = path.dirname(fileURLToPath(import.meta.url));
const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'], ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'], ['.mjs', 'text/javascript; charset=utf-8']
]);

export const defaultBrowserOpener = (url, platform = process.platform) => {
  const command = platform === 'darwin' ? 'open' : platform === 'win32' ? 'cmd' : 'xdg-open';
  const args = platform === 'win32' ? ['/c', 'start', '', url] : [url];
  const child = spawn(command, args, { detached: true, stdio: 'ignore' });
  child.unref();
  return child;
};

export function viewerRoutes(root = sourceRoot) {
  return new Map([
    ['/', path.join(root, 'viewer', 'index.html')],
    ['/app.js', path.join(root, 'viewer', 'app.js')],
    ['/tree.js', path.join(root, 'viewer', 'tree.js')],
    ['/history.js', path.join(root, 'viewer', 'history.js')],
    ['/styles.css', path.join(root, 'viewer', 'styles.css')],
    ['/vendor/marked.js', path.join(root, '..', 'node_modules', 'marked', 'lib', 'marked.esm.js')],
    ['/vendor/purify.js', path.join(root, '..', 'node_modules', 'dompurify', 'dist', 'purify.es.mjs')],
    ['/vendor/mermaid.js', path.join(root, '..', 'node_modules', 'mermaid', 'dist', 'mermaid.esm.mjs')]
  ]);
}

export function createStaticServer({ root = sourceRoot } = {}) {
  const routes = viewerRoutes(root);
  return createServer(async (request, response) => {
    const pathname = new URL(request.url || '/', 'http://127.0.0.1').pathname;
    const mermaidPrefix = '/vendor/mermaid/';
    const requestedMermaid = pathname.startsWith(mermaidPrefix) ? path.resolve(root, '..', 'node_modules', 'mermaid', 'dist', pathname.slice(mermaidPrefix.length)) : null;
    const mermaidRoot = path.resolve(root, '..', 'node_modules', 'mermaid', 'dist');
    const file = routes.get(pathname) || (requestedMermaid?.startsWith(`${mermaidRoot}${path.sep}`) ? requestedMermaid : null);
    if (!file || request.method !== 'GET') {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }
    try {
      const body = await fs.readFile(file);
      response.writeHead(200, {
        'Content-Type': contentTypes.get(path.extname(file)) || 'application/octet-stream',
        'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'
      });
      response.end(body);
    } catch {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
    }
  });
}

function listen(server, port, host) {
  return new Promise((resolve, reject) => {
    const onError = (error) => { server.off('listening', onListening); reject(error); };
    const onListening = () => { server.off('error', onError); resolve(); };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, host);
  });
}

export async function startViewerServer({ root = sourceRoot, host = '127.0.0.1', startPort = 5634, maxPortAttempts = 100 } = {}) {
  let lastError;
  for (let offset = 0; offset < maxPortAttempts; offset += 1) {
    const server = createStaticServer({ root });
    const port = startPort + offset;
    try {
      await listen(server, port, host);
      return { server, port, url: `http://${host}:${port}` };
    } catch (error) {
      lastError = error;
      server.close();
      if (error.code !== 'EADDRINUSE') throw error;
    }
  }
  throw new Error(`No available port in range ${startPort}-${startPort + maxPortAttempts - 1}: ${lastError?.message || 'port unavailable'}`);
}
