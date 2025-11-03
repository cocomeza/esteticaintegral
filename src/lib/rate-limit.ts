/**
 * Rate Limiting Middleware
 * Protección contra spam de reservas y ataques DDoS
 */

import rateLimit from 'express-rate-limit'
import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * Rate limiter para endpoints públicos de reservas
 * Límite: 3 reservas por hora por IP
 */
export const appointmentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // Máximo 3 reservas por hora
  message: {
    error: 'Demasiadas reservas desde esta dirección. Por favor intenta nuevamente en 1 hora.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: NextApiRequest, res: NextApiResponse) => {
    res.status(429).json({
      error: 'Demasiadas solicitudes desde esta IP. Por favor intenta nuevamente más tarde.',
      retryAfter: '1 hora'
    })
  },
  skip: (req: NextApiRequest) => {
    // No aplicar rate limit en desarrollo
    return process.env.NODE_ENV === 'development'
  }
})

/**
 * Rate limiter más estricto para endpoints de login
 * Límite: 5 intentos por 15 minutos
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 intentos
  message: {
    error: 'Demasiados intentos de inicio de sesión. Por favor intenta nuevamente en 15 minutos.',
    code: 'LOGIN_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: NextApiRequest, res: NextApiResponse) => {
    res.status(429).json({
      error: 'Demasiados intentos de inicio de sesión. Por favor intenta nuevamente más tarde.',
      retryAfter: '15 minutos'
    })
  },
  skip: (req: NextApiRequest) => {
    return process.env.NODE_ENV === 'development'
  }
})

/**
 * Rate limiter general para APIs
 * Límite: 100 requests por 15 minutos
 */
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 requests
  message: {
    error: 'Demasiadas solicitudes. Por favor intenta nuevamente más tarde.',
    code: 'API_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: NextApiRequest) => {
    return process.env.NODE_ENV === 'development'
  }
})

/**
 * Helper para aplicar rate limiter en API routes de Next.js
 */
export async function applyRateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  limiter: any
): Promise<void> {
  return new Promise((resolve, reject) => {
    limiter(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result)
      }
      return resolve(result)
    })
  })
}

