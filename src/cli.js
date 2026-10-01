import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { SECTIONS, SECTION_FORMATS, featureDir, installSkills, parseTasks, reconcileTasks, reviewDesign, validateDesign, writeExploration, writeFeature } from './core.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

async function askInterview() {
  const rl = readline.createInterface({ input, output });
  const answers = {};
  try {
    for (const [title, prompt] of SECTIONS) {
      output.write(`\n## ${title}\n${prompt}\nFormat: ${SECTION_FORMATS[title]}\n`);
      answers[title] = await rl.question('Answer (use the requested labels, bullets, or numbered steps): ');
      if (!answers[title].trim()) answers[title] = '_Not specified yet._';
    }
  } finally { rl.close(); }
  return answers;
}

async function askExploration() {
  const rl = readline.createInterface({ input, output });
  const answers = {};
  const prompts = [
    ['context', 'What are we trying to build or change, and why?'],
    ['analysis', 'What codebase areas, patterns, dependencies, and constraints should be investigated?'],
    ['recommendations', 'What implementation approaches do you recommend, and what trade-offs do they have?'],
    ['questions', 'What questions, ambiguities, contradictions, or risks must the user answer?'],
    ['decisions', 'Which assumptions or recommendations has the user explicitly confirmed?']
  ];
  try {
    for (const [key, prompt] of prompts) {
      output.write(`\n${prompt}\n`);
      answers[key] = await rl.question('Notes: ');
      if (!answers[key].trim()) answers[key] = '_Not specified yet._';
    }
  } finally { rl.close(); }
  return answers;
}

async function readAnswersFile(file) {
  const answers = JSON.parse(await fs.readFile(file, 'utf8'));
  for (const [title] of SECTIONS) if (typeof answers[title] !== 'string') answers[title] = '_Not specified yet._';
  return answers;
}

function rootFrom(cwd) { return path.resolve(cwd || process.cwd()); }

export async function main(args, cwd = process.cwd()) {
  const [command, feature, ...options] = args;
  const root = rootFrom(cwd);
  if (command === '--version' || command === '-v' || command === 'version') {
    console.log(version);
    return;
  }
  if (!command || command === 'help' || command === '--help') {
    console.log('Usage: msdd <init|explore|spec|review|build> [<feature>] [options]');
    return;
  }
  if (command === 'init') {
    const installed = await installSkills(root, { force: feature === '--force' || options.includes('--force') });
    console.log(`Installed msdd skills in ${root}`);
    for (const file of installed) console.log(`- ${file}`);
    return;
  }
  if (command === 'explore') {
    if (!feature) throw new Error('explore requires a feature name');
    const answersPathIndex = options.indexOf('--answers-file');
    const answers = answersPathIndex >= 0
      ? JSON.parse(await fs.readFile(path.resolve(root, options[answersPathIndex + 1]), 'utf8'))
      : await askExploration();
    console.log(`Exploration saved to ${path.relative(root, await writeExploration(root, feature, answers))}`);
    return;
  }
  if (!feature) throw new Error(`${command} requires a feature name`);
  const dir = featureDir(root, feature);
  if (command === 'review') {
    const design = await fs.readFile(path.join(dir, 'spec.md'), 'utf8');
    const findings = reviewDesign(design);
    if (!findings.length) { console.log('Review passed: no structural or technical completeness gaps found.'); return; }
    for (const finding of findings) console.log(`${finding.severity.toUpperCase()} [${finding.section}]: ${finding.message}`);
    if (findings.some((finding) => finding.severity === 'error')) process.exitCode = 1;
    return;
  }
  if (command === 'spec') {
    try { await fs.access(path.join(dir, 'explore.md')); } catch { throw new Error(`No exploration found for ${feature}; run \`msdd explore "${feature}"\` first`); }
    const answersPathIndex = options.indexOf('--answers-file');
    const answers = answersPathIndex >= 0
      ? await readAnswersFile(path.resolve(root, options[answersPathIndex + 1]))
      : await askInterview();
    console.log(`Spec saved to ${path.relative(root, await writeFeature(root, feature, answers))}`);
    return;
  }
  if (command === 'build') {
    const design = await fs.readFile(path.join(dir, 'spec.md'), 'utf8');
    const taskPath = path.join(dir, 'task.md');
    let existing = '';
    try { existing = await fs.readFile(taskPath, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    const errors = validateDesign(design);
    if (errors.length) throw new Error(`Spec is invalid:\n${errors.map((error) => `- ${error}`).join('\n')}`);
    const reconciled = reconcileTasks(design, existing);
    if (reconciled !== existing) await fs.writeFile(taskPath, reconciled);
    const nextTask = parseTasks(reconciled).find((task) => !task.checked);
    if (!nextTask) {
      console.log('Build complete: all tasks are marked done.');
      return;
    }
    console.log(`Next task: [ ] ${nextTask.id}: ${nextTask.text}`);
    console.log(`Implement only this task from spec.md, mark ${nextTask.id} as [x], then run build again.`);
    return;
  }
  throw new Error(`Unknown command: ${command}; use init, explore, spec, or build`);
}
