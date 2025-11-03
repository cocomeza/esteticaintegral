'use client'

/**
 * Google reCAPTCHA v3 Provider Component
 * Envuelve la aplicación para proveer funcionalidad de CAPTCHA
 */

import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'

export default function RecaptchaProvider({ children }: { children: React.ReactNode }) {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

  // Si no hay site key configurado, retornar children sin provider
  // Esto permite desarrollo sin CAPTCHA
  if (!recaptchaSiteKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ NEXT_PUBLIC_RECAPTCHA_SITE_KEY no configurado. CAPTCHA deshabilitado.')
    }
    return <>{children}</>
  }

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={recaptchaSiteKey}
      scriptProps={{
        async: true,
        defer: true,
        appendTo: 'head',
      }}
    >
      {children}
    </GoogleReCaptchaProvider>
  )
}

