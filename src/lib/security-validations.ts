import { NextApiRequest } from 'next'
import crypto from 'crypto'

export interface SecurityValidationResult {
  isValid: boolean
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  threats: string[]
  recommendations: string[]
  blocked: boolean
}

export interface SecurityConfig {
  maxRequestSize: number // en bytes
  maxConcurrentRequests: number
  suspiciousPatterns: string[]
  blockedIPs: string[]
  allowedOrigins: string[]
  rateLimitConfig: {
    windowMs: number
    maxRequests: number
  }
}

/**
 * 🛡️ MEDIO: Sistema de validaciones de seguridad adicionales
 * 
 * Implementa múltiples capas de seguridad para prevenir:
 * - Ataques de inyección
 * - XSS
 * - CSRF
 * - Rate limiting bypass
 * - Data exfiltration
 */

const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  maxRequestSize: 1024 * 1024, // 1MB
  maxConcurrentRequests: 10,
  suspiciousPatterns: [
    '<script',
    'javascript:',
    'onload=',
    'onerror=',
    'onclick=',
    'onmouseover=',
    'eval(',
    'document.cookie',
    'window.location',
    'alert(',
    'confirm(',
    'prompt(',
    'SELECT * FROM',
    'INSERT INTO',
    'UPDATE SET',
    'DELETE FROM',
    'DROP TABLE',
    'UNION SELECT',
    'OR 1=1',
    'AND 1=1',
    '--',
    '/*',
    '*/',
    'xp_cmdshell',
    'sp_executesql'
  ],
  blockedIPs: [],
  allowedOrigins: [
    'https://estetica-integral.vercel.app',
    'https://esteticaintegral.com.ar',
    'http://localhost:3000' // Solo para desarrollo
  ],
  rateLimitConfig: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 100
  }
}

/**
 * Valida la seguridad de una solicitud HTTP
 */
export function validateRequestSecurity(
  req: NextApiRequest,
  config: SecurityConfig = DEFAULT_SECURITY_CONFIG
): SecurityValidationResult {
  
  const threats: string[] = []
  const recommendations: string[] = []
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
  let blocked = false

  try {
    // 1. Validar tamaño de request
    const contentLength = parseInt(req.headers['content-length'] || '0')
    if (contentLength > config.maxRequestSize) {
      threats.push('Request size exceeds limit')
      riskLevel = 'high'
      blocked = true
    }

    // 2. Validar origen (CORS)
    const origin = req.headers.origin || req.headers.referer
    if (origin && !isAllowedOrigin(origin, config.allowedOrigins)) {
      threats.push('Request from unauthorized origin')
      riskLevel = 'high'
      recommendations.push('Block requests from unauthorized origins')
    }

    // 3. Validar User-Agent
    const userAgent = req.headers['user-agent'] || ''
    if (isSuspiciousUserAgent(userAgent)) {
      threats.push('Suspicious User-Agent detected')
      riskLevel = 'medium'
      recommendations.push('Monitor requests with suspicious User-Agent')
    }

    // 4. Validar IP
    const clientIP = getClientIP(req)
    if (config.blockedIPs.includes(clientIP)) {
      threats.push('Request from blocked IP address')
      riskLevel = 'critical'
      blocked = true
    }

    // 5. Validar headers sospechosos
    const suspiciousHeaders = detectSuspiciousHeaders(req.headers)
    if (suspiciousHeaders.length > 0) {
      threats.push(`Suspicious headers detected: ${suspiciousHeaders.join(', ')}`)
      riskLevel = 'medium'
    }

    // 6. Validar contenido del body
    if (req.body) {
      const bodyThreats = validateRequestBody(req.body, config.suspiciousPatterns)
      if (bodyThreats.length > 0) {
        threats.push(`Suspicious content in request body: ${bodyThreats.join(', ')}`)
        riskLevel = 'high'
        blocked = true
      }
    }

    // 7. Validar query parameters
    const queryThreats = validateQueryParameters(req.query, config.suspiciousPatterns)
    if (queryThreats.length > 0) {
      threats.push(`Suspicious content in query parameters: ${queryThreats.join(', ')}`)
      riskLevel = 'high'
      blocked = true
    }

    // 8. Validar método HTTP
    if (!isAllowedMethod(req.method)) {
      threats.push(`Disallowed HTTP method: ${req.method}`)
      riskLevel = 'medium'
      recommendations.push('Only allow GET, POST, PUT, DELETE methods')
    }

    // 9. Validar frecuencia de requests (básico)
    if (isHighFrequencyRequest(req)) {
      threats.push('High frequency request detected')
      riskLevel = 'medium'
      recommendations.push('Implement stricter rate limiting')
    }

    // 10. Generar recomendaciones adicionales
    if (threats.length === 0) {
      recommendations.push('Request appears secure')
    } else {
      recommendations.push('Review security logs regularly')
      recommendations.push('Consider implementing WAF (Web Application Firewall)')
    }

    return {
      isValid: threats.length === 0,
      riskLevel,
      threats,
      recommendations,
      blocked
    }

  } catch (error) {
    console.error('Error en validación de seguridad:', error)
    return {
      isValid: false,
      riskLevel: 'critical',
      threats: ['Security validation error'],
      recommendations: ['Review security validation system'],
      blocked: true
    }
  }
}

/**
 * Sanitiza datos de entrada
 */
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return sanitizeString(input)
  } else if (Array.isArray(input)) {
    return input.map(sanitizeInput)
  } else if (typeof input === 'object' && input !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(input)) {
      sanitized[sanitizeString(key)] = sanitizeInput(value)
    }
    return sanitized
  }
  return input
}

