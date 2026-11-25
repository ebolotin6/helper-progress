export type PerHelper<T> = Record<string, T>

/** One running script's progress, as it wrote it to /tmp/helper-progress/<name>.json. */
export type Job = { label: string; step: number; of: number; text: string; startedAt: number }

declare module 'claude-code' {
  interface PluginState {
    'helper-progress': { calls: PerHelper<number>; last: PerHelper<string>; frame: number; jobs: Job[] }
  }
}
