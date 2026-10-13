import test from 'node:test'; import assert from 'node:assert/strict'; import { compareFiles, createRefreshController, fileSignature } from '../src/viewer/refresh.js';

const file = (relativePath, lastModified, size = 1) => ({ relativePath, lastModified, size });

test('creates stable signatures and detects added, removed, and changed files', () => {
  assert.equal(fileSignature(file('spec.md', 1, 2)), 'spec.md\u00001\u00002');
  const changes = compareFiles([file('old.md', 1), file('spec.md', 1, 2)], [file('spec.md', 2, 3), file('new.md', 1)]);
  assert.deepEqual(changes.added.map(({ relativePath }) => relativePath), ['new.md']);
  assert.deepEqual(changes.removed.map(({ relativePath }) => relativePath), ['old.md']);
  assert.deepEqual(changes.changed.map(({ relativePath }) => relativePath), ['spec.md']);
  assert.equal(changes.hasChanges, true);
});

test('coalesces changes and pauses/resumes on visibility changes', async () => {
  const timers = new Map(); let nextTimer = 1; const events = new EventTarget();
  const documentObject = { hidden: false, addEventListener: (...args) => events.addEventListener(...args), removeEventListener: (...args) => events.removeEventListener(...args) };
  const setIntervalFn = (callback) => { const id = nextTimer++; timers.set(id, { kind: 'interval', callback }); return id; };
  const clearIntervalFn = (id) => timers.delete(id);
  const setTimeoutFn = (callback) => { const id = nextTimer++; timers.set(id, { kind: 'timeout', callback }); return id; };
  const clearTimeoutFn = (id) => timers.delete(id);
  const run = (kind) => Promise.all([...timers].filter(([, timer]) => timer.kind === kind).map(async ([id, timer]) => { if (kind === 'timeout') timers.delete(id); await timer.callback(); }));
  let files = [file('spec.md', 1)]; const updates = [];
  const controller = createRefreshController({ scan: async () => files, onChange: (event) => updates.push(event), documentObject, setIntervalFn, clearIntervalFn, setTimeoutFn, clearTimeoutFn });
  controller.start(files); await Promise.resolve(); assert.equal(timers.size, 1);
  files = [file('spec.md', 2)]; await run('interval'); await run('timeout');
  assert.equal(updates.length, 1); assert.equal(updates[0].files[0].lastModified, 2);
  documentObject.hidden = true; events.dispatchEvent(new Event('visibilitychange')); assert.equal(timers.size, 0);
  documentObject.hidden = false; events.dispatchEvent(new Event('visibilitychange')); assert.equal(timers.size, 1);
  controller.stop(); assert.equal(timers.size, 0);
});

test('reports transient scan failures and recovers on a later scan', async () => {
  const timers = new Map(); let nextTimer = 1; let attempts = 0; const errors = []; const updates = [];
  const documentObject = { hidden: false, addEventListener() {}, removeEventListener() {} };
  const setIntervalFn = (callback) => { const id = nextTimer++; timers.set(id, callback); return id; };
  const clearIntervalFn = (id) => timers.delete(id);
  const setTimeoutFn = (callback) => { const id = nextTimer++; timers.set(id, callback); return id; };
  const clearTimeoutFn = (id) => timers.delete(id);
  const controller = createRefreshController({
    scan: async () => { attempts += 1; if (attempts === 1) throw new Error('temporary'); return [file('spec.md', 2)]; },
    onChange: (event) => updates.push(event), onError: (error) => errors.push(error.message), documentObject,
    setIntervalFn, clearIntervalFn, setTimeoutFn, clearTimeoutFn
  });
  controller.start([file('spec.md', 1)]); await Promise.resolve();
  assert.deepEqual(errors, ['temporary']);
  const interval = [...timers.values()][0]; await interval();
  const timeout = [...timers.values()].at(-1); await timeout();
  assert.equal(updates.length, 1); assert.equal(updates[0].files[0].lastModified, 2);
  controller.stop();
});
