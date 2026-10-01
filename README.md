# msdd

`msdd` is a project-local, Markdown-first specification-driven development CLI. It keeps a feature’s exploration, detailed spec, and generated execution tasks together under `specs/<feature-slug>/`.

## Usage

```sh
npm test
npm run msdd -- init
npm run msdd -- explore "Account recovery"
npm run msdd -- spec "Account recovery"
npm run msdd -- build "Account recovery"
```

Agents can provide interview answers without an interactive terminal by passing a JSON object keyed by the twelve section names:

```sh
npm run msdd -- create "Account recovery" --answers-file answers.json
```

See `shared-workflow.md` and the adapter instructions under `skills/` for the shared agent workflow.

`init` installs the Codex and Claude adapters into `.codex/skills/msdd/` and `.claude/skills/msdd/`, plus the shared contract at `.msdd/shared-workflow.md`. It never overwrites an existing installed file unless `--force` is supplied.
