import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { derivePlanTasks, deriveTasks, hasCurrentSpecSchema, installSkills, reconcilePlanTasks, reconcileTasks, reviewDesign, reviewPlanCoverage, reviewSpec, slugify, validateDesign, validatePlan, validateSpec, validateTasks, renderDesign, renderExploration, renderPlan, renderSpec, writeExploration, writeFeature, writeSpecAndPlan, PLAN_SECTIONS, SECTIONS, SPEC_SECTIONS } from '../src/core.js';
import { main } from '../src/cli.js';

const answers = Object.fromEntries(SECTIONS.map(([title]) => [title, `- Details for ${title}.`]));
answers.Requirements = '- REQ-001: The system supports the requested behavior.';
answers['Acceptance Criteria'] = '- AC-001: The requested behavior is observable and verified by a test.';
answers['Goals and Non-Goals'] = '### Goals\n\n- Support the requested behavior.\n\n### Non-goals\n\n- Change unrelated behavior.';
answers['Users and Scenarios'] = '### Actors\n\n- User\n\n### Scenarios\n\n1. The user completes the requested action.';
answers['Decisions and Constraints'] = '### Confirmed Decisions\n\n- Use the existing architecture.\n\n### Assumptions\n\n- The current runtime remains supported.\n\n### Constraints\n\n- Preserve compatibility.\n\n### Open Questions\n\n- None.';
answers['Explanation and Output Artifacts'] = '- Audience: maintainers.\n- Writing profile: concise technical prose.\n- Primary artifact: this specification.\n- Supporting artifacts: automated tests.\n- Accessibility: use readable Markdown.';
answers['Implementation Plan'] = '1. Implement the requested behavior.';
answers['Verification and Implementation Notes'] = '- Test: run the unit test suite and record expected evidence.';

const currentSpecAnswers = Object.fromEntries(SPEC_SECTIONS.map(([title]) => [title, '- Detail.']));
currentSpecAnswers['Goals and Non-Goals'] = '### Goals\n- Deliver behavior.\n### Non-goals\n- Change unrelated behavior.';
currentSpecAnswers['Users and Scenarios'] = '### Actors\n- User.\n### Scenarios\n1. User completes the action.';
currentSpecAnswers.Requirements = '- REQ-001: Support the requested behavior.';
currentSpecAnswers['Acceptance Criteria'] = '- AC-001: User observes the requested behavior.';
currentSpecAnswers['Decisions and Constraints'] = '### Confirmed Decisions\n- Preserve current behavior.\n### Assumptions\n- None.\n### Constraints\n- Preserve compatibility.\n### Open Questions\n- None.';
const currentPlanAnswers = Object.fromEntries(PLAN_SECTIONS.map(([title]) => [title, '- Detail.']));
currentPlanAnswers['Decisions and Constraints'] = '### Confirmed Decisions\n- Use the existing runtime.\n### Assumptions\n- None.\n### Constraints\n- Preserve compatibility.\n### Trade-offs\n- Keep the design simple.\n### Open Questions\n- None.';
currentPlanAnswers['Implementation Steps'] = '1. Implement the requested behavior.';
currentPlanAnswers['Verification Steps'] = '1. Verify AC-001 with a focused check.';

test('slugifies readable feature names safely', () => assert.equal(slugify('OAuth 2.0 / Login'), 'oauth-2-0-login'));

