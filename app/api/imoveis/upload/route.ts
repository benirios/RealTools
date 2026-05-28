import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const MAX_FILES = 10

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Formato inválido' }, { status: 400 })
  }

  const files = formData.getAll('images') as File[]
  const valid = files.filter(
    (f) => f instanceof File && f.size > 0 && f.size <= MAX_FILE_SIZE && ALLOWED_TYPES.has(f.type)
  )

  if (valid.length === 0) return NextResponse.json({ urls: [] })
  if (valid.length > MAX_FILES) {
    return NextResponse.json({ error: `Máximo de ${MAX_FILES} fotos por imóvel.` }, { status: 400 })
  }

  const supabase = createSupabaseServiceClient()
  const prefix = crypto.randomUUID()
  const urls: string[] = []

  for (const file of valid) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `${userId}/${prefix}/${crypto.randomUUID()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error } = await supabase.storage
      .from('listing-images')
      .upload(path, buffer, { contentType: file.type, upsert: false })

    if (!error) {
      const { data: { publicUrl } } = supabase.storage
        .from('listing-images')
        .getPublicUrl(path)
      urls.push(publicUrl)
    }
  }

  return NextResponse.json({ urls })
}
