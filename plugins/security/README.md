# Security plugin

Two audits for the `skills-vault` marketplace:

| Command | What | Hosts |
|---------|------|--------|
| `/security:audit-repo` | Time-boxed read-only audit of an untrusted repo, extension, or skill/plugin before install | Claude + Cursor |
| `/security:audit-insecure-defaults` | Parallel insecure-defaults workflow (fallback secrets, fail-open, weak crypto, …) | Claude (workflows) |

## Install

```text
/plugin install security@skills-vault
```

## Insecure defaults

```text
/security:audit-insecure-defaults           # whole repo
/security:audit-insecure-defaults src/      # subtree
/security:audit-insecure-defaults path/file
```

Use the command, not `security:audit-pipeline` directly.

## Untrusted-target audit

```text
/security:audit-repo [path|git-url] [minutes]
```

Read-only. Never executes target code. Default budget: 2 minutes.
