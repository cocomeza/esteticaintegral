/**
 * Google reCAPTCHA v3 Verification
 * Protección contra bots automatizados
 */

/**
 * Verifica un token de reCAPTCHA en el servidor
 * @param token Token generado por reCAPTCHA en el cliente
 * @param expectedAction Acción esperada (ej: 'submit', 'login')
 * @returns true si el token es válido y el score es alto
 */
export async function verifyRecaptcha(
  token: string,
  expectedAction?: string
): Promise<{ success: boolean; score?: number; action?: string; error?: string }> {
  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY

    if (!secretKey) {
      console.error('❌ RECAPTCHA_SECRET_KEY no está configurado')
      // En desarrollo, permitir sin CAPTCHA
      if (process.env.NODE_ENV === 'development') {
        return { success: true, score: 1.0 }
      }
      return { success: false, error: 'CAPTCHA no configurado' }
    }

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    })

    const data = await response.json()

    // Verificar que la respuesta sea exitosa
    if (!data.success) {
      console.error('❌ reCAPTCHA verification failed:', data['error-codes'])
      return {
        success: false,
        error: 'Verificación de CAPTCHA fallida',
      }
    }

    // Verificar que la acción coincida (si se especificó)
    if (expectedAction && data.action !== expectedAction) {
      console.error('❌ reCAPTCHA action mismatch:', {
        expected: expectedAction,
        received: data.action,
      })
      return {
        success: false,
        error: 'Acción de CAPTCHA no coincide',
      }
    }

    // Verificar el score (0.0 = bot, 1.0 = humano)
    // Threshold recomendado: 0.5
    const score = data.score || 0
    const threshold = 0.5

    if (score < threshold) {
      console.warn('⚠️ reCAPTCHA score bajo:', score)
      return {
        success: false,
        score,
        action: data.action,
        error: 'Score de CAPTCHA demasiado bajo',
      }
    }

    // Verificación exitosa
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ reCAPTCHA verified:', { score, action: data.action })
    }

    return {
      success: true,
      score,
      action: data.action,
    }
  } catch (error) {
    console.error('❌ Error verificando reCAPTCHA:', error)
    return {
      success: false,
      error: 'Error al verificar CAPTCHA',
    }
  }
}

/**
 * Middleware para verificar reCAPTCHA en requests
 */
export async function requireRecaptcha(
  token: string | undefined,
  action?: string
): Promise<void> {
  if (!token) {
    throw new Error('Token de CAPTCHA requerido')
  }

  const result = await verifyRecaptcha(token, action)

  if (!result.success) {
    throw new Error(result.error || 'Verificación de CAPTCHA fallida')
  }
}

