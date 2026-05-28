import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { recordOmOpenByToken } from '@/lib/tracking/record-om-open'
import Image from 'next/image'
// DO NOT import createSupabaseServerClient — it calls cookies() which fails for unauthenticated requests
// Middleware matcher explicitly excludes /om/* so no auth is attempted on this route

export const dynamic = 'force-dynamic'

export default async function OmPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ ref?: string }>
}) {
  const { id } = await params
  const { ref } = await searchParams
  // sync factory — NOT awaited
  const supabase = createSupabaseServiceClient()

  // URL-based tracking (PRIMARY signal — D-12 / TRACK-01 / TRACK-03)
  // Called on every page load when ref is present; recordOmOpenByToken is idempotent.
  if (ref) {
    await recordOmOpenByToken(ref)
  }

  const { data: deal } = await supabase
    .from('deals')
    .select('id, title, address, price, description, status')
    .eq('id', id)
    .single()

  if (!deal) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-muted-foreground">Negócio não encontrado.</p>
      </main>
    )
  }

  // Fetch images from om-images bucket for this deal
  // Convention: files stored at {deal_id}/ prefix in om-images bucket
  const { data: imageFiles } = await supabase.storage
    .from('om-images')
    .list(deal.id, { limit: 20 })

  const images = (imageFiles ?? [])
    .filter((f) => f.name !== '.emptyFolderPlaceholder')
    .map((f) => {
      const { data } = supabase.storage
        .from('om-images')
        .getPublicUrl(`${deal.id}/${f.name}`)
      return data.publicUrl
    })

  const statusLabel =
    deal.status === 'active' ? 'Ativo'
    : deal.status === 'negotiating' ? 'Em negociação'
    : 'Fechado'

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
        <span
          className={[
            'text-xs font-medium px-2 py-1 rounded-full border',
            deal.status === 'active'
              ? 'bg-green-500/10 text-green-400 border-green-500/20'
              : deal.status === 'negotiating'
                ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                : 'bg-muted text-muted-foreground border-border',
          ].join(' ')}
        >
          {statusLabel}
        </span>
      </header>

      {/* Hero */}
      <section className="border-b border-border px-8 py-12">
        <h1 className="text-2xl font-semibold leading-tight text-foreground">{deal.title}</h1>
        <p className="mt-2 text-xl text-muted-foreground">{deal.address}</p>
      </section>

      {/* Property details grid */}
      <section className="grid grid-cols-2 gap-6 border-b border-border bg-secondary px-8 py-8 md:grid-cols-3">
        <div>
          <p className="mb-1 text-sm uppercase tracking-wide text-muted-foreground">Preço Pedido</p>
          <p className="text-xl font-semibold text-foreground">{deal.price}</p>
        </div>
        <div>
          <p className="mb-1 text-sm uppercase tracking-wide text-muted-foreground">Status</p>
          <p className="text-xl font-semibold text-foreground">{statusLabel}</p>
        </div>
      </section>

      {/* Description */}
      {deal.description && (
        <section className="border-b border-border px-8 py-8">
          <h2 className="mb-6 text-xl font-semibold text-foreground">Visão Geral do Imóvel</h2>
          <p
            className="text-base leading-relaxed text-muted-foreground"
            style={{ maxWidth: '72ch' }}
          >
            {deal.description}
          </p>
        </section>
      )}

      {/* Images — only if om-images bucket has files for this deal */}
      {images.length > 0 && (
        <section className="px-8 py-8">
          <h2 className="mb-6 text-xl font-semibold text-foreground">Fotos do Imóvel</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {images.map((url, i) => (
              // Using plain <img> — avoids next.config.ts remotePatterns requirement for public OM page
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

      {/* Tracking pixel (SECONDARY signal — D-13 / TRACK-02) — only when ref present */}
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
