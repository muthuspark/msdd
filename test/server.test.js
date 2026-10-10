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
  const response = await fetch(`http://127.0.0.1:${port}/../../package.json`);
  assert.equal(response.status, 404);
  const homepage = await fetch(`http://127.0.0.1:${port}/`);
  assert.equal(homepage.status, 200);
  assert.match(await homepage.text(), /Choose project folder/);
  assert.equal((await fetch(`http://127.0.0.1:${port}/headings.js`)).status, 200);
  assert.equal((await fetch(`http://127.0.0.1:${port}/tree.js`)).status, 200);
  await new Promise((resolve) => server.close(resolve));
});

test('uses platform browser opener commands without a shell', () => {
  assert.doesNotThrow(() => { const child = defaultBrowserOpener('http://127.0.0.1:1', 'linux'); child.kill(); });
});
