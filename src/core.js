import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const SECTIONS = [
  ['Summary', 'What is being built and why?'],
  ['Problem', 'What problem or opportunity does this feature address?'],
  ['Goals and Non-Goals', 'What outcomes are in scope, and what is explicitly out of scope?'],
  ['Users and Scenarios', 'Who uses this and what are the important scenarios?'],
  ['Requirements', 'What must the system do? Include functional and non-functional requirements.'],
  ['User/System Flows', 'Describe the primary user and system flows step by step.'],
  ['Technical Design', 'Describe the proposed architecture, data, interfaces, and dependencies.'],
  ['Decisions and Constraints', 'Record decisions, assumptions, constraints, and unresolved choices.'],
  ['Edge Cases and Failure Handling', 'Describe invalid input, failures, recovery, and boundary cases.'],
  ['Acceptance Criteria', 'What observable conditions prove the feature is complete?'],
  ['Explanation and Output Artifacts', 'How should people understand the result, and which output artifacts should the agent create?'],
  ['Implementation Plan', 'List the implementation work in dependency order.'],
  ['Verification and Implementation Notes', 'How will it be tested and what implementation updates should be recorded?']
];

export const SECTION_FORMATS = {
  'Summary': 'State the outcome, scope, and measurable reason for doing this.',
  'Problem': 'Describe the current behavior, observed failure/opportunity, affected users, and evidence.',
  'Goals and Non-Goals': 'Use `### Goals` and `### Non-goals` headings, each followed by a Markdown bullet list. Keep each item testable or explicitly bounded.',
  'Users and Scenarios': 'Use `### Actors` followed by a Markdown bullet list, then `### Scenarios` followed by a Markdown numbered list. Include the expected result for each scenario.',
  'Requirements': 'Use stable IDs such as REQ-001. For each requirement state the behavior, inputs/outputs, and priority.',
  'User/System Flows': 'Use numbered steps. Name the actor, system action, state change, and failure branch at each relevant step.',
  'Technical Design': 'Describe components, interfaces, data, dependencies, compatibility, security, and operational concerns.',
  'Decisions and Constraints': 'Use `### Confirmed Decisions`, `### Assumptions`, `### Constraints`, and `### Open Questions` headings, each followed by Markdown bullets. Do not hide unresolved choices.',
  'Edge Cases and Failure Handling': 'Use a case/action table or bullets with trigger, expected behavior, recovery, and user-visible error.',
  'Acceptance Criteria': 'Use stable IDs such as AC-001. Make each criterion observable and state how it will be verified.',
  'Explanation and Output Artifacts': 'Use a Markdown bullet list with separate `Audience:`, `Writing profile:`, `Primary artifact:`, `Supporting artifacts:`, and `Accessibility:` fields. Prefer an 80% ASD-STE100 controlled-language style for explanatory prose unless strict ASD-STE100 or plain language is required. Choose the clearest medium: prose, diagram, interactive HTML, or narrated explainer video. State the topic, purpose, interaction or narration needs, delivery location, and acceptance evidence for each requested artifact.',
  'Implementation Plan': 'Use ordered, independently verifiable tasks. Include dependencies and the files or boundaries affected.',
  'Verification and Implementation Notes': 'List commands/tests, expected evidence, rollout checks, and a place to record deviations.'
};

// The current artifact model separates user-facing design from implementation
// design. SECTIONS above remains the legacy spec schema for existing folders.
export const SPEC_SECTIONS = [
  ['Summary', 'What outcome does the feature deliver, and why?'],
  ['Problem', 'What user problem or opportunity does it address?'],
  ['Goals and Non-Goals', 'What outcomes are in scope and out of scope?'],
  ['Users and Scenarios', 'Who uses this feature and what do they need to do?'],
  ['Requirements', 'What observable behavior must the feature provide?'],
  ['User/System Flows', 'What steps and outcomes do users experience?'],
  ['Decisions and Constraints', 'What product decisions, assumptions, and constraints shape the behavior?'],
  ['Edge Cases and Failure Handling', 'What edge cases and user-visible failures must be handled?'],
  ['Acceptance Criteria', 'What observable outcomes prove the feature is complete?'],
  ['Explanation and Output Artifacts', 'What user-facing explanation or supporting artifacts are needed?']
];

