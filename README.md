# helper-progress

A Claude Code mod that shows what your background helpers (subagents) are doing, live, just above the prompt box.

```
1 of 2 helpers done
⠹ Write the API tests · Edit · api.test.ts · 14 calls
```

- One line per running helper, with a spinning wheel, its task, its latest step and how many tool calls it has made.
- A count of how many of this session's helpers have finished.
- Disappears when no helper is running.

A helper has no known end point, so the wheel shows that it is working rather than a percentage.

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install helper-progress --marketplace ebolotin6/helper-progress
```

From a shell:

```bash
claude plugin install helper-progress --marketplace ebolotin6/helper-progress
```

Answer `y` to add the marketplace, then pick a scope. In the desktop app, where `/plugin` does not run: click + next to the prompt box, then Plugins, Add marketplace with `ebolotin6/helper-progress`, then Add plugin.

## License

MIT
