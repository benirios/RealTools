function normalizeLocationText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function compactLocationText(...parts) {
  const flattened = parts.flat(Infinity)
  const seen = new Set()
  const compacted = []

  for (const part of flattened) {
    const text = String(part ?? '').replace(/\s+/g, ' ').trim()
    if (!text) continue
    const normalized = normalizeLocationText(text)
    if (seen.has(normalized)) continue
    seen.add(normalized)
    compacted.push(text)
  }

  return compacted.join(', ')
}

function buildBrazilLocationQuery(input = {}) {
  const parts = [
    input.address,
    input.neighborhood,
    input.city,
    input.state,
    input.country === false ? null : (input.country ?? 'Brasil'),
  ]

  return compactLocationText(...parts)
}

function clampConfidence(value) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, Math.min(100, Math.round(parsed)))
}

module.exports = {
  buildBrazilLocationQuery,
  clampConfidence,
  compactLocationText,
  normalizeLocationText,
}
