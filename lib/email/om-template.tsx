
interface OmEmailProps {
  investorName: string
  listingTitle: string
  listingAddress: string
  listingPriceText: string | null
  omUrl: string           // /om/listing/[listingId]?ref=[token]
  pixelUrl: string        // /api/track/[token]
  unsubscribeUrl: string  // /api/unsubscribe/[token]
  privacyUrl: string      // /privacidade
  senderName?: string
}

/**
 * Plain HTML email template for investor OM sends.
 * Uses inline styles only — email clients strip <style> blocks.
 * Primary tracking: omUrl (URL-based). Secondary: pixelUrl (1x1 pixel).
 */
export function OmEmailHtml({
  investorName,
  listingTitle,
  listingAddress,
  listingPriceText,
  omUrl,
  pixelUrl,
  unsubscribeUrl,
  privacyUrl,
  senderName,
}: OmEmailProps): string {
  const from = senderName ? `<strong>${senderName}</strong> via RealTools` : 'RealTools'

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e4e4e7;">
        <!-- Header -->
        <tr><td style="background:#18181b;padding:24px 32px;">
          <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.5px;">RealTools</span>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="margin:0 0 8px;color:#71717a;font-size:13px;">Enviado por ${from}</p>
          <h1 style="margin:0 0 24px;color:#18181b;font-size:22px;font-weight:700;line-height:1.3;">Memorando de Oportunidade</h1>

          <p style="margin:0 0 16px;color:#3f3f46;font-size:15px;">Olá${investorName ? ` ${investorName}` : ''},</p>
          <p style="margin:0 0 24px;color:#3f3f46;font-size:15px;">
            Compartilhamos com você uma oportunidade comercial que pode ser de interesse com base no seu perfil de investimento.
          </p>

          <!-- Listing card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;border-radius:6px;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 4px;color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Imóvel</p>
              <p style="margin:0 0 8px;color:#18181b;font-size:17px;font-weight:600;">${escapeHtml(listingTitle)}</p>
              ${listingAddress ? `<p style="margin:0 0 8px;color:#52525b;font-size:14px;">${escapeHtml(listingAddress)}</p>` : ''}
              ${listingPriceText ? `<p style="margin:0;color:#18181b;font-size:15px;font-weight:600;">${escapeHtml(listingPriceText)}</p>` : ''}
            </td></tr>
          </table>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="background:#18181b;border-radius:6px;">
              <a href="${omUrl}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                Ver Memorando de Oportunidade
              </a>
            </td></tr>
          </table>

          <p style="margin:0;color:#a1a1aa;font-size:12px;">
            Se o botão acima não funcionar, copie e cole este link no navegador:<br>
            <a href="${omUrl}" style="color:#52525b;word-break:break-all;">${omUrl}</a>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f4f4f5;padding:20px 32px;border-top:1px solid #e4e4e7;">
          <p style="margin:0;color:#a1a1aa;font-size:12px;text-align:center;">
            Desenvolvido com RealTools · Este email foi enviado a convite de um corretor parceiro.
          </p>
          <p style="margin:8px 0 0;color:#a1a1aa;font-size:12px;text-align:center;">
            <a href="${unsubscribeUrl}" style="color:#a1a1aa;">Não quero mais receber estes emails</a>
            ·
            <a href="${privacyUrl}" style="color:#a1a1aa;">Aviso de Privacidade</a>
          </p>
        </td></tr>
      </table>

      <!-- Tracking pixel (secondary signal) -->
      <img src="${pixelUrl}" width="1" height="1" style="display:none;" alt="">
    </td></tr>
  </table>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
