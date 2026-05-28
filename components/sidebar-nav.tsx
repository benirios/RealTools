'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, MapPinned, Search, Target, UserRoundSearch } from 'lucide-react'
import { cn } from '@/lib/utils'

function NavItem({
  href,
  label,
  icon: Icon,
  isActive,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  isActive: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-sm transition-colors',
        isActive
          ? 'bg-accent text-foreground'
          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1 truncate">{label}</span>
    </Link>
  )
}

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
      <NavItem href="/listings/import" label="Pesquisas" icon={Search} isActive={pathname.startsWith('/listings')} />
      <NavItem href="/imoveis" label="Imóveis" icon={Building2} isActive={pathname.startsWith('/imoveis')} />
      <NavItem href="/inteligencia-local" label="Intel. local" icon={MapPinned} isActive={pathname.startsWith('/inteligencia-local')} />
      <NavItem href="/investors" label="Clientes" icon={UserRoundSearch} isActive={pathname.startsWith('/investors')} />
      <NavItem href="/decision-surface" label="Decisão" icon={Target} isActive={pathname.startsWith('/decision-surface')} />
    </nav>
  )
}
