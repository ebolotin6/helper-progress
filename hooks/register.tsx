import { atom, read, update } from 'claude-code'
import type { Register, Timer } from 'claude-code'

import type { Job, PerHelper } from '../types'

const calls = atom({ plugin: 'helper-progress', key: 'calls' } as const, {} as PerHelper<number>)
const last = atom({ plugin: 'helper-progress', key: 'last' } as const, {} as PerHelper<string>)
const frame = atom({ plugin: 'helper-progress', key: 'frame' } as const, 0)
const jobs = atom({ plugin: 'helper-progress', key: 'jobs' } as const, [] as Job[])

// any script can show a counter here: it writes {label, step, of, text, startedAt (seconds)} to a .json file in this
// folder as it goes and deletes the file when it ends. A file untouched for 15 minutes is a script that died
const JOBS = '/tmp/helper-progress'
const STALE_MS = 15 * 60_000

function isJob(j: unknown): j is Job {
  const o = j as Job
  return typeof o?.label === 'string' && typeof o.text === 'string' && [o.step, o.of, o.startedAt].every(Number.isFinite)
}

const elapsed = (from: number) => {
  const s = Math.max(0, Math.floor(Date.now() / 1000 - from))
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`
}

const wheel = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
const ended = new Set(['completed', 'failed', 'killed'])

/** A few words on what a tool call is doing: its description, file, pattern or command. */
function what(e: Record<string, unknown>): string {
  const arg = ['description', 'file_path', 'pattern', 'command', 'url', 'query'].map(k => e[k]).find(v => typeof v === 'string') as string | undefined
  const text = arg ? `${e.tool} · ${arg.split('/').pop()}` : String(e.tool)
  return text.length > 70 ? text.slice(0, 69) + '…' : text
}

export const register: Register = on => {
  let spinner: Timer | undefined
  let poll: Timer | undefined
  let seen = '[]'

  on('session.start', ($, e, next) => {
    poll ??= $.clock.every(1000, async () => {
      const files = (await $.fs.list(JOBS).catch(() => [])).filter(f => f.kind === 'file' && f.name.endsWith('.json') && Date.now() - f.mtimeMs < STALE_MS)
      const read = await Promise.all(files.map(f => $.fs.read(`${JOBS}/${f.name}`).then(t => JSON.parse(t) as unknown).catch(() => undefined)))
      const found = read.filter(isJob)
      const now = JSON.stringify(found)
      if (now !== seen) { seen = now; await update($, jobs, () => found) }
      // the wheel and the clock keep moving while a script runs
      if (found.length > 0) await update($, frame, n => n + 1)
    })
    return next(e)
  })

  // never holds up or fails a tool call: the writes run on their own
  on('tool.call', ($, e, next) => {
    const id = e.agentId
    if (id !== undefined) {
      update($, calls, c => ({ ...c, [id]: (c[id] ?? 0) + 1 })).catch(() => {})
      update($, last, l => ({ ...l, [id]: what(e) })).catch(() => {})
      spinner ??= $.clock.every(200, () => {
        update($, frame, n => n + 1).catch(() => {})
        $.agent.list().then(agents => {
          if (agents.every(a => ended.has(a.status))) { spinner?.cancel(); spinner = undefined }
        }).catch(() => {})
      })
    }
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const n = await read($, frame)
    const agents = await $.agent.list()
    const running = agents.filter(a => !ended.has(a.status))
    const scripts = await read($, jobs)
    if (e.props.hasSurvey || (running.length === 0 && scripts.length === 0)) return next(e)

    const [counts, latest] = [await read($, calls), await read($, last)]
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        {scripts.map(j => (
          <Text key={j.label}>
            {wheel[n % wheel.length]} {j.label} · step {j.step} of {j.of}
            <Text dimColor> · {j.text} · {elapsed(j.startedAt)}</Text>
          </Text>
        ))}
        {running.length > 0 && <Text dimColor>{agents.length - running.length} of {agents.length} helpers done</Text>}
        {running.map(a => (
          <Text key={a.id}>
            {wheel[n % wheel.length]} {a.description}
            <Text dimColor> · {latest[a.id] ?? a.status} · {counts[a.id] ?? 0} calls</Text>
          </Text>
        ))}
      </Box>
    )
  })
}
