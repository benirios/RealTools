#!/usr/bin/env tsx
/**
 * rt-ui — RealTools TUI (Claude Code style)
 */

import React, { useState, useCallback, useEffect } from 'react'
import { render, Box, Text, useApp, useInput, useStdout } from 'ink'
import TextInput from 'ink-text-input'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const execFileP = promisify(execFile)
const __dir   = dirname(fileURLToPath(import.meta.url))
const ROOT    = resolve(__dir, '../..')
const CLI     = resolve(__dir, '../rt.ts')
const SIDEBAR = 22

// ── block-letter logo ─────────────────────────────────────────────────────────
const LOGO = [
  '████  ████   ██  █    █████  ███   ███  █     ████',
  '█  █  █    █  █  █      █   █   █ █   █ █    █    ',
  '████  ███  ████  █      █   █   █ █   █ █     ███ ',
  '█ █   █    █  █  █      █   █   █ █   █ █        █',
  '█  █  ████ █  █  ████   █    ███   ███  ████ ████ ',
]

// ── command palette entries ───────────────────────────────────────────────────

const ALL_CMDS = [
  { cmd: 'scrape',           desc: '<term> [--address <addr>] [--city <city>] [--state <state>] [--max <n>]' },
  { cmd: 'investors list',   desc: '[--limit <n>]' },
  { cmd: 'investors search', desc: '<query>' },
  { cmd: 'help',             desc: 'show all commands' },
  { cmd: 'exit',             desc: 'close RealTools' },
]

const QUICK_CMDS = ALL_CMDS.map((c) => c.cmd).filter((c) => c !== 'exit')

// ── types ─────────────────────────────────────────────────────────────────────

type MsgKind = 'command' | 'result' | 'error' | 'info'
type Msg     = { id: number; kind: MsgKind; lines: string[] }

let _id = 0
const nextId = () => ++_id

