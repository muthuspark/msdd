import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { createStaticServer, defaultBrowserOpener, startViewerServer } from '../src/server.js';

test('uses loopback and advances past an occupied port', async () => {
  const blocker = createServer();
  blocker.listen(0, '127.0.0.1');
  await once(blocker, 'listening');
  const occupied = blocker.address().port;
  const viewer = await startViewerServer({ startPort: occupied, maxPortAttempts: 2 });
  assert.equal(viewer.port, occupied + 1);
  assert.equal(viewer.server.address().address, '127.0.0.1');
  await new Promise((resolve) => viewer.server.close(resolve));
  await new Promise((resolve) => blocker.close(resolve));
});

test('reports a bounded exhausted port range', async () => {
  const blocker = createServer();
  blocker.listen(0, '127.0.0.1');
  await once(blocker, 'listening');
  const port = blocker.address().port;
  await assert.rejects(() => startViewerServer({ startPort: port, maxPortAttempts: 1 }), /No available port/);
  await new Promise((resolve) => blocker.close(resolve));
});

test('allows only known static routes', async () => {
  const server = createStaticServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  const request = async (url, options = {}) => {
    const response = await fetch(url, { ...options, headers: { ...options.headers, connection: 'close' } });
    const body = await response.text();
    return { status: response.status, text: async () => body };
  };
  const response = await request(`http://127.0.0.1:${port}/../../package.json`);
  assert.equal(response.status, 404);
  const homepage = await request(`http://127.0.0.1:${port}/`);
  assert.equal(homepage.status, 200);
  assert.match(await homepage.text(), /Open project folder/);
  const documentRoute = await request(`http://127.0.0.1:${port}/specs/reader/reader%2Fspec.md`);
  assert.equal(documentRoute.status, 200);
  assert.match(await documentRoute.text(), /Open project folder/);
  assert.equal((await request(`http://127.0.0.1:${port}/specs/reader/reader%2Fnotes.txt`)).status, 404);
  assert.equal((await request(`http://127.0.0.1:${port}/specs/reader/reader%2Fspec.md`, { method: 'POST' })).status, 404);
  assert.equal((await request(`http://127.0.0.1:${port}/headings.js`)).status, 200);
  assert.equal((await request(`http://127.0.0.1:${port}/routes.js`)).status, 200);
  assert.equal((await request(`http://127.0.0.1:${port}/tree.js`)).status, 200);
  const app = await request(`http://127.0.0.1:${port}/app.js`);
  for (const [, modulePath] of (await app.text()).matchAll(/from\s+['"](\.\/[^'"]+)['"]/g)) {
    const module = await fetch(new URL(modulePath, `http://127.0.0.1:${port}/app.js`));
    assert.equal(module.status, 200, `App dependency ${modulePath} must be served`);
    assert.match(module.headers.get('content-type'), /text\/javascript/);
    await module.text();
  }
  await new Promise((resolve) => server.close(resolve));
});

test('uses platform browser opener commands without a shell', () => {
  let call;
  let unrefed = false;
  const child = defaultBrowserOpener('http://127.0.0.1:1', 'linux', (...args) => {
    call = args;
    return { unref: () => { unrefed = true; } };
  });
  assert.deepEqual(call, ['xdg-open', ['http://127.0.0.1:1'], { detached: true, stdio: 'ignore' }]);
  assert.equal(unrefed, true);
  assert.equal(typeof child.unref, 'function');
});
