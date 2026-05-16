'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Briefcase, Building2, MapPinned, Search, Target, User, UserRoundSearch } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Negócios', icon: Briefcase, matchPrefixes: ['/dashboard', '/deals'] },
  { href: '/decision-surface', label: 'Decisão', icon: Target, matchPrefixes: ['/decision-surface'] },
  { href: '/listings/import', label: 'Pesquisas', icon: Search, matchPrefixes: ['/listings'] },
  { href: '/imoveis', label: 'Imóveis', icon: Building2, matchPrefixes: ['/imoveis'] },
  { href: '/inteligencia-local', label: 'Inteligência local', icon: MapPinned, matchPrefixes: ['/inteligencia-local'] },
  { href: '/investors', label: 'Investidores', icon: UserRoundSearch, matchPrefixes: ['/investors'] },
  { href: '/profile', label: 'Perfil', icon: User, matchPrefixes: ['/profile'] },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 space-y-2 px-3 py-4 md:px-0 md:py-0">
      {navItems.map(({ href, label, icon: Icon, matchPrefixes }) => {
        const isActive = matchPrefixes.some(
          (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
        )
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex min-h-12 items-center gap-3 rounded-md border px-2.5 text-sm font-medium transition-colors duration-200',
              isActive
                ? 'border-foreground bg-foreground text-background'
                : 'border-transparent text-muted-foreground hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            <span
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors',
                isActive
                  ? 'border-background bg-background text-foreground'
                  : 'border-sidebar-border text-muted-foreground'
              )}
            >
              <Icon className="size-4" />
            </span>
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
