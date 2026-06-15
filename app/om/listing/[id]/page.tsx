import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { recordInvestorOmOpenByToken } from '@/lib/tracking/record-om-open'
import Image from 'next/image'
// DO NOT import createSupabaseServerClient — cookies() fails for unauthenticated requests.
// Middleware matcher includes /om(.*) as public so no auth is attempted on this route.

export const dynamic = 'force-dynamic'

export default async function ListingOmPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ ref?: string }>
}) {
  const { id } = await params
  const { ref } = await searchParams
  const supabase = createSupabaseServiceClient()

  // URL-based tracking (PRIMARY signal — idempotent)
  if (ref) {
    await recordInvestorOmOpenByToken(ref)
  }

  const { data: listing } = await supabase
    .from('listings')
    .select('id, title, address_text, location_text, city, state, price_text, description, images, commercial_type, property_type')
    .eq('id', id)
    .single()

  if (!listing) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-muted-foreground">Imóvel não encontrado.</p>
      </main>
    )
  }

  const address = listing.address_text ?? listing.location_text ?? [listing.city, listing.state].filter(Boolean).join(', ') ?? ''
  const typeLabel = listing.commercial_type ?? listing.property_type ?? 'Imóvel comercial'

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-border bg-card px-8 py-4">
        <Image
          src="/realtools-logo.png"
          alt="RealTools"
          width={150}
          height={85}
          priority
          className="h-11 w-auto object-contain"
        />
        <span className="text-xs font-medium px-2 py-1 rounded-full border bg-blue-500/10 text-blue-400 border-blue-500/20">
          {typeLabel}
        </span>
      </header>

      {/* Hero */}
      <section className="border-b border-border px-8 py-12">
        <h1 className="text-2xl font-semibold leading-tight text-foreground">{listing.title}</h1>
        {address && <p className="mt-2 text-xl text-muted-foreground">{address}</p>}
      </section>

      {/* Details grid */}
      <section className="grid grid-cols-2 gap-6 border-b border-border bg-secondary px-8 py-8 md:grid-cols-3">
        {listing.price_text && (
          <div>
            <p className="mb-1 text-sm uppercase tracking-wide text-muted-foreground">Preço Pedido</p>
            <p className="text-xl font-semibold text-foreground">{listing.price_text}</p>
          </div>
        )}
        {listing.city && (
          <div>
            <p className="mb-1 text-sm uppercase tracking-wide text-muted-foreground">Cidade</p>
            <p className="text-xl font-semibold text-foreground">{listing.city}{listing.state ? `, ${listing.state}` : ''}</p>
          </div>
        )}
        <div>
          <p className="mb-1 text-sm uppercase tracking-wide text-muted-foreground">Tipo</p>
          <p className="text-xl font-semibold text-foreground">{typeLabel}</p>
        </div>
      </section>

      {/* Description */}
      {listing.description && (
        <section className="border-b border-border px-8 py-8">
          <h2 className="mb-6 text-xl font-semibold text-foreground">Visão Geral do Imóvel</h2>
          <p className="text-base leading-relaxed text-muted-foreground" style={{ maxWidth: '72ch' }}>
            {listing.description}
          </p>
        </section>
      )}

      {/* Images */}
      {listing.images && listing.images.length > 0 && (
        <section className="px-8 py-8">
          <h2 className="mb-6 text-xl font-semibold text-foreground">Fotos do Imóvel</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {listing.images.slice(0, 8).map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt={`Foto do imóvel ${i + 1}`}
                className="rounded-md object-cover w-full"
                style={{ aspectRatio: '16/9' }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-border bg-secondary px-8 py-6 text-center">
        <p className="text-sm text-muted-foreground">Desenvolvido com RealTools</p>
      </footer>

      {/* Tracking pixel (SECONDARY signal) */}
      {ref && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/track/${ref}`}
          width="1"
          height="1"
          style={{ display: 'none' }}
          alt=""
        />
      )}
    </main>
  )
}