/**
 * Sanitiza una cadena de texto
 */
function sanitizeString(str: string): string {
  return str
    .replace(/[<>]/g, '') // Remover < y >
    .replace(/javascript:/gi, '') // Remover javascript:
    .replace(/on\w+=/gi, '') // Remover event handlers
    .replace(/script/gi, '') // Remover script
    .replace(/eval/gi, '') // Remover eval
    .replace(/expression/gi, '') // Remover CSS expressions
    .trim()
}

/**
 * Valida el origen de la solicitud
 */
function isAllowedOrigin(origin: string, allowedOrigins: string[]): boolean {
  try {
    const originUrl = new URL(origin)
    return allowedOrigins.some(allowed => {
      try {
        const allowedUrl = new URL(allowed)
        return originUrl.hostname === allowedUrl.hostname
      } catch {
        return false
      }
    })
  } catch {
    return false
  }
}

/**
 * Detecta User-Agents sospechosos
 */
function isSuspiciousUserAgent(userAgent: string): boolean {
  const suspiciousPatterns = [
    'bot',
    'crawler',
    'spider',
    'scraper',
    'curl',
    'wget',
    'python-requests',
    'postman',
    'insomnia'
  ]
  
  const lowerUA = userAgent.toLowerCase()
  return suspiciousPatterns.some(pattern => lowerUA.includes(pattern))
}

/**
 * Obtiene la IP del cliente
 */
function getClientIP(req: NextApiRequest): string {
  return req.headers['x-forwarded-for'] as string ||
         req.headers['x-real-ip'] as string ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         'unknown'
}

/**
 * Detecta headers sospechosos
 */
function detectSuspiciousHeaders(headers: any): string[] {
  const suspiciousHeaders: string[] = []
  
  const suspiciousHeaderNames = [
    'x-forwarded-host',
    'x-originating-ip',
    'x-remote-ip',
    'x-remote-addr',
    'x-cluster-client-ip'
  ]
  
  suspiciousHeaderNames.forEach((header: any) => {
    if (headers[header]) {
      suspiciousHeaders.push(header)
    }
  })
  
  return suspiciousHeaders
}

/**
 * Valida el contenido del body de la solicitud
 */
function validateRequestBody(body: any, suspiciousPatterns: string[]): string[] {
  const threats: string[] = []
  const bodyStr = JSON.stringify(body).toLowerCase()
  
  suspiciousPatterns.forEach((pattern: any) => {
    if (bodyStr.includes(pattern.toLowerCase())) {
      threats.push(pattern)
    }
  })
  
  return threats
}

/**
 * Valida los parámetros de query
 */
function validateQueryParameters(query: any, suspiciousPatterns: string[]): string[] {
  const threats: string[] = []
  const queryStr = JSON.stringify(query).toLowerCase()
  
  suspiciousPatterns.forEach((pattern: any) => {
    if (queryStr.includes(pattern.toLowerCase())) {
      threats.push(pattern)
    }
  })
  
  return threats
}

/**
 * Valida si el método HTTP está permitido
 */
function isAllowedMethod(method?: string): boolean {
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  return method ? allowedMethods.includes(method) : false
}

/**
 * Detecta requests de alta frecuencia (implementación básica)
 */
function isHighFrequencyRequest(req: NextApiRequest): boolean {
  // Implementación básica - en producción usar Redis o similar
  const clientIP = getClientIP(req)
  const now = Date.now()
  
  // Por ahora solo devolver false - implementar lógica real según necesidades
  return false
}

/**
 * Genera token CSRF
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Valida token CSRF
 */
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  try {
    return crypto.timingSafeEqual(
      Buffer.from(token, 'hex'),
      Buffer.from(sessionToken, 'hex')
    )
  } catch {
    return false
  }
}

/**
 * Encripta datos sensibles
 */
export function encryptSensitiveData(data: string, key: string): string {
  const cipher = crypto.createCipher('aes-256-cbc', key)
  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return encrypted
}

/**
 * Desencripta datos sensibles
 */
export function decryptSensitiveData(encryptedData: string, key: string): string {
  const decipher = crypto.createDecipher('aes-256-cbc', key)
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

/**
 * Genera hash seguro para passwords
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

/**
 * Verifica password contra hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  const [salt, hashValue] = hash.split(':')
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
  return crypto.timingSafeEqual(Buffer.from(hashValue, 'hex'), Buffer.from(verifyHash, 'hex'))
}

/**
 * Middleware de seguridad para APIs
 */
export function securityMiddleware(config: SecurityConfig = DEFAULT_SECURITY_CONFIG) {
  return async (req: NextApiRequest, res: any, next: any) => {
    const securityValidation = validateRequestSecurity(req, config)
    
    // Log de seguridad
    console.log(`🛡️ Security validation: ${securityValidation.riskLevel} risk`, {
      ip: getClientIP(req),
      threats: securityValidation.threats,
      blocked: securityValidation.blocked
    })
    
    if (securityValidation.blocked) {
      return res.status(403).json({
        error: 'Request blocked by security policy',
        threats: securityValidation.threats,
        riskLevel: securityValidation.riskLevel
      })
    }
    
    // Información de seguridad validada
    
    if (next) {
      await next()
    }
  }
}

/**
 * Obtiene estadísticas de seguridad
 */
export async function getSecurityStats(): Promise<{
  totalRequests: number
  blockedRequests: number
  threatsDetected: number
  riskLevelDistribution: Record<string, number>
}> {
  // Implementar según sistema de logging
  return {
    totalRequests: 0,
    blockedRequests: 0,
    threatsDetected: 0,
    riskLevelDistribution: {}
  }
}