export const SPEC_SECTION_FORMATS = Object.fromEntries(SPEC_SECTIONS.map(([title]) => [title,
  SECTION_FORMATS[title] || 'Use concise, observable statements. Keep implementation details in plan.md.'
]));

export const PLAN_SECTIONS = [
  ['Technical Design', 'Describe the low-level design and implementation decisions.'],
  ['Components and Interfaces', 'List components, responsibilities, interfaces, and contracts.'],
  ['Data Flow', 'Describe how data moves through the implementation.'],
  ['Decisions and Constraints', 'Record technical decisions, assumptions, constraints, trade-offs, and open questions.'],
  ['File Changes', 'List affected files or boundaries and the intended changes.'],
  ['Failure Handling', 'Describe implementation failure paths and recovery behavior.'],
  ['Implementation Steps', 'List ordered, independently checkable implementation steps.'],
  ['Verification Steps', 'List checks that verify the plan and cover spec acceptance criteria.']
];

export const PLAN_SECTION_FORMATS = {
  'Technical Design': 'Include a concise solution description and change-relevant architecture or sequence diagram when useful.',
  'Components and Interfaces': 'Use bullets. State each component responsibility and its inputs/outputs or interface contract.',
  'Data Flow': 'Use ordered steps or a diagram to show data transformations and boundaries.',
  'Decisions and Constraints': 'Use `### Confirmed Decisions`, `### Assumptions`, `### Constraints`, `### Trade-offs`, and `### Open Questions`, each followed by bullets.',
  'File Changes': 'Use bullets. Name each affected file or boundary and the intended change.',
  'Failure Handling': 'Use bullets or a table with trigger, implementation response, and recovery.',
  'Implementation Steps': 'Use ordered, small, independently checkable steps. Include dependencies when relevant.',
  'Verification Steps': 'Use ordered or bulleted checks. Reference spec acceptance IDs where applicable.'
};

export const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function slugify(name) {
  const slug = name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (!slug) throw new Error('Feature name must contain at least one letter or number');
  return slug;
}

export function featureDir(root, feature) {
  return path.join(root, 'specs', slugify(feature));
}

export function renderDesign(name, answers) {
  const body = SECTIONS.map(([title]) => `## ${title}\n\n<!-- Format: ${SECTION_FORMATS[title]} -->\n\n${answers[title]?.trim() || '_Not specified yet._'}`).join('\n\n');
  return `# ${name.trim()}\n\n${body}\n`;
}

function renderSections(name, sections, formats, answers, label) {
  const body = sections.map(([title]) => `## ${title}\n\n<!-- Format: ${formats[title]} -->\n\n${answers[title]?.trim() || '_Not specified yet._'}`).join('\n\n');
  return `# ${name.trim()} — ${label}\n\n${body}\n`;
}

export function renderSpec(name, answers) {
  return renderSections(name, SPEC_SECTIONS, SPEC_SECTION_FORMATS, answers, 'Spec');
}

export function renderPlan(name, answers) {
  return renderSections(name, PLAN_SECTIONS, PLAN_SECTION_FORMATS, answers, 'Plan');
}

export function renderExploration(name, answers) {
  return `# Exploration: ${name.trim()}\n\n## Context\n\n${answers.context?.trim() || '_Not specified yet._'}\n\n## Codebase Analysis\n\n${answers.analysis?.trim() || '_Not investigated yet._'}\n\n## Recommendations\n\n${answers.recommendations?.trim() || '_No recommendations yet._'}\n\n## Open Questions\n\n${answers.questions?.trim() || '_No open questions yet._'}\n\n## Decisions Confirmed\n\n${answers.decisions?.trim() || '_No decisions confirmed yet._'}\n`;
}

