import Link from 'next/link'
import { Search } from 'lucide-react'
import { SidebarNav } from './sidebar-nav'

export async function Sidebar() {
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
    </aside>
  )
}
