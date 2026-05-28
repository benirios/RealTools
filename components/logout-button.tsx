'use client'

import { SignOutButton } from '@clerk/nextjs'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  return (
    <SignOutButton redirectUrl="/auth/login">
      <Button
        variant="ghost"
        className="w-full justify-start gap-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <LogOut className="size-4" />
        Sair
      </Button>
    </SignOutButton>
  )
}
