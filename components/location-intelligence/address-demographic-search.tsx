'use client'

import { useState, useTransition } from 'react'
import { Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LocationInsightCard } from '@/components/listings/location-insight-card'
import type { LocationInsightPersisted } from '@/lib/schemas/location-insight'

type SearchState = {
  loading: boolean
  error: string | null
  insight: LocationInsightPersisted | null
}

const initialState: SearchState = {
  loading: false,
  error: null,
  insight: null,
}

export function AddressDemographicSearch() {
  const [state, setState] = useState<SearchState>(initialState)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    const address = String(formData.get('address') ?? '').trim()
    const neighborhood = String(formData.get('neighborhood') ?? '').trim()
    const city = String(formData.get('city') ?? '').trim()
    const state = String(formData.get('state') ?? '').trim()
    const country = String(formData.get('country') ?? 'BR').trim() || 'BR'

    if (address.length < 2 && neighborhood.length < 2 && city.length < 2) {
      setState({ loading: false, error: 'Enter at least an address, neighborhood, or city.', insight: null })
      return
    }

    startTransition(async () => {
      setState((current) => ({ ...current, loading: true, error: null }))

      const response = await fetch('/api/location-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: address || null,
          neighborhood: neighborhood || null,
          city: city || null,
          state: state || null,
          country,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        setState({
          loading: false,
          error: payload?.error
            ? `${payload.error}${payload?.warning ? ` (${payload.warning})` : ''}`
            : `Failed to search the address. HTTP ${response.status}`,
          insight: null,
        })
        return
      }

      setState({
        loading: false,
        error: null,
        insight: payload?.insight ?? null,
      })
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <form
        action={handleSubmit}
        className="space-y-4 rounded-md border border-border bg-card p-5"
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Inteligência de localização
          </p>
          <h2 className="text-lg font-semibold text-foreground">Buscar endereço</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Digite um endereço, bairro ou cidade. O sistema vai geocodificar a área e trazer renda média,
            densidade populacional, perfil consumidor e negócios próximos.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Endereço</Label>
          <Input
            id="address"
            name="address"
            placeholder="Av. Boa Viagem, 100"
            disabled={isPending || state.loading}
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="neighborhood">Bairro</Label>
            <Input
              id="neighborhood"
              name="neighborhood"
              placeholder="Boa Viagem"
              disabled={isPending || state.loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Cidade</Label>
            <Input
              id="city"
              name="city"
              placeholder="Recife"
              disabled={isPending || state.loading}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[100px_1fr]">
          <div className="space-y-2">
            <Label htmlFor="state">UF</Label>
            <Input
              id="state"
              name="state"
              placeholder="PE"
              maxLength={2}
              disabled={isPending || state.loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">País</Label>
            <Input
              id="country"
              name="country"
              defaultValue="BR"
              disabled={isPending || state.loading}
            />
          </div>
        </div>

        {state.error && <p className="text-xs text-destructive">{state.error}</p>}

        <Button type="submit" disabled={isPending || state.loading} className="w-full sm:w-auto">
          {isPending || state.loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Search className="mr-2 size-4" />}
          Buscar dados demográficos
        </Button>
      </form>

      <div className="space-y-4">
        {state.insight ? (
          <LocationInsightCard insight={state.insight} />
        ) : (
          <div className="rounded-md border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">
            O resultado da busca aparece aqui depois que você pesquisar um endereço.
          </div>
        )}
      </div>
    </div>
  )
}
