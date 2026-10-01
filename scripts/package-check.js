import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', stdio: 'pipe', ...options });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed\n${result.stdout}\n${result.stderr}`);
  }
  return result;
};

const required = [
  'package/LICENSE', 'package/README.md', 'package/package.json', 'package/bin/msdd.js',
  'package/src/cli.js', 'package/src/core.js', 'package/shared-workflow.md',
  'package/skills/claude-sdd/SKILL.md', 'package/skills/codex-sdd/SKILL.md'
];
const forbidden = ['/test/', '/specs/', 'package/.msdd/', 'package/.codex/', 'package/.claude/'];
const packageJson = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
const packed = JSON.parse(run('npm', ['pack', '--json', '--ignore-scripts']).stdout)[0];
const archive = path.join(root, packed.filename);
try {
  const listing = run('tar', ['-tzf', archive]).stdout.split('\n').filter(Boolean);
  for (const file of required) if (!listing.includes(file)) throw new Error(`Package is missing ${file}`);
  for (const file of listing) if (forbidden.some((part) => file.includes(part))) throw new Error(`Package contains forbidden file ${file}`);

  const smokeDir = await fs.mkdtemp(path.join(os.tmpdir(), 'msdd-package-check-'));
  try {
    run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', archive], { cwd: smokeDir });
    const executable = path.join(smokeDir, 'node_modules', '.bin', 'msdd');
    const version = spawnSync(executable, ['--version'], { cwd: smokeDir, encoding: 'utf8' });
    if (version.status !== 0 || version.stdout.trim() !== packageJson.version) throw new Error(`Packaged CLI returned unexpected version: ${version.stdout}${version.stderr}`);
    run(executable, ['init', '--force'], { cwd: smokeDir });
    for (const file of ['.msdd/shared-workflow.md', '.codex/skills/msdd/SKILL.md', '.claude/skills/msdd/SKILL.md']) {
      await fs.access(path.join(smokeDir, file));
    }
  } finally {
    await fs.rm(smokeDir, { recursive: true, force: true });
  }
  console.log(`Validated ${packed.filename}: ${listing.length} files, version ${packageJson.version}`);
} finally {
  await fs.rm(archive, { force: true });
}
