import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const stableVersion = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function validateRelease({ event, packageJson, lockfile, npmVersion }) {
  if (typeof npmVersion !== 'string' || !stableVersion.test(npmVersion)) {
    throw new Error('npm version must be a stable X.Y.Z version (minimum 11.5.1)');
  }
  const [major, minor, patch] = npmVersion.split('.').map(BigInt);
  if (major < 11n || (major === 11n && (minor < 5n || (minor === 5n && patch < 1n)))) {
    throw new Error(`npm ${npmVersion} is too old; trusted publishing requires npm >=11.5.1`);
  }
  if (event?.repository?.full_name !== 'muthuspark/msdd') {
    throw new Error('repository.full_name must be muthuspark/msdd');
  }
  if (!event.release || event.release.draft !== false || event.release.prerelease !== false) {
    throw new Error('release must exist with draft: false and prerelease: false');
  }
  if (packageJson?.name !== 'msdd-it') throw new Error('package.json name must be msdd-it');
  const version = packageJson.version;
  if (typeof version !== 'string' || !stableVersion.test(version)) {
    throw new Error('package.json version must be a stable X.Y.Z version without leading zeros');
  }
  if (event.release.tag_name !== `v${version}`) {
    throw new Error(`release.tag_name must be v${version}`);
  }
  for (const [label, manifest] of [
    ['package-lock.json', lockfile],
    ['package-lock.json packages[""]', lockfile?.packages?.['']]
  ]) {
    if (manifest?.name !== packageJson.name || manifest?.version !== version) {
      throw new Error(`${label} name/version must match package.json (msdd-it@${version})`);
    }
  }
  return version;
}

async function readJson(file) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot read JSON from ${file}: ${error.message}`);
  }
}

async function main() {
  console.log(`Node ${process.version}`);
  const npmVersion = execFileSync('npm', ['--version'], { encoding: 'utf8' }).trim();
  console.log(`npm ${npmVersion}`);
  if (!process.env.GITHUB_EVENT_PATH) throw new Error('GITHUB_EVENT_PATH is required');
  const [event, packageJson, lockfile] = await Promise.all([
    readJson(process.env.GITHUB_EVENT_PATH), readJson('package.json'), readJson('package-lock.json')
  ]);
  const version = validateRelease({ event, packageJson, lockfile, npmVersion });
  console.log(`Validated release v${version} for msdd-it`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`Release check failed: ${error.message}`);
    process.exitCode = 1;
  });
}
