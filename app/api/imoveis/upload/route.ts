import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const MAX_FILES = 10

function hasValidImageMagicBytes(buf: Uint8Array): boolean {
  // JPEG: FF D8 FF
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return true
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return true
  // GIF: GIF8
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return true
  // WebP: RIFF....WEBP
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return true
  return false
}

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
  const candidates = files.filter(
    (f) => f instanceof File && f.size > 0 && f.size <= MAX_FILE_SIZE && ALLOWED_TYPES.has(f.type)
  )

  if (candidates.length === 0) return NextResponse.json({ urls: [] })
  if (candidates.length > MAX_FILES) {
    return NextResponse.json({ error: `Máximo de ${MAX_FILES} fotos por imóvel.` }, { status: 400 })
  }

  // Verify magic bytes server-side — client-supplied f.type is not trustworthy
  const valid: Array<{ file: File; buffer: Buffer }> = []
  for (const file of candidates) {
    const buffer = Buffer.from(await file.arrayBuffer())
    if (!hasValidImageMagicBytes(buffer)) continue
    valid.push({ file, buffer })
  }

  if (valid.length === 0) return NextResponse.json({ urls: [] })

  const supabase = createSupabaseServiceClient()
  const prefix = crypto.randomUUID()
  const urls: string[] = []

  for (const { file, buffer } of valid) {
    const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? 'jpg'
    const path = `${userId}/${prefix}/${crypto.randomUUID()}.${ext}`

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
