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

test('installs both adapters and the shared workflow into a project', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'msdd-init-'));
  const installed = await installSkills(root);
  assert.deepEqual(installed, [
    '.msdd/shared-workflow.md', '.codex/skills/msdd/SKILL.md', '.claude/skills/msdd/SKILL.md',
    '.claude/commands/msdd-explore.md', '.claude/commands/msdd-spec.md', '.claude/commands/msdd-buld.md'
  ]);
  assert.match(await fs.readFile(path.join(root, '.codex/skills/msdd/SKILL.md'), 'utf8'), /\.msdd\/shared-workflow\.md/);
  assert.match(await fs.readFile(path.join(root, '.claude/commands/msdd-buld.md'), 'utf8'), /npm run msdd/);
  await assert.rejects(() => installSkills(root), /Refusing to overwrite/);
  await assert.doesNotReject(() => installSkills(root, { force: true }));
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
