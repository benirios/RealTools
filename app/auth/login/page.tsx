import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { LoginForm } from './login-form'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-center text-2xl font-medium text-foreground">
          RealTools
        </h1>
        <Card className="border-border bg-card">
          <CardHeader>
            <h2 className="text-center text-xl font-medium text-foreground">
              Entre na sua conta
            </h2>
          </CardHeader>
          <CardContent>
            <LoginForm />
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Não tem uma conta?{' '}
              <Link href="/auth/signup" className="text-foreground hover:underline">
                Cadastre-se
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