export function parseDesign(markdown) {
  const heading = markdown.match(/^# (.+)$/m)?.[1]?.trim();
  const sections = new Map();
  const matches = [...markdown.matchAll(/^## (.+)$/gm)];
  for (let i = 0; i < matches.length; i += 1) {
    const title = matches[i][1].trim();
    const start = matches[i].index + matches[i][0].length;
    const end = matches[i + 1]?.index ?? markdown.length;
    sections.set(title, markdown.slice(start, end).replace(/<!--[\s\S]*?-->/g, '').trim());
  }
  return { heading, sections };
}

export const parseSpec = parseDesign;
export const parsePlan = parseDesign;

function validateSections(markdown, expectedSections, review) {
  const errors = [];
  const parsed = parseDesign(markdown);
  if (!parsed.heading) errors.push('Missing level-one document heading');
  for (const [title] of expectedSections) {
    if (!parsed.sections.has(title)) errors.push(`Missing section: ${title}`);
    else if (!parsed.sections.get(title).trim()) errors.push(`Empty section: ${title}`);
  }
  for (const title of parsed.sections.keys()) {
    if (!expectedSections.some(([expected]) => expected === title)) errors.push(`Unexpected section: ${title}`);
  }
  errors.push(...review(markdown).filter((finding) => finding.severity === 'error').map((finding) => finding.message));
  return [...new Set(errors)];
}

export function validateSpec(markdown) {
  return validateSections(markdown, SPEC_SECTIONS, reviewSpec);
}

export function validatePlan(markdown) {
  return validateSections(markdown, PLAN_SECTIONS, reviewPlan);
}

export function hasCurrentSpecSchema(markdown) {
  const { sections } = parseSpec(markdown);
  return SPEC_SECTIONS.every(([title]) => sections.has(title)) &&
    [...sections.keys()].every((title) => SPEC_SECTIONS.some(([expected]) => expected === title));
}

export function reviewPlanCoverage(specMarkdown, planMarkdown) {
  const findings = [];
  const specSections = parseSpec(specMarkdown).sections;
  const acceptance = specSections.get('Acceptance Criteria') || '';
  const verification = parsePlan(planMarkdown).sections.get('Verification Steps') || '';
  const ids = [...new Set(acceptance.match(/\bAC-\d+\b/gi) || [])];
  for (const id of ids) {
    if (!new RegExp(`\\b${id}\\b`, 'i').test(verification)) {
      findings.push({ severity: 'error', section: 'Verification Steps', message: `${id} is not covered by a plan verification step` });
    }
  }
  return findings;
}

export function reviewSpec(markdown) {
  const findings = [];
  const parsed = parseDesign(markdown);
  const placeholder = /^(?:_not specified yet\.?_|tbd|todo|to be decided|n\/a)$/i;
  for (const [title] of SPEC_SECTIONS) {
    if (!parsed.sections.has(title)) findings.push({ severity: 'error', section: title, message: `Missing section: ${title}` });
    else if (!parsed.sections.get(title).trim()) findings.push({ severity: 'error', section: title, message: `Empty section: ${title}` });
  }
  for (const title of parsed.sections.keys()) if (!SPEC_SECTIONS.some(([expected]) => expected === title)) {
    findings.push({ severity: 'error', section: title, message: `Unexpected section: ${title}` });
  }
  for (const [title, text] of parsed.sections) {
    if (placeholder.test(text.trim())) findings.push({ severity: 'error', section: title, message: `Section is unresolved: ${title}` });
  }
  for (const title of ['Goals and Non-Goals', 'Users and Scenarios', 'Requirements', 'User/System Flows', 'Decisions and Constraints', 'Edge Cases and Failure Handling', 'Acceptance Criteria']) {
    const text = parsed.sections.get(title) || '';
    if (text && !/^\s*(?:[-*+] |\d+[.)] |#{3,4} |[A-Z][A-Za-z /-]+:)/m.test(text)) {
      findings.push({ severity: 'error', section: title, message: `${title} must use bullets, numbered steps, subheadings, or labeled fields` });
    }
  }
  if (!/\bREQ-\d+\b/i.test(parsed.sections.get('Requirements') || '')) findings.push({ severity: 'warning', section: 'Requirements', message: 'Requirements have no stable REQ-* identifiers' });
  if (!/\bAC-\d+\b/i.test(parsed.sections.get('Acceptance Criteria') || '')) findings.push({ severity: 'warning', section: 'Acceptance Criteria', message: 'Acceptance criteria have no stable AC-* identifiers' });
  return findings;
}

export function reviewPlan(markdown) {
  const findings = [];
  const parsed = parseDesign(markdown);
  const placeholder = /^(?:_not specified yet\.?_|tbd|todo|to be decided|n\/a)$/i;
  for (const [title] of PLAN_SECTIONS) {
    if (!parsed.sections.has(title)) findings.push({ severity: 'error', section: title, message: `Missing section: ${title}` });
    else if (!parsed.sections.get(title).trim()) findings.push({ severity: 'error', section: title, message: `Empty section: ${title}` });
  }
  for (const title of parsed.sections.keys()) if (!PLAN_SECTIONS.some(([expected]) => expected === title)) {
    findings.push({ severity: 'error', section: title, message: `Unexpected section: ${title}` });
  }
  for (const [title, text] of parsed.sections) {
    if (placeholder.test(text.trim())) findings.push({ severity: 'error', section: title, message: `Section is unresolved: ${title}` });
  }
  for (const title of ['Components and Interfaces', 'Data Flow', 'File Changes', 'Failure Handling', 'Implementation Steps', 'Verification Steps']) {
    const text = parsed.sections.get(title) || '';
    if (text && !/^\s*(?:[-*+] |\d+[.)] |#{3,4} |[A-Z][A-Za-z /-]+:)/m.test(text)) {
      findings.push({ severity: 'error', section: title, message: `${title} must use bullets, numbered steps, subheadings, or labeled fields` });
    }
  }
  if (!(parsed.sections.get('Implementation Steps') || '').match(/(?:^|\n)\s*(?:[-*+] |\d+[.)] )/)) {
    findings.push({ severity: 'error', section: 'Implementation Steps', message: 'Implementation Steps must contain ordered or bulleted executable tasks' });
  }
  if (!(parsed.sections.get('Verification Steps') || '').match(/(?:test|verify|check|command|expected|evidence|AC-\d+)/i)) {
    findings.push({ severity: 'warning', section: 'Verification Steps', message: 'Verification Steps do not identify checks or acceptance criteria' });
  }
  return findings;
}

function cleanLine(line) {
  return line.replace(/^\s*(?:[-*+]\s+|\d+[.)]\s+)/, '').replace(/\s+/g, ' ').trim();
}

function sentenceTasks(text) {
  return text.split(/\n+/).flatMap((line) =>
    /^\s*(?:[-*+]\s+|\d+[.)]\s+)/.test(line) ? [line] : line.split(/(?<=[!?])\s+/))
    .map(cleanLine)
    .filter((line) => line && !/^_not specified yet\.?_$/i.test(line) && !/^(?:note|evidence):/i.test(line))
    .filter((line) => !/^none\.?$/i.test(line));
}

