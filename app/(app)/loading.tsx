export default function Loading() {
  return (
    <div className="flex h-full w-full animate-pulse flex-col gap-4 p-6">
      <div className="h-8 w-48 rounded-md bg-muted" />
      <div className="h-4 w-72 rounded-md bg-muted" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 rounded-md bg-muted" />
        ))}
      </div>
    </div>
  )
}
