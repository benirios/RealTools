import Link from 'next/link'
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4">
      <SignUp />
      <Link href="/privacidade" className="text-xs text-muted-foreground hover:text-foreground">
        Aviso de Privacidade
      </Link>
    </main>
  )
}