function taskText(section, statement) {
  const normalized = statement.replace(/^requirement:\s*/i, '').trim();
  if (/^(implement|add|build|create|define|document|test|verify|handle|support|persist|expose|update|remove|ensure|validate|record|configure|integrate|design)\b/i.test(normalized)) return normalized;
  const verbs = {
    'Requirements': 'Implement', 'User/System Flows': 'Implement the flow:', 'Technical Design': 'Implement',
    'Decisions and Constraints': 'Apply', 'Edge Cases and Failure Handling': 'Handle',
    'Acceptance Criteria': 'Verify', 'Implementation Plan': 'Complete', 'Verification and Implementation Notes': 'Verify',
    'Verification Steps': 'Verify'
  };
  return `${verbs[section] || 'Address'} ${normalized.replace(/[.]+$/, '')}`;
}

export function deriveTasks(designMarkdown) {
  const { sections } = parseDesign(designMarkdown);
  const tasks = [];
  const seen = new Set();
  const taskSections = ['Implementation Plan', 'Verification and Implementation Notes'];
  for (const section of taskSections) {
    const text = sections.get(section) || '';
    for (const statement of sentenceTasks(text)) {
      const textValue = taskText(section, statement).replace(/\s+/g, ' ').trim();
      const key = textValue.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      tasks.push({ text: textValue });
    }
  }
  return tasks;
}

export function derivePlanTasks(planMarkdown) {
  const { sections } = parsePlan(planMarkdown);
  const tasks = [];
  const seen = new Set();
  for (const section of ['Implementation Steps', 'Verification Steps']) {
    for (const statement of sentenceTasks(sections.get(section) || '')) {
      const text = taskText(section, statement).replace(/\s+/g, ' ').trim();
      const key = text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      tasks.push({ text });
    }
  }
  return tasks;
}

export function parseTasks(markdown) {
  return [...markdown.matchAll(/^[-*] \[([ xX])\] (T\d+): (.+)$/gm)].map((match) => ({
    id: match[2], checked: match[1].toLowerCase() === 'x', text: match[3].trim()
  }));
}

function nextId(used) {
  let n = 1;
  while (used.has(`T${n}`)) n += 1;
  return `T${n}`;
}

