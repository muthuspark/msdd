---
name: msdd-spec
description: Turn a confirmed MSDD exploration into an implementation-ready specification and task list. Use after exploration when the user wants to define the feature before coding.
---

# MSDD Spec

Follow the project's `.msdd/shared-workflow.md`. Read the feature's `explore.md`, resolve material ambiguity with the user, and record confirmed decisions in the thirteen-section `spec.md`. Keep the `Explanation and Output Artifacts` section audience-focused: choose prose, diagram, interactive HTML, or narrated explainer video and use an 80%-ASD-STE100 writing profile unless the user specifies another level.

Create the specification with:

```sh
npm run msdd -- spec "Feature name"
```

The CLI generates `task.md`. The next workflow is `$msdd-buld`.
