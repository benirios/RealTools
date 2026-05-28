import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { AddressDemographicSearch } from '@/components/location-intelligence/address-demographic-search'
import { PageContent } from '@/components/page-content'

export default async function InteligenciaLocalPage() {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  return (
    <PageContent>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold leading-tight text-foreground">Inteligência local</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pesquise um endereço e veja a leitura demográfica e comercial da área.
        </p>
      </div>

      <AddressDemographicSearch />
    </div>
    </PageContent>
  )
}
