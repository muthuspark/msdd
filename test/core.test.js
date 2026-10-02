import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { deriveTasks, installSkills, reconcileTasks, reviewDesign, slugify, validateDesign, validateTasks, renderDesign, renderExploration, writeExploration, writeFeature, SECTIONS } from '../src/core.js';
import { main } from '../src/cli.js';

const answers = Object.fromEntries(SECTIONS.map(([title]) => [title, `- Details for ${title}.`]));
answers.Requirements = '- REQ-001: The system supports the requested behavior.';
answers['Acceptance Criteria'] = '- AC-001: The requested behavior is observable and verified by a test.';
answers['Decisions and Constraints'] = '- Confirmed: use the existing architecture.\n- Assumptions: the current runtime remains supported.\n- Constraints: preserve compatibility.\n- Open questions: none.';
answers['Implementation Plan'] = '1. Implement the requested behavior.';
answers['Verification and Implementation Notes'] = '- Test: run the unit test suite and record expected evidence.';

test('slugifies readable feature names safely', () => assert.equal(slugify('OAuth 2.0 / Login'), 'oauth-2-0-login'));

test('renders and validates the thirteen-section design including output artifacts', () => {
  const design = renderDesign('Login', answers);
  assert.equal(validateDesign(design).length, 0);
  assert.equal(design.match(/^## /gm).length, 13);
  assert.match(design, /## Explanation and Output Artifacts/);
});

test('derives deduplicated actionable tasks', () => {
  const design = renderDesign('Login', { ...answers, 'Implementation Plan': '- Add sessions\n- Add sessions' });
  const tasks = deriveTasks(design);
  assert.equal(tasks.filter((task) => /sessions/i.test(task.text)).length, 1);
});

test('does not turn recorded verification evidence into a new task', () => {
  const design = renderDesign('Login', {
    ...answers,
    'Verification and Implementation Notes': '- Test: run the unit test suite.\n- Evidence: unit test suite passed.'
  });
  assert.equal(deriveTasks(design).filter((task) => /evidence/i.test(task.text)).length, 0);
});

test('reconciliation preserves checked unchanged tasks and resets changed tasks', () => {
  const first = renderDesign('Login', { ...answers, 'Implementation Plan': '- Add sessions.' });
  const old = reconcileTasks(first).replace('- [ ] T1:', '- [x] T1:');
  const same = reconcileTasks(first, old);
  assert.match(same, /- \[x\] T1:/);
  const changed = renderDesign('Login', { ...answers, 'Implementation Plan': '- Add encrypted sessions.' });
  const next = reconcileTasks(changed, same);
  assert.match(next, /- \[ \] T\d+: Add encrypted sessions\./);
});

test('detects stale task files', () => {
  const design = renderDesign('Login', answers);
  assert.ok(validateTasks(design, '- [ ] T1: unrelated\n').some((error) => /out of date/.test(error)));
});

test('reviews prose-only specs and reports technical gaps', () => {
  const design = renderDesign('Login', { ...answers, Requirements: 'The system should support sessions.' });
  const findings = reviewDesign(design);
  assert.ok(findings.some((finding) => /prose-only/.test(finding.message)));
  assert.ok(findings.some((finding) => /REQ-/.test(finding.message)));
});

test('installs both adapters into a project without a shared workflow file', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'msdd-init-'));
  const installed = await installSkills(root);
  assert.deepEqual(installed, [
    '.codex/skills/msdd-explore/SKILL.md', '.codex/skills/msdd-spec/SKILL.md',
    '.codex/skills/msdd-build/SKILL.md', '.claude/skills/msdd/SKILL.md',
    '.claude/commands/msdd-explore.md', '.claude/commands/msdd-spec.md', '.claude/commands/msdd-build.md'
  ]);
  assert.match(await fs.readFile(path.join(root, '.codex/skills/msdd-explore/SKILL.md'), 'utf8'), /msdd-explore/);
  const specSkill = await fs.readFile(path.join(root, '.codex/skills/msdd-spec/SKILL.md'), 'utf8');
  assert.match(specSkill, /Solution Description/);
  assert.match(specSkill, /Mermaid/);
  await assert.rejects(() => fs.access(path.join(root, '.msdd/shared-workflow.md')));
  const buildCommand = await fs.readFile(path.join(root, '.claude/commands/msdd-build.md'), 'utf8');
  assert.match(buildCommand, /msdd build/);
  assert.doesNotMatch(buildCommand, /npm run msdd/);
  assert.match(buildCommand, /living source of truth/);
  await assert.rejects(() => installSkills(root), /Refusing to overwrite/);
  await assert.doesNotReject(() => installSkills(root, { force: true }));
});

test('migrates legacy Codex MSDD skills when forced', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'msdd-codex-migration-'));
  const legacy = path.join(root, '.codex/skills/msdd/SKILL.md');
  const misspelled = path.join(root, '.codex/skills/msdd-buld/SKILL.md');
  await fs.mkdir(path.dirname(legacy), { recursive: true });
  await fs.mkdir(path.dirname(misspelled), { recursive: true });
  await fs.writeFile(legacy, 'legacy');
  await fs.writeFile(misspelled, 'misspelled legacy');
  await assert.rejects(() => installSkills(root), /Legacy MSDD skill or commands/);
  await installSkills(root, { force: true });
  await assert.rejects(() => fs.access(legacy));
  await assert.rejects(() => fs.access(misspelled));
  await assert.doesNotReject(() => fs.access(path.join(root, '.codex/skills/msdd-build/SKILL.md')));
});

test('accepts init force as the first option after the command', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'msdd-init-force-'));
  await installSkills(root);
  await assert.doesNotReject(() => main(['init', '--force'], root));
});

test('exploration can be followed by a detailed spec in the same feature', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'msdd-flow-'));
  await writeExploration(root, 'Account recovery', {
    context: 'Recover accounts safely.', analysis: 'Existing auth service.',
    recommendations: 'Reuse sessions.', questions: 'Token expiry?', decisions: 'Use existing auth.'
  });
  const design = renderDesign('Account recovery', answers);
  await writeFeature(root, 'Account recovery', answers);
  assert.match(await fs.readFile(path.join(root, 'specs/account-recovery/explore.md'), 'utf8'), /Codebase Analysis/);
  assert.match(await fs.readFile(path.join(root, 'specs/account-recovery/spec.md'), 'utf8'), /Technical Design/);
  assert.match(design, /## Verification and Implementation Notes/);
});

test('explore creates only explore.md until spec is explicitly invoked', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'msdd-explore-only-'));
  const answersPath = path.join(root, 'explore-answers.json');
  await fs.writeFile(answersPath, JSON.stringify({ context: 'Investigate onboarding.' }));
  await main(['explore', 'Onboarding', '--answers-file', answersPath], root);
  const featurePath = path.join(root, 'specs/onboarding');
  await assert.doesNotReject(() => fs.access(path.join(featurePath, 'explore.md')));
  await assert.rejects(() => fs.access(path.join(featurePath, 'spec.md')));
  await assert.rejects(() => fs.access(path.join(featurePath, 'task.md')));
});
