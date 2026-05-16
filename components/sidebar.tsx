import Image from 'next/image'
import { SidebarNav } from './sidebar-nav'
import { LogoutButton } from './logout-button'

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 bg-sidebar p-5 md:flex md:flex-col">
      <div className="mb-5 flex h-28 items-center justify-center rounded-md border border-sidebar-border bg-card px-5">
        <Image
          src="/realtools-logo.png"
          alt="RealTools"
          width={170}
          height={97}
          priority
          className="h-16 w-auto object-contain brightness-0 invert"
        />
      </div>
      <SidebarNav />
      <div className="mt-5 rounded-md border border-sidebar-border bg-card p-2">
        <LogoutButton />
      </div>
    </aside>
  )
}
