import Link from 'next/link'
import { Search } from 'lucide-react'
import { currentUser } from '@clerk/nextjs/server'
import { SidebarNav } from './sidebar-nav'

export async function Sidebar() {
  const user = await currentUser()
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Conta'
  const email = user?.emailAddresses[0]?.emailAddress ?? ''
  const avatarUrl = user?.imageUrl

  return (
    <aside className="hidden w-[200px] shrink-0 flex-col border-r border-border bg-sidebar md:flex">
      <div className="p-2 pb-1">
        <Link
          href="/listings/import"
          className="flex w-full items-center justify-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-black transition-opacity hover:opacity-85"
        >
          <Search className="size-3.5 shrink-0" />
          Nova Pesquisa
        </Link>
      </div>

      <SidebarNav />

      <div className="p-2">
        <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
          {avatarUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={displayName} className="size-7 rounded-full object-cover" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-tight text-foreground">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
