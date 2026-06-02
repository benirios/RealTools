'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-lg font-semibold text-foreground">Algo deu errado</h2>
      <p className="text-sm text-muted-foreground">
        Ocorreu um erro inesperado. Tente novamente ou volte ao início.
      </p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={reset}>
          Tentar novamente
        </Button>
        <Button variant="ghost" asChild>
          <a href="/dashboard">Voltar ao início</a>
        </Button>
      </div>
    </div>
  )
}
