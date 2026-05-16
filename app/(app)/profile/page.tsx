import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
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
          <p className="text-sm text-foreground">{user?.email ?? 'desconhecido'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            ID do usuário
          </p>
          <p className="text-xs text-muted-foreground font-mono break-all">{user?.id ?? '—'}</p>
        </div>
      </div>
    </div>
  )
}
