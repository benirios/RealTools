import { redirect } from 'next/navigation'
import Image from 'next/image'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/sidebar'
import { SidebarNav } from '@/components/sidebar-nav'
import { LogoutButton } from '@/components/logout-button'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServerClient()
  // ALWAYS getUser() — defense in depth even though middleware also checks (CLAUDE.md rule).
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-background text-foreground md:flex">
      <Sidebar />
      <main className="flex min-h-screen flex-1 flex-col overflow-hidden">
        <header className="mx-3 mt-3 flex h-16 shrink-0 items-center justify-between rounded-md border border-border bg-card/90 px-4 backdrop-blur md:mx-5 md:mt-5 md:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Image
              src="/realtools-logo.png"
              alt="RealTools"
              width={150}
              height={85}
              priority
              className="h-10 w-auto object-contain brightness-0 invert md:hidden"
            />
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                RealTools
              </p>
              <p className="text-sm font-medium text-foreground">Área de trabalho</p>
            </div>
          </div>
        </header>
        <div className="mx-3 mt-3 rounded-lg border border-border bg-sidebar md:hidden">
          <SidebarNav />
          <div className="px-3 pb-3">
            <LogoutButton />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6 md:py-8 lg:px-10 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  )
}
