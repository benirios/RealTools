import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { PageContent } from '@/components/page-content'

export default async function ProfilePage() {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const user = await currentUser()

  return (
    <PageContent>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold leading-tight text-foreground">
          Perfil
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Seus dados de conta.
        </p>
      </div>

      <div className="max-w-xl rounded-md border border-border bg-card p-6 space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            E-mail
          </p>
          <p className="text-sm text-foreground">
            {user?.emailAddresses[0]?.emailAddress ?? 'desconhecido'}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            ID do usuário
          </p>
          <p className="text-xs text-muted-foreground font-mono break-all">{userId}</p>
        </div>
      </div>
    </div>
    </PageContent>
  )
}
