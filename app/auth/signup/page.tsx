import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { SignUpForm } from './signup-form'
import Link from 'next/link'

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-center text-2xl font-medium text-foreground">
          RealTools
        </h1>
        <Card className="border-border bg-card">
          <CardHeader>
            <h2 className="text-center text-xl font-medium text-foreground">
              Crie sua conta
            </h2>
          </CardHeader>
          <CardContent>
            <SignUpForm />
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Já tem uma conta?{' '}
              <Link href="/auth/login" className="text-foreground hover:underline">
                Entrar
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