export function reconcileTasks(designMarkdown, existingMarkdown = '') {
  const desired = deriveTasks(designMarkdown);
  const old = parseTasks(existingMarkdown);
  const oldByText = new Map(old.map((task) => [task.text.toLowerCase().replace(/\s+/g, ' '), task]));
  const used = new Set(old.map((task) => task.id));
  const result = desired.map(({ text }) => {
    const previous = oldByText.get(text.toLowerCase().replace(/\s+/g, ' '));
    if (previous) return { ...previous, text };
    const id = nextId(used);
    used.add(id);
    return { id, checked: false, text };
  });
  return `${result.map((task) => `- [${task.checked ? 'x' : ' '}] ${task.id}: ${task.text}`).join('\n')}\n`;
}

export function reconcilePlanTasks(planMarkdown, existingMarkdown = '') {
  const desired = derivePlanTasks(planMarkdown);
  const old = parseTasks(existingMarkdown);
  const oldByText = new Map(old.map((task) => [task.text.toLowerCase().replace(/\s+/g, ' '), task]));
  const used = new Set(old.map((task) => task.id));
  const result = desired.map(({ text }) => {
    const previous = oldByText.get(text.toLowerCase().replace(/\s+/g, ' '));
    if (previous) return { ...previous, text };
    const id = nextId(used);
    used.add(id);
    return { id, checked: false, text };
  });
  return `${result.map((task) => `- [${task.checked ? 'x' : ' '}] ${task.id}: ${task.text}`).join('\n')}\n`;
}

export function validateDesign(designMarkdown) {
  const errors = [];
  const parsed = parseDesign(designMarkdown);
  if (!parsed.heading) errors.push('Missing level-one feature heading');
  const expected = SECTIONS.map(([title]) => title);
  const actual = expected.filter((title) => parsed.sections.has(title));
  for (const title of expected) if (!parsed.sections.has(title)) errors.push(`Missing section: ${title}`);
  if (actual.length !== parsed.sections.size) {
    for (const title of parsed.sections.keys()) if (!expected.includes(title)) errors.push(`Unexpected section: ${title}`);
  }
  for (const [title, text] of parsed.sections) if (expected.includes(title) && !text.trim()) errors.push(`Empty section: ${title}`);
  errors.push(...reviewDesign(designMarkdown).filter((finding) => finding.severity === 'error').map((finding) => finding.message));
  return errors;
}

