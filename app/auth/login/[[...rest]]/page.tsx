import Link from 'next/link'
import { SignIn } from '@clerk/nextjs'

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4">
      <SignIn />
      <Link href="/privacidade" className="text-xs text-muted-foreground hover:text-foreground">
        Aviso de Privacidade
      </Link>
    </main>
  )
}
