---
name: "MSDD Buld"
description: Implement a feature from its approved msdd specification.
allowed-tools: Bash(npm:*)
---

Run the build as a continuous implementation loop. The user should invoke this command once:

```sh
npm run msdd -- build "<feature name>"
```

1. Run the CLI command above to reconcile the task list and get the next unchecked task.
2. Implement only that task from `spec.md`.
3. Run the appropriate focused tests and checks.
4. Mark that task `[x]` in `task.md`.
5. Internally run `npm run msdd -- build "<feature name>"` again and continue.

Do not stop to ask the user to rerun build between tasks. Do not start the next task before the current task is implemented, verified, and marked done. Stop only when the CLI reports `Build complete`, or when a genuine blocker requires user input. Do not change scope without updating the spec.
