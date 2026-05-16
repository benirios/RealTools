import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { AddressDemographicSearch } from '@/components/location-intelligence/address-demographic-search'

export default async function InteligenciaLocalPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold leading-tight text-foreground">Inteligência local</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pesquise um endereço e veja a leitura demográfica e comercial da área.
        </p>
      </div>

      <AddressDemographicSearch />
    </div>
  )
}
