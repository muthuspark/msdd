---
name: "MSDD: Spec"
description: Turn an exploration into a detailed implementation specification.
allowed-tools: Bash(npm:*)
---

Use the confirmed exploration decisions to complete every section of the detailed spec:

```sh
npm run msdd -- spec "<feature name>"
```

Resolve open questions before finalizing. The spec is the source of truth for the build mode.
