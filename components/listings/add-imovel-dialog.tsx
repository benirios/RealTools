'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type FieldErrors = Record<string, string>

export function AddImovelDialog() {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const next = [...images, ...files].slice(0, 10)
    setImages(next)
    setPreviews(next.map((f) => URL.createObjectURL(f)))
    e.target.value = ''
  }

  function removeImage(index: number) {
    const next = images.filter((_, i) => i !== index)
    setImages(next)
    setPreviews(next.map((f) => URL.createObjectURL(f)))
  }

  function handleClose() {
    setOpen(false)
    setErrors({})
    setImages([])
    setPreviews([])
    formRef.current?.reset()
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setErrors({})

    // Capture before any await — React nullifies currentTarget after the handler yields
    const fd = new FormData(e.currentTarget)

    try {
      let imageUrls: string[] = []

      if (images.length > 0) {
        const uploadForm = new FormData()
        images.forEach((f) => uploadForm.append('images', f))
        const uploadRes = await fetch('/api/imoveis/upload', { method: 'POST', body: uploadForm })
        if (!uploadRes.ok) {
          const d = await uploadRes.json().catch(() => ({}))
          throw new Error((d as { error?: string }).error ?? 'Erro ao fazer upload das fotos.')
        }
        const uploadData = await uploadRes.json() as { urls: string[] }
        imageUrls = uploadData.urls
      }
      const payload = {
        title:          String(fd.get('title') ?? '').trim(),
        description:    String(fd.get('description') ?? '').trim(),
        price_text:     String(fd.get('price_text') ?? '').trim(),
        price_amount:   fd.get('price_amount') || null,
        address_text:   String(fd.get('address_text') ?? '').trim(),
        neighborhood:   String(fd.get('neighborhood') ?? '').trim(),
        city:           String(fd.get('city') ?? '').trim(),
        state:          String(fd.get('state') ?? '').trim(),
        property_type:  String(fd.get('property_type') ?? '').trim(),
        commercial_type: String(fd.get('commercial_type') ?? '').trim(),
        images:         imageUrls,
      }

      const res = await fetch('/api/imoveis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string; fieldErrors?: Record<string, string[]> }
        if (d.fieldErrors) {
          setErrors(Object.fromEntries(Object.entries(d.fieldErrors).map(([k, v]) => [k, v[0]])))
        } else {
          setErrors({ general: d.error ?? 'Erro ao criar imóvel.' })
        }
        return
      }

      toast.success('Imóvel adicionado.')
      handleClose()
      router.refresh()
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'Erro ao salvar imóvel.' })
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 size-4" />
        Adicionar imóvel
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-card text-foreground sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Imóvel</DialogTitle>
            <DialogDescription>Adicione um imóvel manualmente com fotos e informações completas.</DialogDescription>
          </DialogHeader>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Título <span className="text-destructive">*</span></Label>
              <Input id="title" name="title" disabled={pending} placeholder="Loja comercial no Centro" />
              {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" name="description" disabled={pending} rows={4} placeholder="Descreva o imóvel, características, diferenciais..." />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price_text">Preço</Label>
                <Input id="price_text" name="price_text" disabled={pending} placeholder="R$ 3.500/mês" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price_amount">Valor numérico (R$)</Label>
                <Input id="price_amount" name="price_amount" type="number" min={0} step={0.01} disabled={pending} placeholder="3500" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_text">Endereço completo</Label>
              <Input id="address_text" name="address_text" disabled={pending} placeholder="Rua XV de Novembro, 123" />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input id="neighborhood" name="neighborhood" disabled={pending} placeholder="Centro" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input id="city" name="city" disabled={pending} placeholder="Recife" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado (UF)</Label>
                <Input id="state" name="state" maxLength={2} disabled={pending} placeholder="PE" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="property_type">Tipo de imóvel</Label>
                <Input id="property_type" name="property_type" disabled={pending} placeholder="Loja, Galpão, Sala..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commercial_type">Tipo comercial</Label>
                <Input id="commercial_type" name="commercial_type" disabled={pending} placeholder="Varejo, Logística..." />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Fotos (máx. 10)</Label>
              <div className="flex flex-wrap gap-2">
                {previews.map((src, i) => (
                  <div key={i} className="group relative size-20 overflow-hidden rounded-md border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Foto ${i + 1}`} className="size-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="size-4 text-white" />
                    </button>
                  </div>
                ))}
                {images.length < 10 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={pending}
                    className="flex size-20 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                  >
                    <Plus className="size-5" />
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {errors.general && (
              <p className="text-xs text-destructive">{errors.general}</p>
            )}

            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" onClick={handleClose} disabled={pending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Salvar imóvel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
