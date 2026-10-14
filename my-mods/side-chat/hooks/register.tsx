import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { SideMessage } from '../types'

const PANE = 'side-chat'
const TITLE = 'Side chat'
const messages = atom({ plugin: 'side-chat', key: 'messages' } as const, [] as SideMessage[])

const framing = (history: SideMessage[], question: string) =>
  [
    'This is a side question, asked aside from the main task. Answer it briefly and directly from what you already know of this conversation. Use no tools. Do not continue or change the main task.',
    ...history.filter(m => !m.isPending).map(m => `${m.role === 'you' ? 'User' : 'You'} (side chat): ${m.text}`),
    `User (side chat): ${question}`,
  ].join('\n\n')

async function run($: any, args: string) {
  const question = args.trim()
  if (question === 'close') {
    await $.ui.close({ id: PANE })
    return {}
  }
  const { isPlaced } = await $.ui.open({ id: PANE, title: TITLE, focus: true })
  if (question === 'clear') {
    await update($, messages, () => [])
    return isPlaced ? {} : { text: 'Side chat cleared.' }
  }
  if (question === 'copy') {
    const last = [...(await read($, messages))].reverse().find(m => m.role === 'claude' && !m.isPending)
    if (!last) return { text: 'Nothing to copy yet.' }
    const c = await $.ui.copy({ text: last.text })
    return { text: c.isCopied ? 'Copied latest side-chat answer.' : `Copy failed (${c.reason}).` }
  }
  if (!question) return isPlaced ? {} : { text: 'Side chat needs a wider terminal. Ask: /btw <question> (also copy, clear, close)' }

  const history = await read($, messages)
  await update($, messages, list => [
    ...list,
    { role: 'you', text: question },
    { role: 'claude', text: 'thinking…', isPending: true },
  ])
  const r = await $.model.fork({ prompt: framing(history, question) })
  const text = r.isAnswered
    ? r.text
    : r.reason === 'nothing-to-fork'
      ? 'Nothing to answer from yet: the main conversation has no response so far.'
      : `No answer (${r.reason}).`
  await update($, messages, list => [...list.filter(m => !m.isPending), { role: 'claude', text }])

  // pane not seated (narrow terminal): fall back to printing the answer
  return isPlaced ? {} : { text }
}


export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'side-chat',
      description: 'Ask a side question in a pane, without touching the main conversation',
      argumentHint: '[question | copy | clear | close]',
      immediate: true,
    })
    return next(e)
  })

  // intercept the built-in /btw and serve our own /side-chat the same way
  on('command.run', { command: 'btw' }, ($, e) => run($, e.args))
  on('command.run', { command: 'side-chat' }, ($, e) => run($, e.args))

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Input, Text } = $.ui.resolve(e)
    const list = await read($, messages)
    const last = list.map(m => m.role === 'claude' && !m.isPending).lastIndexOf(true)

    return (
      <Box flexDirection="column" gap={1}>
        <Box gap={2}>
          <Button
            key="copy"
            label="Copy latest (c)"
            hotkey="c"
            onPress={async press => {
              if (last >= 0) await $.ui.copy({ text: list[last].text, surface: press.surface })
            }}
          />
          <Button key="clear" label="Clear all (x)" hotkey="x" onPress={() => update($, messages, () => [])} />
          <Button key="close" label="Close (q)" hotkey="q" onPress={() => $.ui.close({ id: PANE })} />
        </Box>
        {list.length === 0 && <Text dimColor>/btw &lt;question&gt; · copy · clear · close. Nothing here enters the main conversation.</Text>}
        {list.slice(-30).map((m, i) => {
          const at = Math.max(0, list.length - 30) + i
          return (
            <Box flexDirection="column">
              <Box gap={1}>
                <Text bold color={m.role === 'you' ? 'blue' : undefined}>{m.role === 'you' ? 'You' : 'Claude'}</Text>
                {m.role === 'you' && (
                  <Button
                    key={`del:${at}`}
                    label="✕"
                    onPress={() => update($, messages, l => l.filter((_, j) => j !== at && j !== at + 1))}
                  />
                )}
              </Box>
              <Text dimColor={m.isPending}>{m.text}</Text>
            </Box>
          )
        })}
        <Input
          key="ask"
          label="›"
          placeholder="ask, or: copy · clear · close"
          submitLabel="ask"
          value=""
          autoFocus
          onSubmit={value => {
            if (value.trim()) void run($, value)
          }}
        />
      </Box>
    )
  })
}
