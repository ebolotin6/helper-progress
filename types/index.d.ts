export type PerHelper<T> = Record<string, T>

declare module 'claude-code' {
  interface PluginState {
    'helper-progress': { calls: PerHelper<number>; last: PerHelper<string>; frame: number }
  }
}