function now() {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// ── runner ────────────────────────────────────────────────────────────────────

async function runCommand(raw: string): Promise<{ kind: MsgKind; lines: string[] }> {
  const trimmed = raw.trim()
  if (!trimmed) return { kind: 'info', lines: [] }

  if (trimmed === 'help') return {
    kind: 'info',
    lines: [
      'Available commands:',
      '',
      '  scrape <term> [--address <addr>] [--city <city>]',
      '                [--state <state>] [--max <n>] [--url]',
      '',
      '  investors list [--limit <n>]',
      '  investors search <query>',
      '',
      '  exit / quit / q   —  close',
      '  esc               —  close',
      '',
      '  $ — open command palette',
    ],
  }

  const tokens = trimmed.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? []

  try {
    const { stdout, stderr } = await execFileP(
      'npx',
      ['tsx', '--tsconfig', 'tsconfig.json', CLI, ...tokens],
      { cwd: ROOT, maxBuffer: 1024 * 1024 * 4 }
    )
    const out = (stdout || stderr).trim()
    return { kind: 'result', lines: out ? out.split('\n') : [] }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { kind: 'error', lines: msg.split('\n').filter(Boolean).slice(0, 8) }
  }
}

// ── components ────────────────────────────────────────────────────────────────

function TopBar({ status, time }: { status: string; time: string }) {
  const running = status !== 'Ready'
  return (
    <Box
      width="100%"
      paddingX={2}
      borderStyle="single"
      borderColor="cyan"
      borderTop={false}
      borderLeft={false}
      borderRight={false}
    >
      <Text bold color="cyan">RealTools</Text>
      <Text color="gray"> · CRE deal management</Text>
      <Box flexGrow={1} />
      <Text color={running ? 'yellow' : 'green'}>● {status}</Text>
      <Text color="gray">  {time}</Text>
    </Box>
  )
}

function Sidebar({ recent }: { recent: string[] }) {
  return (
    <Box
      width={SIDEBAR}
      flexDirection="column"
      paddingX={1}
      paddingTop={1}
      borderStyle="single"
      borderColor="gray"
      borderTop={false}
      borderBottom={false}
      borderLeft={false}
    >
      <Text bold color="gray">Quick</Text>
      <Box marginTop={1} flexDirection="column">
        {QUICK_CMDS.map((c) => (
          <Text key={c} color="gray" dimColor>  {c}</Text>
        ))}
      </Box>

      {recent.length > 0 && (
        <Box marginTop={2} flexDirection="column">
          <Text bold color="gray">Recent</Text>
          <Box marginTop={1} flexDirection="column">
            {recent.slice(-5).reverse().map((r, i) => (
              <Text key={i} color="gray" dimColor>
                {'  '}{r.length > SIDEBAR - 4 ? r.slice(0, SIDEBAR - 5) + '…' : r}
              </Text>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  )
}

function Logo() {
  return (
    <Box flexDirection="column" marginBottom={1}>
      {LOGO.map((line, i) => (
        <Text key={i} bold color="cyan">{line}</Text>
      ))}
      <Text color="gray" dimColor>CRE deal management · type $ for commands</Text>
    </Box>
  )
}

function MsgBlock({ msg }: { msg: Msg }) {
  const color =
    msg.kind === 'error'   ? 'red'  :
    msg.kind === 'command' ? 'cyan' :
    msg.kind === 'info'    ? 'gray' : 'white'

  return (
    <Box flexDirection="column" marginBottom={1}>
      {msg.lines.map((line, i) => (
        <Text key={`${msg.id}-${i}`} color={color}>{line}</Text>
      ))}
    </Box>
  )
}

function Palette({
  items, selectedIdx,
}: {
  items: typeof ALL_CMDS
  selectedIdx: number
}) {
  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="cyan"
      marginX={1}
      paddingX={1}
    >
      <Text color="gray" dimColor>↑↓ navigate · Enter select · Esc cancel</Text>
      <Box marginTop={1} flexDirection="column">
        {items.map((item, i) => {
          const active = i === selectedIdx
          return (
            <Box key={item.cmd}>
              <Text bold={active} color={active ? 'cyan' : 'white'}>
                {active ? '❯ ' : '  '}
                {item.cmd}
              </Text>
              <Text color="gray" dimColor>{'  '}{item.desc}</Text>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

function BottomBar({
  input, onChange, onSubmit, loading, paletteOpen,
}: {
  input: string
  onChange: (v: string) => void
  onSubmit: (v: string) => void
  loading: boolean
  paletteOpen: boolean
}) {
  return (
    <Box flexDirection="column">
      <Box
        borderStyle="single"
        borderColor={paletteOpen ? 'cyan' : loading ? 'gray' : 'cyan'}
        borderBottom={false}
        borderLeft={false}
        borderRight={false}
        paddingX={1}
      >
        <Text bold color="cyan">{'> '}</Text>
        <TextInput
          value={input}
          onChange={onChange}
          onSubmit={onSubmit}
          placeholder={loading ? 'running…' : 'type a command or $ …'}
          focus={!loading && !paletteOpen}
        />
      </Box>
      <Box paddingX={2}>
        <Text color="gray" dimColor>esc to exit</Text>
        <Box flexGrow={1} />
        <Text color="gray" dimColor>$ for commands</Text>
      </Box>
    </Box>
  )
}

// ── app ───────────────────────────────────────────────────────────────────────

function App() {
  const { exit }   = useApp()
  const { stdout } = useStdout()
  const cols       = stdout?.columns ?? 100

  const [messages,    setMessages]    = useState<Msg[]>([])
  const [input,       setInput]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [time,        setTime]        = useState(now())
  const [recent,      setRecent]      = useState<string[]>([])
  const [status,      setStatus]      = useState('Ready')
  const [paletteIdx,  setPaletteIdx]  = useState(0)

  const isPalette  = input.startsWith('$')
  const filter     = isPalette ? input.slice(1).toLowerCase().trim() : ''
  const filtered   = ALL_CMDS.filter((c) => !filter || c.cmd.includes(filter) || c.desc.toLowerCase().includes(filter))

  useEffect(() => { setPaletteIdx(0) }, [filter])

  useEffect(() => {
    const t = setInterval(() => setTime(now()), 10_000)
    return () => clearInterval(t)
  }, [])

  const push = useCallback((kind: MsgKind, lines: string[]) => {
    setMessages((prev) => [...prev, { id: nextId(), kind, lines }])
  }, [])

  // Handle all keypresses when palette is open; normal esc otherwise
  useInput((ch, key) => {
    if (isPalette) {
      if (key.upArrow)   { setPaletteIdx((i) => Math.max(0, i - 1)); return }
      if (key.downArrow) { setPaletteIdx((i) => Math.min(filtered.length - 1, i + 1)); return }
      if (key.escape)    { setInput(''); return }
      if (key.return) {
        const selected = filtered[paletteIdx]
        if (selected) setInput(selected.cmd)
        return
      }
      if (key.backspace || key.delete) {
        setInput((prev) => prev.slice(0, -1))
        return
      }
      if (ch && !key.ctrl && !key.meta) {
        setInput((prev) => prev + ch)
      }
      return
    }
    if (key.escape) exit()
  })

  const onSubmit = useCallback(async (value: string) => {
    const cmd = value.trim()
    setInput('')
    if (!cmd || cmd === '$') return
    if (cmd === 'exit' || cmd === 'quit' || cmd === 'q') { exit(); return }

    setRecent((r) => [...r, cmd])
    push('command', [`> ${cmd}`])
    setLoading(true)
    setStatus('Running…')

    try {
      const result = await runCommand(cmd)
      if (result.lines.length) push(result.kind, result.lines)
    } catch (err: unknown) {
      push('error', [err instanceof Error ? err.message : String(err)])
    } finally {
      setLoading(false)
      setStatus('Ready')
    }
  }, [exit, push])

  return (
    <Box flexDirection="column" width={cols}>
      <TopBar status={status} time={time} />

      <Box flexDirection="row" flexGrow={1}>
        <Sidebar recent={recent} />

        <Box flexDirection="column" flexGrow={1} paddingX={2} paddingTop={1}>
          <Logo />
          {messages.map((m) => <MsgBlock key={m.id} msg={m} />)}
          {loading && (
            <Box>
              <Text color="yellow">⠿ Running…</Text>
            </Box>
          )}
        </Box>
      </Box>

      {isPalette && filtered.length > 0 && (
        <Palette items={filtered} selectedIdx={paletteIdx} />
      )}

      <BottomBar
        input={input}
        onChange={setInput}
        onSubmit={onSubmit}
        loading={loading}
        paletteOpen={isPalette}
      />
    </Box>
  )
}

render(<App />)
