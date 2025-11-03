/**
 * Utilidad de logging condicional para evitar logs en producción
 * 🔧 FIX: Bug E1 - Remover logs de producción
 */

const isDevelopment = process.env.NODE_ENV === 'development'
const isClient = typeof window !== 'undefined'

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args)
    }
  },
  
  error: (...args: any[]) => {
    // Errores siempre se loguean, incluso en producción
    console.error(...args)
  },
  
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args)
    }
  },
  
  // Para el cliente (browser)
  client: {
    log: (...args: any[]) => {
      if (isDevelopment && isClient) {
        console.log(...args)
      }
    },
    
    warn: (...args: any[]) => {
      if (isDevelopment && isClient) {
        console.warn(...args)
      }
    },
    
    error: (...args: any[]) => {
      // Errores siempre se loguean
      if (isClient) {
        console.error(...args)
      }
    }
  }
}

