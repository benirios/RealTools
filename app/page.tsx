'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'motion/react'
import {
  ChevronRight, Menu, Search, Sparkles,
  MoreHorizontal, FileText, Building2, Users,
  MapPin, BarChart3,
} from 'lucide-react'

// ─── Logo ────────────────────────────────────────────────────

function LogoMark({ size = 32 }: { size?: number }) {
  return <Image src="/logo.png" alt="RealTools" width={size} height={size} />
}

// ─── Botão de login ──────────────────────────────────────────

function LoginButton({ label = 'Entrar', full, signup }: { label?: string; full?: boolean; signup?: boolean }) {
  const href = signup
    ? '/auth/signup?redirect_url=/dashboard'
    : '/auth/login?redirect_url=/dashboard'
  return (
    <a
      href={href}
      className={`group inline-flex items-center justify-center gap-2 rounded-full bg-white text-black font-medium text-sm px-5 py-3 transition-all hover:bg-white/90 active:scale-[0.98] ${full ? 'w-full' : ''}`}
    >
      {label}
      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-[1px]" />
    </a>
  )
}

function SectionEyebrow({ label, tag }: { label: string; tag?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-white" />
      <span className="text-xs text-white/60 font-medium">{label}</span>
      {tag && (
        <span className="px-2 py-0.5 rounded-full border border-white/10 text-white/50 text-xs">{tag}</span>
      )}
    </div>
  )
}

const gradientStyle: React.CSSProperties = {
  backgroundImage:
    'linear-gradient(to right, #555 0%, #888 20%, #e8e8e8 38%, #f5f5f5 50%, #e8e8e8 62%, #888 80%, #555 100%)',
  backgroundSize: '200% auto',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  WebkitTextFillColor: 'transparent',
  filter: 'url(#c3-noise)',
  paddingBottom: '0.2em',
  display: 'inline-block',
}

// ─── Navbar ──────────────────────────────────────────────────

function Navbar() {
  const links = ['Funcionalidades', 'Preços', 'Como funciona', 'Docs']
  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between"
    >
      <div className="flex items-center gap-2.5">
        <LogoMark size={44} />
      </div>
      <div className="hidden md:flex gap-8">
        {links.map((link, i) => (
          <motion.a
            key={link}
            href="#"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05, duration: 0.5 }}
            className="text-white/70 text-sm font-medium hover:text-white transition-colors"
          >
            {link}
          </motion.a>
        ))}
      </div>
      <div className="hidden md:flex items-center gap-2">
        <a href="/auth/login?redirect_url=/dashboard" className="text-sm font-medium text-white/70 hover:text-white transition-colors px-4 py-2">
          Entrar
        </a>
        <LoginButton label="Criar conta" signup />
      </div>
      <button className="md:hidden w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
        <Menu className="w-4 h-4 text-white" />
      </button>
    </motion.nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="pt-16 md:pt-28 pb-20 text-center flex flex-col items-center px-6">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="text-4xl md:text-7xl font-semibold tracking-tight leading-[0.9]"
      >
        <span className="block text-white">Seus negócios.</span>
        <span className="block animate-shiny" style={gradientStyle}>
          Organizados.
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.7 }}
        className="mt-8 text-white/60 max-w-md text-base leading-[1.5]"
      >
        RealTools é a central de comando para corretores de imóveis. Gere OMs, envie para compradores qualificados
        e acompanhe cada abertura — tudo em um só lugar.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.7 }}
        className="mt-8 flex flex-col items-center gap-3"
      >
        <LoginButton label="Começar gratuitamente" signup />
        <span className="text-xs text-white/40">Sem cartão de crédito</span>
      </motion.div>
    </section>
  )
}

// ─── Deal Hub mockup ──────────────────────────────────────────

const DEALS = [
  { property: '450 Park Ave', type: 'Escritório', asking: 'R$ 28,5M', stage: 'OM Enviado', active: true },
  { property: 'Wilshire Retail Ctr', type: 'Varejo', asking: 'R$ 12,2M', stage: 'Sob LOI', active: false },
  { property: 'Miami Industrial', type: 'Industrial', asking: 'R$ 45M', stage: 'Divulgado', active: false },
  { property: '1 Market Plaza', type: 'Misto', asking: 'R$ 67M', stage: 'Due Diligence', active: false },
  { property: 'Denver Multifamily', type: 'Residencial', asking: 'R$ 18,9M', stage: 'Novo', active: false },
]