test('renders and validates the thirteen-section design including output artifacts', () => {
  const design = renderDesign('Login', answers);
  assert.equal(validateDesign(design).length, 0);
  assert.equal(design.match(/^## /gm).length, 13);
  assert.match(design, /## Explanation and Output Artifacts/);
});

test('renders separate high-level spec and low-level plan schemas', () => {
  const spec = renderSpec('Login', currentSpecAnswers);
  const plan = renderPlan('Login', currentPlanAnswers);
  assert.equal(validateSpec(spec).length, 0);
  assert.equal(validatePlan(plan).length, 0);
  assert.equal(hasCurrentSpecSchema(spec), true);
  assert.equal(hasCurrentSpecSchema(renderDesign('Login', answers)), false);
  assert.doesNotMatch(spec, /## Implementation Plan/);
  assert.match(plan, /## Components and Interfaces/);
  assert.match(plan, /## File Changes/);
  assert.deepEqual(reviewPlanCoverage(spec, plan), []);
  assert.match(reviewPlanCoverage(spec, plan.replace('Verify AC-001', 'Run a check'))[0].message, /AC-001/);
  assert.ok(reviewSpec(spec.replace('## Problem', '## Missing Problem')).some((finding) => /Missing section: Problem/.test(finding.message)));
});

test('derives ordered plan tasks and reconciles unchanged completion state', () => {
  const planAnswers = { ...currentPlanAnswers, 'Implementation Steps': '1. Implement reader.\n2. Add route.' };
  const plan = renderPlan('Reader', planAnswers);
  assert.deepEqual(derivePlanTasks(plan).map(({ text }) => text), [
    'Implement reader.', 'Add route.', 'Verify AC-001 with a focused check.'
  ]);
  const old = reconcilePlanTasks(plan).replace('- [ ] T1:', '- [x] T1:');
  assert.match(reconcilePlanTasks(plan, old), /- \[x\] T1:/);
  const updated = renderPlan('Reader', { ...planAnswers, 'Implementation Steps': '1. Implement updated reader.' });
  assert.match(reconcilePlanTasks(updated, old), /- \[ \] T\d+: Implement updated reader\./);
});

test('writes spec, plan, and plan-derived tasks together without overwriting', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'msdd-paired-artifacts-'));
  const dir = await writeSpecAndPlan(root, 'Search', currentSpecAnswers, currentPlanAnswers);
  for (const file of ['spec.md', 'plan.md', 'task.md']) await fs.access(path.join(dir, file));
  assert.match(await fs.readFile(path.join(dir, 'task.md'), 'utf8'), /Implement the requested behavior/);
  await assert.rejects(() => writeSpecAndPlan(root, 'Search', currentSpecAnswers, currentPlanAnswers), /Artifact already exists/);
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

test('rejects inline prose where sections require Markdown structure', () => {
  const design = renderDesign('Login', {
    ...answers,
    'Goals and Non-Goals': 'Goals: support sessions. Non-goals: change unrelated behavior.',
    'Users and Scenarios': 'Actors: user. 1. A user signs in.',
    'Decisions and Constraints': 'Confirmed: sessions. Assumptions: runtime support. Constraints: compatibility. Open questions: none.',
    'Explanation and Output Artifacts': 'Audience: maintainers. Writing profile: concise. Primary artifact: spec. Supporting artifacts: tests. Accessibility: readable.'
  });
  const findings = reviewDesign(design);
  for (const section of ['Goals and Non-Goals', 'Users and Scenarios', 'Decisions and Constraints', 'Explanation and Output Artifacts']) {
    assert.ok(findings.some((finding) => finding.severity === 'error' && finding.section === section));
  }
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
  assert.match(specSkill, /high-level design/);
  assert.match(specSkill, /low-level design/);
  await assert.rejects(() => fs.access(path.join(root, '.msdd/shared-workflow.md')));
  const buildCommand = await fs.readFile(path.join(root, '.claude/commands/msdd-build.md'), 'utf8');
  assert.match(buildCommand, /msdd build/);
  assert.doesNotMatch(buildCommand, /npm run msdd/);
  assert.match(buildCommand, /living sources of truth/);
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

test('explore remains available but creates no file and does not modify legacy explore.md', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'msdd-explore-only-'));
  const answersPath = path.join(root, 'explore-answers.json');
  await fs.writeFile(answersPath, JSON.stringify({ context: 'Investigate onboarding.' }));
  await main(['explore', 'Onboarding', '--answers-file', answersPath], root);
  await assert.rejects(() => fs.access(path.join(root, 'specs')));
  const featurePath = path.join(root, 'specs/onboarding');
  await fs.mkdir(featurePath, { recursive: true });
  await fs.writeFile(path.join(featurePath, 'explore.md'), 'legacy notes');
  await main(['explore', 'Onboarding', '--answers-file', answersPath], root);
  assert.equal(await fs.readFile(path.join(featurePath, 'explore.md'), 'utf8'), 'legacy notes');
});

test('spec creates the paired artifacts without requiring exploration first', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'msdd-spec-command-'));
  const answersPath = path.join(root, 'answers.json');
  await fs.writeFile(answersPath, JSON.stringify({ spec: currentSpecAnswers, plan: currentPlanAnswers }));
  await main(['spec', 'New Workflow', '--answers-file', answersPath], root);
  const dir = path.join(root, 'specs/new-workflow');
  assert.match(await fs.readFile(path.join(dir, 'spec.md'), 'utf8'), /## Acceptance Criteria/);
  assert.match(await fs.readFile(path.join(dir, 'plan.md'), 'utf8'), /## File Changes/);
  assert.match(await fs.readFile(path.join(dir, 'task.md'), 'utf8'), /Verify AC-001/);
  await assert.rejects(() => fs.access(path.join(dir, 'explore.md')));
});

test('review and build use plan for current artifacts and keep legacy spec-only folders usable', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'msdd-build-compat-'));
  const currentAnswers = path.join(root, 'current.json');
  await fs.writeFile(currentAnswers, JSON.stringify({ spec: currentSpecAnswers, plan: currentPlanAnswers }));
  await main(['spec', 'Current Feature', '--answers-file', currentAnswers], root);
  await assert.doesNotReject(() => main(['review', 'Current Feature'], root));
  await assert.doesNotReject(() => main(['build', 'Current Feature'], root));
  assert.match(await fs.readFile(path.join(root, 'specs/current-feature/task.md'), 'utf8'), /Implement the requested behavior/);

  await writeFeature(root, 'Legacy Feature', answers);
  await assert.doesNotReject(() => main(['review', 'Legacy Feature'], root));
  await assert.doesNotReject(() => main(['build', 'Legacy Feature'], root));
  await assert.rejects(() => fs.access(path.join(root, 'specs/legacy-feature/plan.md')));
});

test('serve reports the actual URL and opens it after startup', async () => {
  const messages = [];
  const oldLog = console.log;
  console.log = (message) => messages.push(message);
  try {
    const viewer = await main(['serve'], process.cwd(), {
      startServer: async () => ({ url: 'http://127.0.0.1:5635', server: {} }),
      openBrowser: (url) => messages.push(`opened ${url}`)
    });
    assert.equal(viewer.url, 'http://127.0.0.1:5635');
  } finally { console.log = oldLog; }
  assert.deepEqual(messages, ['Spec viewer running at http://127.0.0.1:5635', 'opened http://127.0.0.1:5635']);
});
