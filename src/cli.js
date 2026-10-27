import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { PLAN_SECTIONS, PLAN_SECTION_FORMATS, SPEC_SECTIONS, SPEC_SECTION_FORMATS, featureDir, hasCurrentSpecSchema, installSkills, parseTasks, reconcilePlanTasks, reconcileTasks, reviewDesign, reviewPlan, reviewPlanCoverage, reviewSpec, validateDesign, validatePlan, validateSpec, writeSpecAndPlan } from './core.js';
import { defaultBrowserOpener, startViewerServer } from './server.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

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

async function askSections(sections, formats, label) {
  const rl = readline.createInterface({ input, output });
  const answers = {};
  try {
    for (const [title, prompt] of sections) {
      output.write(`\n## ${label}: ${title}\n${prompt}\nFormat: ${formats[title]}\n`);
      answers[title] = await rl.question('Answer (use the requested labels, bullets, or numbered steps): ');
      if (!answers[title].trim()) answers[title] = '_Not specified yet._';
    }
  } finally { rl.close(); }
  return answers;
}

async function askSpecAndPlan() {
  output.write('\nHigh-level design: what to build and why.\n');
  const spec = await askSections(SPEC_SECTIONS, SPEC_SECTION_FORMATS, 'Spec');
  output.write('\nLow-level design: how to build it.\n');
  const plan = await askSections(PLAN_SECTIONS, PLAN_SECTION_FORMATS, 'Plan');
  return { spec, plan };
}

async function readSpecAndPlanAnswersFile(file) {
  const answers = JSON.parse(await fs.readFile(file, 'utf8'));
  const spec = answers.spec && typeof answers.spec === 'object' ? answers.spec : {};
  const plan = answers.plan && typeof answers.plan === 'object' ? answers.plan : {};
  for (const [title] of SPEC_SECTIONS) if (typeof spec[title] !== 'string') spec[title] = '_Not specified yet._';
  for (const [title] of PLAN_SECTIONS) if (typeof plan[title] !== 'string') plan[title] = '_Not specified yet._';
  return { spec, plan };
}

function rootFrom(cwd) { return path.resolve(cwd || process.cwd()); }

export async function main(args, cwd = process.cwd(), { startServer = startViewerServer, openBrowser = defaultBrowserOpener } = {}) {
  const [command, feature, ...options] = args;
  const root = rootFrom(cwd);
  if (command === '--version' || command === '-v' || command === 'version') {
    console.log(version);
    return;
  }
  if (!command || command === 'help' || command === '--help') {
    console.log('Usage: msdd <init|explore|spec|review|build|serve> [<feature>] [options]');
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
    if (answersPathIndex >= 0) {
      JSON.parse(await fs.readFile(path.resolve(root, options[answersPathIndex + 1]), 'utf8'));
    } else {
      await askExploration();
    }
    console.log(`Exploration complete for ${feature}; no file was created.`);
    return;
  }
  if (command === 'serve') {
    const viewer = await startServer();
    console.log(`Spec viewer running at ${viewer.url}`);
    try { openBrowser(viewer.url); } catch (error) { console.warn(`Could not open the default browser: ${error.message}\nOpen ${viewer.url} manually.`); }
    return viewer;
  }
  if (!feature) throw new Error(`${command} requires a feature name`);
  const dir = featureDir(root, feature);
  if (command === 'review') {
    const design = await fs.readFile(path.join(dir, 'spec.md'), 'utf8');
    let findings;
    if (hasCurrentSpecSchema(design)) {
      findings = reviewSpec(design);
      let plan = '';
      try { plan = await fs.readFile(path.join(dir, 'plan.md'), 'utf8'); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
      if (!plan) findings.push({ severity: 'error', section: 'plan.md', message: 'Missing plan.md; run `msdd spec "<feature>"` to create the design artifacts' });
      else findings.push(...reviewPlan(plan), ...reviewPlanCoverage(design, plan));
    } else {
      findings = reviewDesign(design);
    }
    if (!findings.length) { console.log('Review passed: no structural or technical completeness gaps found.'); return; }
    for (const finding of findings) console.log(`${finding.severity.toUpperCase()} [${finding.section}]: ${finding.message}`);
    if (findings.some((finding) => finding.severity === 'error')) process.exitCode = 1;
    return;
  }
  if (command === 'spec') {
    const answersPathIndex = options.indexOf('--answers-file');
    const answers = answersPathIndex >= 0
      ? await readSpecAndPlanAnswersFile(path.resolve(root, options[answersPathIndex + 1]))
      : await askSpecAndPlan();
    console.log(`Spec and plan saved to ${path.relative(root, await writeSpecAndPlan(root, feature, answers.spec, answers.plan))}`);
    return;
  }
  if (command === 'build') {
    const design = await fs.readFile(path.join(dir, 'spec.md'), 'utf8');
    const currentFormat = hasCurrentSpecSchema(design);
    const taskPath = path.join(dir, 'task.md');
    let existing = '';
    try { existing = await fs.readFile(taskPath, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    let reconciled;
    if (currentFormat) {
      const planPath = path.join(dir, 'plan.md');
      let plan;
      try { plan = await fs.readFile(planPath, 'utf8'); }
      catch (error) { if (error.code === 'ENOENT') throw new Error(`Plan is missing: ${path.relative(root, planPath)}; run \`msdd spec "${feature}"\` to create it`); throw error; }
      const errors = [
        ...validateSpec(design).map((error) => `spec.md: ${error}`),
        ...validatePlan(plan).map((error) => `plan.md: ${error}`),
        ...reviewPlanCoverage(design, plan).map((finding) => `plan.md: ${finding.message}`)
      ];
      if (errors.length) throw new Error(`Design is invalid:\n${errors.map((error) => `- ${error}`).join('\n')}`);
      reconciled = reconcilePlanTasks(plan, existing);
    } else {
      const errors = validateDesign(design);
      if (errors.length) throw new Error(`Spec is invalid:\n${errors.map((error) => `- ${error}`).join('\n')}`);
      reconciled = reconcileTasks(design, existing);
    }
    if (reconciled !== existing) await fs.writeFile(taskPath, reconciled);
    const nextTask = parseTasks(reconciled).find((task) => !task.checked);
    if (!nextTask) {
      console.log('Build complete: all tasks are marked done.');
      return;
    }
    console.log(`Next task: [ ] ${nextTask.id}: ${nextTask.text}`);
    console.log(currentFormat
      ? `Implement this task from plan.md, use spec.md for expected behavior and acceptance criteria, mark ${nextTask.id} as [x], then run build again.`
      : `Implement only this task from spec.md, mark ${nextTask.id} as [x], then run build again.`);
    return;
  }
  throw new Error(`Unknown command: ${command}; use init, explore, spec, review, build, or serve`);
}