const DEAL_SIDEBAR_NAV = [
  { icon: Building2, label: 'Negócios', count: 8, active: true },
  { icon: Users, label: 'Compradores', count: 34, active: false },
  { icon: FileText, label: 'OMs', count: 6, active: false },
  { icon: BarChart3, label: 'Análises', count: 0, active: false },
  { icon: MapPin, label: 'Imóveis', count: 12, active: false },
]

export const BUYER_ACTIVITY = [
  { buyer: 'Marcus Li', action: 'Abriu OM · 4×', time: '2h atrás', hot: true },
  { buyer: 'Apex Capital', action: 'Abriu OM', time: '5h atrás', hot: false },
  { buyer: 'Bridgewater RE', action: 'Enviou proposta', time: 'Ontem', hot: false },
]

function stageBadge(stage: string) {
  const map: Record<string, string> = {
    'Novo': 'bg-white/8 text-white/40',
    'Divulgado': 'bg-white/12 text-white/55',
    'OM Enviado': 'bg-white/15 text-white/65',
    'Sob LOI': 'bg-white/20 text-white/75',
    'Due Diligence': 'bg-white/25 text-white/90',
  }
  return map[stage] ?? 'bg-white/10 text-white/50'
}

function DealHubMockup() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0e1014]/90 backdrop-blur-2xl"
      >
        <div className="grid grid-cols-12 h-[520px]">
          {/* Sidebar */}
          <div className="col-span-3 border-r border-white/10 bg-black/30 p-4 flex flex-col gap-4">
            <button className="rounded-lg bg-white text-black text-xs font-semibold px-3 py-2 flex items-center gap-1.5 w-full">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              Novo Negócio
            </button>
            <nav className="flex flex-col gap-0.5">
              {DEAL_SIDEBAR_NAV.map(({ icon: Icon, label, count, active }) => (
                <button
                  key={label}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors w-full ${
                    active ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="flex-1 text-left">{label}</span>
                  {count > 0 && <span className="text-white/40">{count}</span>}
                </button>
              ))}
            </nav>
          </div>

          {/* Lista de negócios */}
          <div className="col-span-4 border-r border-white/10 flex flex-col">
            <div className="px-3 py-2 border-b border-white/10 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-white/40 shrink-0" />
              <span className="text-xs text-white/30">Buscar negócios</span>
            </div>
            <div className="overflow-y-auto">
              {DEALS.map((deal) => (
                <div
                  key={deal.property}
                  className={`px-3 py-3 border-b border-white/5 cursor-pointer transition-colors ${
                    deal.active ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold truncate ${deal.active ? 'text-white' : 'text-white/70'}`}>
                      {deal.property}
                    </span>
                    <span className="text-[10px] text-white/40 shrink-0 ml-2">{deal.asking}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${stageBadge(deal.stage)}`}>
                      {deal.stage}
                    </span>
                    <span className="text-[10px] text-white/30">{deal.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detalhe do negócio */}
          <div className="col-span-5 flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
              <span className="text-xs font-medium text-white">450 Park Ave</span>
              <button className="w-7 h-7 rounded-md hover:bg-white/5 flex items-center justify-center">
                <MoreHorizontal className="w-3.5 h-3.5 text-white/50" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Compradores', value: '12' },
                  { label: 'Aberturas', value: '8' },
                  { label: 'Propostas', value: '3' },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg bg-white/5 border border-white/10 p-2 text-center">
                    <p className="text-sm font-semibold text-white">{value}</p>
                    <p className="text-[10px] text-white/40">{label}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: '#c0c0c0' }} />
                  <span className="text-[10px] font-semibold text-white/70">Inteligência de Compradores</span>
                </div>
                <p className="text-xs text-white/60 leading-[1.5]">
                  8 de 12 compradores abriram o OM. Marcus Li abriu 4× — provavelmente interessado. 3 propostas recebidas. Prazo de melhor oferta é quinta-feira.
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30 mb-2">Atividade Recente</p>
                {/* TODO: map BUYER_ACTIVITY to activity row cards here.
                    Each row should show buyer name, action, time, and a "Hot" badge when hot === true.
                    Keep it compact — this panel is only 5 cols wide. */}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Feature: Rastreamento de OM ─────────────────────────────

const TRACKING_GROUPS = [
  { label: 'Leads quentes',  count: 3,  color: '#ffffff', items: ['Marcus Li — abriu 4×', 'Pacific RE — abriu 2×'] },
  { label: 'Engajados',      count: 8,  color: '#e5e5e5', items: ['Apex Capital — abriu OM', 'Bridgewater — proposta enviada'] },
  { label: 'Entregue',       count: 12, color: '#a3a3a3', items: ['12 compradores receberam OM', 'Taxa de abertura: 67%'] },
  { label: 'Sem atividade',  count: 4,  color: '#525252', items: ['4 compradores — nenhuma abertura'] },
]

function FeatureTracking() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20 md:py-28">
      <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <SectionEyebrow label="Rastreamento de OM" tag="Tempo real" />
          <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.02]">
            Saiba exatamente quem<br />está lendo seu negócio.
          </h2>
          <p className="mt-6 text-white/60 text-base leading-[1.6] max-w-md">
            RealTools rastreia cada abertura do OM em tempo real. Veja quando os compradores abrem,
            quantas vezes leram e quem está engajado — antes de te ligarem.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {['Alertas de abertura', 'Detecção múltipla', 'Coleta de propostas', 'Mapa de calor'].map((chip) => (
              <span key={chip} className="text-xs text-white/70 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03]">
                {chip}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="liquid-glass rounded-2xl p-5"
        >
          <p className="text-xs text-white/40 mb-4">450 Park Ave · 12 compradores rastreados</p>
          <div className="flex flex-col gap-3">
            {TRACKING_GROUPS.map(({ label, count, color, items }) => (
              <div key={label} className="liquid-glass rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                  <span className="text-xs font-medium text-white">{label}</span>
                  <span className="text-xs text-white/40 ml-auto">{count}</span>
                </div>
                <div className="flex flex-col gap-1">
                  {items.map((item) => (
                    <p key={item} className="text-xs text-white/50">{item}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Depoimentos ─────────────────────────────────────────────

const TESTIMONIALS = [
  {
    quote: "O RealTools cortou pela metade o tempo de preparação do nosso OM. Agora sabemos exatamente quem está engajado antes da primeira ligação.",
    name: 'Sarah Mitchell',
    role: 'Diretora Sênior, Mercado de Capitais',
    company: 'CBRE',
  },
  {
    quote: "O rastreamento de compradores mudou o jogo. Fechamos mais rápido porque sabíamos quem era sério antes do prazo.",
    name: 'James Torres',
    role: 'Diretor Geral',
    company: 'JLL',
  },
  {
    quote: "Todo negócio que tocamos agora vive no RealTools. Ter OMs, compradores e aberturas em um só lugar muda como trabalhamos.",
    name: 'Priya Nair',
    role: 'Sócia',
    company: 'NORTHGATE CAPITAL',
  },
]

function Testimonials() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20 md:py-28 border-t border-white/10">
      <div className="grid md:grid-cols-3 gap-6">
        {TESTIMONIALS.map(({ quote, name, role, company }, i) => (
          <motion.figure
            key={name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
            className="liquid-glass rounded-2xl p-6"
          >
            <blockquote className="text-sm text-white/80 leading-[1.6]">
              &ldquo;{quote}&rdquo;
            </blockquote>
            <figcaption className="mt-6 pt-5 border-t border-white/10">
              <p className="text-sm font-semibold text-white">{name}</p>
              <p className="text-xs text-white/50 mt-0.5">{role}</p>
              <p className="text-xs text-white font-semibold tracking-wide uppercase mt-1">{company}</p>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  )
}

// ─── Preços ──────────────────────────────────────────────────

const PLANS = [
  {
    tier: 'Grátis',
    price: { monthly: 'Grátis', yearly: 'Grátis' },
    desc: 'Para corretores começando seus primeiros negócios no RealTools.',
    features: [
      'Até 3 negócios ativos',
      'Geração básica de OM',
      'Gestão de compradores',
      'Rastreamento de entrega',
      'Acesso web',
    ],
    pro: false,
  },
  {
    tier: 'Pro',
    price: { monthly: 'R$ 99/mês', yearly: 'R$ 990/ano' },
    desc: 'Para corretores ativos gerenciando vários negócios ao mesmo tempo.',
    features: [
      'Negócios ilimitados',
      'Rastreamento completo de OM',
      'Análise de engajamento',
      'Fluxo de coleta de propostas',
      'Suporte prioritário',
    ],
    pro: false,
  },
  {
    tier: 'Time',
    price: { monthly: 'R$ 299/mês', yearly: 'R$ 2.990/ano' },
    desc: 'Para imobiliárias e times fechando em escala.',
    features: [
      'Tudo do Pro',
      'Membros ilimitados',
      'OM com marca própria',
      'Sala de negociação',
      'Gerente de conta dedicado',
    ],
    pro: true,
  },
]

function Pricing() {
  const [yearly, setYearly] = useState(false)
  return (
    <section className="c3-pricing-section">
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="c3-noise-pricing">
            <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves={2} stitchTiles="stitch" />
            <feComponentTransfer><feFuncA type="linear" slope={0.075} /></feComponentTransfer>
            <feComposite in2="SourceGraphic" operator="in" result="noise" />
            <feBlend in="SourceGraphic" in2="noise" mode="overlay" />
          </filter>
        </defs>
      </svg>

      <div className="c3-watermark-container">
        <div className="c3-watermark-main">
          <span className="c3-watermark-line-1">Seus negócios.</span>
          <span className="c3-watermark-line-2">Organizados.</span>
        </div>
      </div>

      <div className="c3-grid">
        {PLANS.map(({ tier, price, desc, features, pro }) => (
          <div key={tier} className={`c3-card${pro ? ' c3-card-pro' : ''}`}>
            <p className="c3-tier-small">{tier}</p>
            <p className="c3-tier-large">{yearly ? price.yearly : price.monthly}</p>
            <p className="c3-desc">{desc}</p>
            <ul className="c3-list">
              {features.map((f) => (
                <li key={f}>
                  <span className="c3-check">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <a href="/auth/signup?redirect_url=/dashboard" className="c3-btn">Começar</a>
          </div>
        ))}
      </div>

      <div className="c3-toggle-wrap">
        <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>Anual</span>
        <button
          className={`c3-toggle${yearly ? ' active' : ''}`}
          onClick={() => setYearly(!yearly)}
          aria-label="Alternar preço anual"
        >
          <span className="c3-toggle-knob" />
        </button>
      </div>
    </section>
  )
}

// ─── CTA final ────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20 md:py-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="liquid-glass relative overflow-hidden rounded-3xl px-8 py-16 md:py-24 text-center"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(600px circle at 50% 0%, rgba(255,255,255,0.15), transparent 70%)',
            opacity: 0.3,
          }}
        />
        <h2 className="relative text-4xl md:text-6xl font-semibold tracking-tight leading-[1.02] text-white">
          Comece seu próximo<br />negócio do jeito certo.
        </h2>
        <p className="relative mt-6 text-white/60 max-w-md mx-auto text-sm leading-[1.6]">
          Junte-se aos corretores que gerenciam bilhões em transações imobiliárias no RealTools.
        </p>
        <div className="relative mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <LoginButton label="Começar gratuitamente" signup />
          <button className="rounded-full border border-white/15 text-white text-sm font-medium px-5 py-3 hover:bg-white/5 transition-colors flex items-center gap-1.5">
            Agendar demo <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </section>
  )
}

// ─── Página ───────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0c0c0c] text-white">
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="c3-noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} stitchTiles="stitch" />
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0" />
            <feComposite in2="SourceGraphic" operator="in" result="noise" />
            <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
          </filter>
        </defs>
      </svg>


<div className="bg-blob bg-blob-1 z-0" />
      <div className="bg-blob bg-blob-2 z-0" />
      <div className="bg-blob bg-blob-3 z-0" />

      <div className="hidden md:block pointer-events-none fixed inset-y-0 left-1/2 -translate-x-[calc(50%+36rem)] w-px bg-white/10 z-[5]" />
      <div className="hidden md:block pointer-events-none fixed inset-y-0 left-1/2 translate-x-[calc(-50%+36rem)] w-px bg-white/10 z-[5]" />

      <div className="relative z-10">
        <Navbar />
        <Hero />
        <DealHubMockup />
        <FeatureTracking />
        <Testimonials />
        <Pricing />
        <FinalCTA />
      </div>
    </div>
  )
}