export function reviewDesign(designMarkdown) {
  const findings = [];
  const parsed = parseDesign(designMarkdown);
  const placeholder = /^(?:_not specified yet\.?_|tbd|todo|to be decided|n\/a)$/i;
  for (const [title, text] of parsed.sections) {
    if (placeholder.test(text.trim())) findings.push({ severity: 'error', section: title, message: `Section is unresolved: ${title}` });
  }
  const structuredSections = ['Goals and Non-Goals', 'Users and Scenarios', 'Requirements', 'User/System Flows', 'Edge Cases and Failure Handling', 'Acceptance Criteria', 'Explanation and Output Artifacts', 'Implementation Plan', 'Verification and Implementation Notes'];
  for (const title of structuredSections) {
    const text = parsed.sections.get(title) || '';
    if (text && !/^\s*(?:[-*+] |\d+[.)] |#{3,4} |[A-Z][A-Za-z /-]+:)/m.test(text)) {
      findings.push({ severity: 'error', section: title, message: `${title} must use bullets, numbered steps, subheadings, or labeled fields; prose-only content is not implementation-ready` });
    }
  }
  const requirePattern = (title, pattern, message) => {
    const text = parsed.sections.get(title) || '';
    if (text && !pattern.test(text)) findings.push({ severity: 'error', section: title, message });
  };
  requirePattern('Goals and Non-Goals', /^### Goals\s*$[\s\S]*?^\s*[-*+]\s+.+$[\s\S]*?^### Non-goals\s*$[\s\S]*?^\s*[-*+]\s+.+$/im,
    'Goals and Non-Goals must use `### Goals` and `### Non-goals`, each with Markdown bullet items');
  requirePattern('Users and Scenarios', /^### Actors\s*$[\s\S]*?^\s*[-*+]\s+.+$[\s\S]*?^### Scenarios\s*$[\s\S]*?^\s*\d+[.)]\s+.+$/im,
    'Users and Scenarios must use `### Actors` with bullets and `### Scenarios` with numbered Markdown items');
  requirePattern('Decisions and Constraints', /^### Confirmed Decisions\s*$[\s\S]*?^\s*[-*+]\s+.+$[\s\S]*?^### Assumptions\s*$[\s\S]*?^\s*[-*+]\s+.+$[\s\S]*?^### Constraints\s*$[\s\S]*?^\s*[-*+]\s+.+$[\s\S]*?^### Open Questions\s*$[\s\S]*?^\s*[-*+]\s+.+$/im,
    'Decisions and Constraints must use its four Markdown subsections, each with bullet items');
  requirePattern('Explanation and Output Artifacts', /^\s*[-*+]\s+Audience:\s+.+$[\s\S]*?^\s*[-*+]\s+Writing profile:\s+.+$[\s\S]*?^\s*[-*+]\s+Primary artifact:\s+.+$[\s\S]*?^\s*[-*+]\s+Supporting artifacts:\s+.+$[\s\S]*?^\s*[-*+]\s+Accessibility:\s+.+$/im,
    'Explanation and Output Artifacts must provide its five labeled fields as separate Markdown bullets');
  const requirements = parsed.sections.get('Requirements') || '';
  if (requirements && !/\bREQ-\d+\b/i.test(requirements)) findings.push({ severity: 'warning', section: 'Requirements', message: 'Requirements have no stable REQ-* identifiers; traceability will be fragile' });
  const acceptance = parsed.sections.get('Acceptance Criteria') || '';
  if (acceptance && !/\bAC-\d+\b/i.test(acceptance)) findings.push({ severity: 'warning', section: 'Acceptance Criteria', message: 'Acceptance criteria have no stable AC-* identifiers' });
  const decisions = parsed.sections.get('Decisions and Constraints') || '';
  for (const label of ['Confirmed', 'Assumptions', 'Constraints', 'Open']) {
    if (!new RegExp(`\\b${label}`, 'i').test(decisions)) findings.push({ severity: 'warning', section: 'Decisions and Constraints', message: `Missing explicit ${label} decisions/constraints subsection` });
  }
  if (!(parsed.sections.get('Implementation Plan') || '').match(/(?:^|\n)\s*(?:[-*+] |\d+[.)] )/)) findings.push({ severity: 'error', section: 'Implementation Plan', message: 'Implementation Plan must contain ordered or bulleted executable tasks' });
  if (!(parsed.sections.get('Verification and Implementation Notes') || '').match(/(?:test|verify|check|command|expected|evidence)/i)) findings.push({ severity: 'warning', section: 'Verification and Implementation Notes', message: 'Verification notes do not identify tests, commands, checks, or expected evidence' });
  return findings;
}

export function validateTasks(designMarkdown, tasksMarkdown) {
  const errors = [];
  const tasks = parseTasks(tasksMarkdown);
  const lines = tasksMarkdown.split('\n').filter((line) => line.trim());
  if (lines.some((line) => !/^[-*] \[[ xX]\] T\d+: .+$/.test(line))) errors.push('task.md may contain only checkbox task lines');
  const ids = new Set();
  for (const task of tasks) if (ids.has(task.id)) errors.push(`Duplicate task ID: ${task.id}`); else ids.add(task.id);
  const expected = deriveTasks(designMarkdown).map((task) => task.text.toLowerCase().replace(/\s+/g, ' '));
  const actual = tasks.map((task) => task.text.toLowerCase().replace(/\s+/g, ' '));
  if (expected.length !== actual.length || expected.some((task, i) => task !== actual[i])) errors.push('task.md is out of date with spec.md; run `msdd build <feature>`');
  return errors;
}

