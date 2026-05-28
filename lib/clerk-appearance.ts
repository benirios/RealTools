import type { Appearance } from '@clerk/nextjs/server'

export const clerkAppearance: Appearance = {
  layout: {
    logoImageUrl: '/logo.png',
    logoLinkUrl: '/',
  },
  variables: {
    colorBackground: '#0a0a0a',
    colorInputBackground: '#111111',
    colorInputText: '#f6f6f3',
    colorText: '#f6f6f3',
    colorTextSecondary: '#a4a29b',
    colorPrimary: '#f6f6f3',
    colorDanger: '#ff6868',
    borderRadius: '0.5rem',
    fontFamily: 'inherit',
    fontSize: '14px',
  },
  elements: {
    rootBox: 'w-full',
    card: 'bg-[#0b0b0b] border border-[#30302d] shadow-2xl rounded-2xl',
    logoImage: '!w-20 !h-20 object-contain',
    logoBox: 'flex justify-center mb-1',
    applicationName: 'hidden',
    headerTitle: 'text-[#f6f6f3] font-semibold tracking-tight',
    headerSubtitle: 'text-[#a4a29b]',
    socialButtonsBlockButton:
      'bg-[#151515] border border-[#30302d] text-[#f6f6f3] hover:bg-[#1d1d1d] transition-colors',
    socialButtonsBlockButtonText: 'text-[#f6f6f3] font-medium',
    dividerLine: 'bg-[#30302d]',
    dividerText: 'text-[#a4a29b] text-xs',
    formFieldLabel: 'text-[#a4a29b] text-xs font-medium',
    formFieldInput:
      'bg-[#111111] border border-[#30302d] text-[#f6f6f3] placeholder:text-[#64615b] focus:border-[#888888] focus:ring-0 rounded-lg',
    formButtonPrimary:
      'bg-[#f6f6f3] text-[#050505] font-semibold hover:bg-white rounded-full transition-all active:scale-[0.98]',
    footerActionLink: 'text-[#a4a29b] hover:text-[#f6f6f3] transition-colors',
    footerActionText: 'text-[#64615b]',
    identityPreviewText: 'text-[#f6f6f3]',
    identityPreviewEditButton: 'text-[#a4a29b] hover:text-[#f6f6f3]',
    formResendCodeLink: 'text-[#a4a29b] hover:text-[#f6f6f3]',
    otpCodeFieldInput:
      'bg-[#111111] border border-[#30302d] text-[#f6f6f3] rounded-lg',
    alertText: 'text-[#ff6868]',
    alertIcon: 'text-[#ff6868]',
  },
}
