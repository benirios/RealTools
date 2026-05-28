import { SignIn } from '@clerk/nextjs'

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <SignIn />
    </main>
  )
}
