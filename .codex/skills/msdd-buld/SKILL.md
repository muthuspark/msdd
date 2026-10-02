---
name: msdd-buld
description: Implement an approved MSDD specification continuously, one verified task at a time. Use when the user wants to build the feature defined in spec.md.
---

# MSDD Buld

Follow the project's `.msdd/shared-workflow.md`. Start the continuous task loop with:

```sh
npm run msdd -- build "Feature name"
```

Implement only the task returned by the CLI, run focused verification, mark that task `[x]` in `task.md`, and run the build command again internally. Continue until it reports completion or a genuine blocker requires user input. Do not change scope without first updating `spec.md`.