export async function writeFeature(root, name, answers) {
  const dir = featureDir(root, name);
  try {
    await fs.access(path.join(dir, 'spec.md'));
    throw new Error(`Spec already exists: ${path.relative(root, dir)}`);
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  await fs.mkdir(dir, { recursive: true });
  const design = renderDesign(name, answers);
  await fs.writeFile(path.join(dir, 'spec.md'), design);
  await fs.writeFile(path.join(dir, 'task.md'), reconcileTasks(design));
  return dir;
}

export async function writeSpecAndPlan(root, name, specAnswers, planAnswers) {
  const dir = featureDir(root, name);
  const specPath = path.join(dir, 'spec.md');
  const planPath = path.join(dir, 'plan.md');
  const taskPath = path.join(dir, 'task.md');
  for (const destination of [specPath, planPath]) {
    try {
      await fs.access(destination);
      throw new Error(`Artifact already exists: ${path.relative(root, destination)}`);
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  await fs.mkdir(dir, { recursive: true });
  const created = [];
  try {
    await fs.writeFile(specPath, renderSpec(name, specAnswers), { flag: 'wx' });
    created.push(specPath);
    const plan = renderPlan(name, planAnswers);
    await fs.writeFile(planPath, plan, { flag: 'wx' });
    created.push(planPath);
    try {
      await fs.writeFile(taskPath, reconcilePlanTasks(plan), { flag: 'wx' });
      created.push(taskPath);
    } catch (error) { if (error.code !== 'EEXIST') throw error; }
  } catch (error) {
    await Promise.all(created.map((file) => fs.rm(file, { force: true })));
    throw error;
  }
  return dir;
}

export async function writeExploration(root, name, answers) {
  const dir = featureDir(root, name);
  await fs.mkdir(dir, { recursive: true });
  const destination = path.join(dir, 'explore.md');
  await fs.writeFile(destination, renderExploration(name, answers));
  return destination;
}

export async function installSkills(root, { force = false } = {}) {
  const files = [
    ['skills/codex-sdd/msdd-explore/SKILL.md', '.codex/skills/msdd-explore/SKILL.md'],
    ['skills/codex-sdd/msdd-spec/SKILL.md', '.codex/skills/msdd-spec/SKILL.md'],
    ['skills/codex-sdd/msdd-build/SKILL.md', '.codex/skills/msdd-build/SKILL.md'],
    ['skills/claude-sdd/SKILL.md', '.claude/skills/msdd/SKILL.md'],
    ['skills/claude-sdd/commands/msdd-explore.md', '.claude/commands/msdd-explore.md'],
    ['skills/claude-sdd/commands/msdd-spec.md', '.claude/commands/msdd-spec.md'],
    ['skills/claude-sdd/commands/msdd-build.md', '.claude/commands/msdd-build.md']
  ];
  const legacyCodexSkills = [
    path.join(root, '.codex', 'skills', 'msdd', 'SKILL.md'),
    path.join(root, '.codex', 'skills', 'msdd-buld', 'SKILL.md')
  ];
  const existingLegacyCodexSkills = [];
  for (const legacySkill of legacyCodexSkills) {
    try { await fs.access(legacySkill); existingLegacyCodexSkills.push(legacySkill); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  const legacyCommands = [
    ...['explore', 'spec', 'build'].map((command) => path.join(root, '.claude', 'commands', 'msdd', `${command}.md`)),
    path.join(root, '.claude', 'commands', 'msdd-buld.md')
  ];
  const existingLegacyCommands = [];
  for (const legacyCommand of legacyCommands) {
    try { await fs.access(legacyCommand); existingLegacyCommands.push(legacyCommand); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  if ((existingLegacyCodexSkills.length || existingLegacyCommands.length) && !force) {
    throw new Error('Legacy MSDD skill or commands found; rerun with --force to replace them with msdd-explore, msdd-spec, and msdd-build');
  }
  if (force) {
    for (const legacySkill of existingLegacyCodexSkills) {
      await fs.rm(legacySkill);
      try { await fs.rmdir(path.dirname(legacySkill)); } catch (error) { if (error.code !== 'ENOENT' && error.code !== 'ENOTEMPTY') throw error; }
    }
    for (const legacyCommand of existingLegacyCommands) await fs.rm(legacyCommand);
    try { await fs.rmdir(path.join(root, '.claude', 'commands', 'msdd')); } catch (error) { if (error.code !== 'ENOENT' && error.code !== 'ENOTEMPTY') throw error; }
  }
  const installed = [];
  for (const [source, target] of files) {
    const destination = path.join(root, target);
    try {
      await fs.access(destination);
      if (!force) throw new Error(`Refusing to overwrite ${target}; rerun with --force`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    await fs.mkdir(path.dirname(destination), { recursive: true });
    const content = await fs.readFile(path.join(PACKAGE_ROOT, source), 'utf8');
    await fs.writeFile(destination, content);
    installed.push(target);
  }
  return installed;
}

export function hash(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
