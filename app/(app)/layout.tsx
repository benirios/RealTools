import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/app-header'
import { Sidebar } from '@/components/sidebar'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
