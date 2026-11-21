export type SideMessage = { role: 'you' | 'claude'; text: string; isPending?: boolean }

declare module 'claude-code' {
  interface PluginState {
    'side-chat': { messages: SideMessage[] }
  }
}
