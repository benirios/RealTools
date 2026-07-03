'use client'

import { Loader2, Search } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { InvestorSearchResult, ListingSearchResult } from '@/lib/search/global-search'

type SearchResults = { investors: InvestorSearchResult[]; listings: ListingSearchResult[] }

const EMPTY_RESULTS: SearchResults = { investors: [], listings: [] }

export function HeaderSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults(EMPTY_RESULTS)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const timer = setTimeout(async () => {
      const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`)
      const data = response.ok ? await response.json() : EMPTY_RESULTS
      setResults(data)
      setIsLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const hasResults = results.investors.length > 0 || results.listings.length > 0
  const showDropdown = isOpen && query.trim().length >= 2

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 focus-within:ring-1 focus-within:ring-ring">
        {isLoading ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
        ) : (
          <Search className="size-4 shrink-0 text-muted-foreground" />
        )}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Pesquisar imóveis e clientes..."
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-y-auto rounded-md border border-border bg-card shadow-lg">
          {!hasResults && !isLoading && (
            <p className="px-3 py-3 text-sm text-muted-foreground">Nenhum resultado encontrado.</p>
          )}

          {results.investors.length > 0 && (
            <div className="border-b border-border py-1">
              <p className="px-3 py-1 text-[11px] font-medium uppercase text-muted-foreground">Clientes</p>
              {results.investors.map((investor) => (
                <Link
                  key={investor.id}
                  href={`/investors/${investor.id}`}
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 text-sm hover:bg-accent"
                >
                  <span className="font-medium text-foreground">{investor.name}</span>
                  {investor.email && <span className="ml-2 text-xs text-muted-foreground">{investor.email}</span>}
                </Link>
              ))}
            </div>
          )}

          {results.listings.length > 0 && (
            <div className="py-1">
              <p className="px-3 py-1 text-[11px] font-medium uppercase text-muted-foreground">Imóveis</p>
              {results.listings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/imoveis/${listing.id}`}
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 text-sm hover:bg-accent"
                >
                  <span className="font-medium text-foreground">{listing.title}</span>
                  {listing.location && <span className="ml-2 text-xs text-muted-foreground">{listing.location}</span>}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
