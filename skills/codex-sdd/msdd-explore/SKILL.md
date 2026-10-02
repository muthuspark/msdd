---
name: msdd-explore
description: Explore a feature before specifying it. Use when the user asks to investigate a codebase, compare implementation options, surface constraints, or clarify a feature in MSDD.
---

# MSDD Explore

Explore is read-only: inspect the relevant code and documentation, analyze options and trade-offs, make a recommendation, and identify questions that require the user's decision. Do not implement production changes in this mode.

Record the exploration with:

```sh
msdd explore "Feature name"
```

Capture confirmed decisions in `explore.md`. The next workflow is `$msdd-spec`.
