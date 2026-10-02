---
name: "MSDD Explore"
description: Explore the codebase, analyze implementation options, and surface questions before specification.
allowed-tools: Bash(msdd:*), Read, Grep, Glob
---

Explore before specifying. Inspect the relevant codebase, identify existing patterns and constraints, compare implementation options, recommend an approach, and list questions or decisions for the user.

Record the discussion with:

```sh
msdd explore "<feature name>" --answers-file <answers.json>
```

Do not write production code in this mode.
