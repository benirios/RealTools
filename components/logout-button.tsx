'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <Button
      variant="ghost"
      onClick={handleLogout}
      className="w-full justify-start gap-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    >
      <LogOut className="size-4" />
      Sair
    </Button>
  )
}
