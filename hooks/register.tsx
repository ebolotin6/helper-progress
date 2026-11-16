import { atom, read, update } from 'claude-code'
import type { Register, Timer } from 'claude-code'

import type { PerHelper } from '../types'

const calls = atom({ plugin: 'helper-progress', key: 'calls' } as const, {} as PerHelper<number>)
const last = atom({ plugin: 'helper-progress', key: 'last' } as const, {} as PerHelper<string>)
const frame = atom({ plugin: 'helper-progress', key: 'frame' } as const, 0)

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
    if (e.props.hasSurvey || running.length === 0) return next(e)

    const [counts, latest] = [await read($, calls), await read($, last)]
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        <Text dimColor>{agents.length - running.length} of {agents.length} helpers done</Text>
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
