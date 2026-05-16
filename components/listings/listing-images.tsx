'use client'

import { useState } from 'react'

export function ListingImages({ images }: { images: string[] }) {
  const [failed, setFailed] = useState<Set<number>>(new Set())

  const slice = images.slice(0, 6)
  const visible = slice.filter((_, i) => !failed.has(i))

  if (visible.length === 0) return null

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {slice.map((src, i) =>
        failed.has(i) ? null : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={`/api/proxy-image?url=${encodeURIComponent(src)}`}
            alt={`Foto ${i + 1}`}
            className="h-40 w-full rounded-md object-cover"
            onError={() => setFailed(prev => new Set([...prev, i]))}
          />
        )
      )}
    </div>
  )
}
