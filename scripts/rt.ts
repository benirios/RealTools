#!/usr/bin/env tsx
/**
 * rt — RealTools CLI
 *
 * Commands:
 *   scrape <term> [--address <addr>] [--city <city>] [--state <state>] [--max <n>]
 *   investors [search <query>]
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Load .env.local before anything that might read process.env
;(function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const eq = t.indexOf('=')
      if (eq === -1) continue
      const key = t.slice(0, eq).trim()
      const val = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = val
    }
  } catch {}
})()

import { scrapeOlxListings } from '../lib/listings/olx.js'
import { createClient } from '@supabase/supabase-js'

// ── helpers ──────────────────────────────────────────────────────────────────

function parseArgs(argv: string[]) {
  const flags: Record<string, string> = {}
  const positional: string[] = []
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2)
      flags[key] = argv[i + 1] ?? 'true'
      i++
    } else {
      positional.push(argv[i])
    }
  }
  return { flags, positional }
}

function col(value: unknown, width: number) {
  const s = String(value ?? '—')
  return s.length > width ? s.slice(0, width - 1) + '…' : s.padEnd(width)
}

function hr(widths: number[]) {
  return widths.map((w) => '─'.repeat(w)).join('─┼─')
}

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }
  return createClient(url, key, { auth: { persistSession: false } })
}

function fmtPrice(amount: number | null | undefined) {
  if (!amount) return '—'
  return 'R$ ' + amount.toLocaleString('pt-BR')
}

// ── commands ─────────────────────────────────────────────────────────────────

async function cmdScrape(args: string[]) {
  const { flags, positional } = parseArgs(args)
  const term = positional.join(' ')

  if (!term && !flags.address && !flags.city && !flags.state) {
    console.error('Usage: rt scrape [<term>] [--address <addr>] [--city <city>] [--state <state>] [--max <n>]')
    process.exit(1)
  }

  const label = [term, flags.address, flags.city, flags.state].filter(Boolean).join(' · ')
  console.log(`Scraping OLX: "${label}"…\n`)

  const listings = await scrapeOlxListings({
    searchTerm: term,
    address: flags.address,
    city: flags.city,
    state: flags.state,
    maxListings: flags.max ? parseInt(flags.max, 10) : 10,
  })

  if (listings.length === 0) {
    console.log('No listings found.')
    return
  }

  const W = [40, 16, 24, 18]
  const header = [col('Title', W[0]), col('Price', W[1]), col('Location', W[2]), col('Type', W[3])].join(' │ ')
  console.log(header)
  console.log(hr(W))

  for (const l of listings) {
    console.log(
      [
        col(l.title, W[0]),
        col(l.priceText ?? fmtPrice(l.priceAmount), W[1]),
        col(l.locationText ?? l.city, W[2]),
        col(l.propertyType ?? '—', W[3]),
      ].join(' │ ')
    )
  }

  console.log(`\n${listings.length} listing(s) found.`)

  if (flags.url) {
    console.log('\nURLs:')
    listings.forEach((l, i) => console.log(`  ${i + 1}. ${l.sourceUrl}`))
  }
}

async function cmdInvestors(args: string[]) {
  const { flags, positional } = parseArgs(args)
  const sub = positional[0]
  const query = positional.slice(1).join(' ')

  const db = supabaseAdmin()

  if (!sub || sub === 'list') {
    const { data, error } = await db
      .from('investors')
      .select('name, email, phone, budget_min, budget_max, property_types, strategy, risk_level')
      .order('name')
      .limit(parseInt(flags.limit ?? '50', 10))

    if (error) { console.error(error.message); process.exit(1) }

    printInvestors(data ?? [])
    return
  }

  if (sub === 'search') {
    if (!query) {
      console.error('Usage: rt investors search <name|email>')
      process.exit(1)
    }

    const { data, error } = await db
      .from('investors')
      .select('name, email, phone, budget_min, budget_max, property_types, strategy, risk_level')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('name')

    if (error) { console.error(error.message); process.exit(1) }

    if (!data?.length) {
      console.log(`No investors matching "${query}".`)
      return
    }

    printInvestors(data)
    return
  }

  console.error(`Unknown subcommand: ${sub}. Use: list | search`)
  process.exit(1)
}

type InvestorRow = {
  name: string
  email: string | null
  phone: string | null
  budget_min: number | null
  budget_max: number | null
  property_types: string[]
  strategy: string | null
  risk_level: string | null
}

function printInvestors(rows: InvestorRow[]) {
  if (rows.length === 0) { console.log('No investors found.'); return }

  const W = [30, 28, 16, 22, 16]
  const header = [
    col('Name', W[0]),
    col('Email', W[1]),
    col('Budget', W[2]),
    col('Types', W[3]),
    col('Strategy', W[4]),
  ].join(' │ ')

  console.log(header)
  console.log(hr(W))

  for (const r of rows) {
    const budget =
      r.budget_min || r.budget_max
        ? `${fmtPrice(r.budget_min)}–${fmtPrice(r.budget_max)}`
        : '—'

    console.log(
      [
        col(r.name, W[0]),
        col(r.email ?? '—', W[1]),
        col(budget, W[2]),
        col((r.property_types ?? []).join(', '), W[3]),
        col(r.strategy ?? '—', W[4]),
      ].join(' │ ')
    )
  }

  console.log(`\n${rows.length} investor(s).`)
}

// ── router ───────────────────────────────────────────────────────────────────

async function main() {
  const [,, cmd, ...rest] = process.argv

  switch (cmd) {
    case 'scrape':
      await cmdScrape(rest)
      break
    case 'investors':
      await cmdInvestors(rest)
      break
    default:
      console.log(`rt — RealTools CLI

Commands:
  scrape <term> [--address <addr>] [--city <city>] [--state <state>] [--max <n>] [--url]
  investors list [--limit <n>]
  investors search <query>
`)
  }
}

main().catch((err) => { console.error(err.message); process.exit(1) })
