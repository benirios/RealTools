import { SignIn } from '@clerk/nextjs'
import { clerkAppearance } from '@/lib/clerk-appearance'

export default function LoginPage() {
  return (
    <main className="auth-page flex min-h-screen items-center justify-center bg-[#0a0a0a] p-4">
      <SignIn appearance={clerkAppearance} />
    </main>
  )
}
