import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { validateRelease } from '../scripts/release-check.js';

const fixture = () => ({
  event: { repository: { full_name: 'muthuspark/msdd' }, release: { tag_name: 'v1.2.3', draft: false, prerelease: false } },
  packageJson: { name: 'msdd-it', version: '1.2.3' },
  lockfile: { name: 'msdd-it', version: '1.2.3', packages: { '': { name: 'msdd-it', version: '1.2.3' } } },
  npmVersion: '11.5.1'
});

for (const npmVersion of ['11.5.1', '11.5.2', '11.6.0', '12.0.0']) {
  test(`accepts matching stable release with npm ${npmVersion}`, () => {
    assert.equal(validateRelease({ ...fixture(), npmVersion }), '1.2.3');
  });
}

const invalidCases = [
  ['wrong repository', (f) => { f.event.repository.full_name = 'fork/msdd'; }, /repository.full_name/],
  ['missing event', (f) => { f.event = null; }, /repository.full_name/],
  ['missing release', (f) => { delete f.event.release; }, /release must exist/],
  ['draft', (f) => { f.event.release.draft = true; }, /draft: false/],
  ['prerelease', (f) => { f.event.release.prerelease = true; }, /prerelease: false/],
  ['missing stable flag', (f) => { delete f.event.release.prerelease; }, /prerelease: false/],
  ['wrong package name', (f) => { f.packageJson.name = 'msdd'; }, /package.json name/],
  ['missing package', (f) => { f.packageJson = null; }, /package.json name/],
  ['wrong tag', (f) => { f.event.release.tag_name = 'v1.2.4'; }, /tag_name must be v1.2.3/],
  ['tag without prefix', (f) => { f.event.release.tag_name = '1.2.3'; }, /tag_name/],
  ['missing tag', (f) => { delete f.event.release.tag_name; }, /tag_name/],
  ['shell text in tag', (f) => { f.event.release.tag_name = '$(touch should-not-exist)'; }, /tag_name/],
  ['lock version', (f) => { f.lockfile.version = '1.2.4'; }, /package-lock.json name\/version/],
  ['lock name', (f) => { f.lockfile.name = 'other'; }, /package-lock.json name\/version/],
  ['root lock version', (f) => { f.lockfile.packages[''].version = '1.2.4'; }, /packages\[""\]/],
  ['root lock name', (f) => { f.lockfile.packages[''].name = 'other'; }, /packages\[""\]/],
  ['missing lock root', (f) => { delete f.lockfile.packages; }, /packages\[""\]/],
  ['missing lock', (f) => { f.lockfile = null; }, /package-lock.json/]
];
for (const version of ['01.2.3', '1.02.3', '1.2.03', '1.2.3-beta.1', '1.2.3+build', '1.2', '', 123]) {
  invalidCases.push([`invalid package version ${version}`, (f) => { f.packageJson.version = version; }, /stable X.Y.Z/]);
}
for (const version of ['10.9.2', '11.0.9', '11.4.99', '11.5.0']) {
  invalidCases.push([`old npm ${version}`, (f) => { f.npmVersion = version; }, /requires npm >=11.5.1/]);
}
for (const version of ['11.5.1-beta.1', 'v11.5.1', '011.5.1', '11.5', '', null]) {
  invalidCases.push([`invalid npm ${version}`, (f) => { f.npmVersion = version; }, /npm version must be/]);
}
for (const [name, mutate, error] of invalidCases) {
  test(`rejects ${name}`, () => {
    const input = fixture();
    mutate(input);
    assert.throws(() => validateRelease(input), error);
  });
}

test('CLI validates files and reports failures without installing or publishing', async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'msdd-release-check-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const f = fixture();
  const eventPath = path.join(dir, 'event.json');
  await Promise.all([
    fs.writeFile(eventPath, JSON.stringify(f.event)),
    fs.writeFile(path.join(dir, 'package.json'), JSON.stringify(f.packageJson)),
    fs.writeFile(path.join(dir, 'package-lock.json'), JSON.stringify(f.lockfile)),
    fs.writeFile(path.join(dir, 'npm'), '#!/bin/sh\n[ "$#" -eq 1 ] && [ "$1" = "--version" ] || exit 99\nprintf "%s\\n" "${TEST_NPM_VERSION:-11.5.1}"\n', { mode: 0o755 })
  ]);
  const script = fileURLToPath(new URL('../scripts/release-check.js', import.meta.url));
  const run = (overrides = {}) => spawnSync(process.execPath, [script], {
    cwd: dir, encoding: 'utf8',
    env: { PATH: dir, GITHUB_EVENT_PATH: eventPath, ...overrides }
  });
  const valid = run();
  assert.equal(valid.status, 0, valid.stderr);
  assert.match(valid.stdout, /Node v\d+/);
  assert.match(valid.stdout, /npm 11.5.1/);
  assert.match(valid.stdout, /Validated release v1.2.3/);
  for (const [overrides, message] of [
    [{ TEST_NPM_VERSION: '11.5.0' }, /requires npm >=11.5.1/],
    [{ GITHUB_EVENT_PATH: '' }, /GITHUB_EVENT_PATH is required/],
    [{ GITHUB_EVENT_PATH: path.join(dir, 'absent.json') }, /Cannot read JSON.*absent.json/]
  ]) {
    const result = run(overrides);
    assert.equal(result.status, 1);
    assert.match(result.stderr, message);
  }
  f.event.release.tag_name = '$(touch should-not-exist)';
  await fs.writeFile(eventPath, JSON.stringify(f.event));
  const mismatch = run();
  assert.equal(mismatch.status, 1);
  assert.match(mismatch.stderr, /tag_name must be v1.2.3/);
  await assert.rejects(fs.access(path.join(dir, 'should-not-exist')));
  await fs.writeFile(eventPath, '{invalid');
  assert.match(run().stderr, /Cannot read JSON.*event.json/);
  await fs.rm(path.join(dir, 'npm'));
  const noNpm = run();
  assert.equal(noNpm.status, 1);
  assert.match(noNpm.stderr, /Release check failed:.*npm/);
});
