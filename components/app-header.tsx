import Image from 'next/image'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { HeaderSearch } from './header-search'

export function AppHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-sidebar px-4">
      <Link href="/dashboard" className="shrink-0">
        <Image
          src="/logo.png"
          alt="RealTools"
          width={160}
          height={40}
          className="h-14 w-auto"
          priority
        />
      </Link>

      <div className="flex flex-1 justify-center">
        <HeaderSearch />
      </div>

      <div className="shrink-0">
        <UserButton />
      </div>
    </header>
  )
}
