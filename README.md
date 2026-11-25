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

## Counters for your own scripts

A script with known steps can show a counter in the same place:

```
⠹ Deploy · step 3 of 5 · building the changed servers · 0m 12s
```

It writes one small JSON file as it goes and deletes it when it ends:

```bash
mkdir -p /tmp/helper-progress
echo '{"label":"Deploy","step":3,"of":5,"text":"building the changed servers","startedAt":'"$START"'}' > /tmp/helper-progress/deploy.json
```

`startedAt` is the start time in seconds (`date +%s`). A file left untouched for 15 minutes is ignored.

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

To have it on in every session, pick the user scope, or add `--scope user` to the shell command:

```bash
claude plugin install helper-progress --marketplace ebolotin6/helper-progress --scope user
```

## License

MIT
