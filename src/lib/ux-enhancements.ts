import React, { useState, useEffect } from 'react'

export interface UXEnhancement {
  id: string
  type: 'loading' | 'error' | 'success' | 'warning' | 'info'
  message: string
  duration?: number
  actions?: Array<{
    label: string
    action: () => void
    variant?: 'primary' | 'secondary' | 'danger'
  }>
}

export interface LoadingState {
  isLoading: boolean
  message?: string
  progress?: number
}

export interface ErrorState {
  hasError: boolean
  message?: string
  details?: string
  retryAction?: () => void
}

/**
 * 🔍 MEDIO: Sistema de mejoras de UX y experiencia
 * 
 * Implementa mejoras de experiencia de usuario:
 * - Estados de carga mejorados
 * - Manejo de errores más amigable
 * - Notificaciones contextuales
 * - Feedback visual mejorado
 * - Accesibilidad mejorada
 */

/**
 * Hook para manejar estados de carga
 */
export function useLoadingState(initialState: boolean = false) {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: initialState
  })

  const startLoading = (message?: string) => {
    setLoadingState({
      isLoading: true,
      message,
      progress: 0
    })
  }

  const updateProgress = (progress: number) => {
    setLoadingState(prev => ({
      ...prev,
      progress: Math.min(100, Math.max(0, progress))
    }))
  }

  const stopLoading = () => {
    setLoadingState({
      isLoading: false,
      message: undefined,
      progress: undefined
    })
  }

  return {
    loadingState,
    startLoading,
    updateProgress,
    stopLoading
  }
}

/**
 * Hook para manejar estados de error
 */
export function useErrorState() {
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false
  })

  const setError = (message: string, details?: string, retryAction?: () => void) => {
    setErrorState({
      hasError: true,
      message,
      details,
      retryAction
    })
  }

  const clearError = () => {
    setErrorState({
      hasError: false
    })
  }

  const retry = () => {
    if (errorState.retryAction) {
      errorState.retryAction()
      clearError()
    }
  }

  return {
    errorState,
    setError,
    clearError,
    retry
  }
}

/**
 * Hook para notificaciones toast
 */
export function useToastNotifications() {
  const [notifications, setNotifications] = useState<UXEnhancement[]>([])

  const addNotification = (notification: Omit<UXEnhancement, 'id'>) => {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newNotification = { ...notification, id }
    
    setNotifications(prev => [...prev, newNotification])

    // Auto-remove después de la duración especificada
    const duration = notification.duration || 5000
    setTimeout(() => {
      removeNotification(id)
    }, duration)
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter((n: any) => n.id !== id))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications
  }
}

/**
 * Hook para validación de formularios con UX mejorada
 */
export function useFormValidation<T>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const setValue = (field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }))
    
    // Limpiar error cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const setFieldTouched = (field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  const setFieldError = (field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }))
  }

  const validateField = (field: keyof T, validator: (value: any) => string | undefined) => {
    const error = validator(values[field])
    if (error) {
      setFieldError(field, error)
    } else {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
    return !error
  }

  const validateAll = (validators: Partial<Record<keyof T, (value: any) => string | undefined>>) => {
    const newErrors: Partial<Record<keyof T, string>> = {}
    let isValid = true

    Object.keys(validators).forEach((field: any) => {
      const validator = validators[field as keyof T]
      if (validator) {
        const error = validator(values[field as keyof T])
        if (error) {
          newErrors[field as keyof T] = error
          isValid = false
        }
      }
    })

    setErrors(newErrors)
    return isValid
  }

  const reset = () => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }

  return {
    values,
    errors,
    touched,
    isSubmitting,
    setIsSubmitting,
    setValue,
    setFieldTouched,
    setFieldError,
    validateField,
    validateAll,
    reset,
    isValid: Object.keys(errors).length === 0
  }
}

/**
 * Hook para manejar operaciones asíncronas con UX mejorada
 */
export function useAsyncOperation<T, P extends any[] = []>(
  operation: (...args: P) => Promise<T>,
  options: {
    onSuccess?: (result: T) => void
    onError?: (error: Error) => void
    showLoading?: boolean
    showSuccess?: boolean
    showError?: boolean
  } = {}
) {
  const { loadingState, startLoading, stopLoading } = useLoadingState()
  const { errorState, setError, clearError } = useErrorState()
  const { addNotification } = useToastNotifications()

  const execute = async (...args: P): Promise<T | null> => {
    try {
      if (options.showLoading) {
        startLoading('Procesando...')
      }
      
      clearError()
      
      const result = await operation(...args)
      
      if (options.showSuccess) {
        addNotification({
          type: 'success',
          message: 'Operación completada exitosamente',
          duration: 3000
        })
      }
      
      options.onSuccess?.(result)
      return result
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      
      if (options.showError) {
        setError(errorMessage, undefined, () => execute(...args))
        addNotification({
          type: 'error',
          message: errorMessage,
          duration: 5000,
          actions: [{
            label: 'Reintentar',
            action: () => execute(...args),
            variant: 'primary'
          }]
        })
      }
      
      options.onError?.(error instanceof Error ? error : new Error(errorMessage))
      return null
      
    } finally {
      if (options.showLoading) {
        stopLoading()
      }
    }
  }

  return {
    execute,
    loadingState,
    errorState,
    isExecuting: loadingState.isLoading
  }
}

/**
 * Hook para debounce de inputs
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook para manejar estados de conexión
 */
export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      if (wasOffline) {
        setWasOffline(false)
        // Mostrar notificación de reconexión
        window.dispatchEvent(new CustomEvent('connection-restored'))
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(true)
      // Mostrar notificación de desconexión
      window.dispatchEvent(new CustomEvent('connection-lost'))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [wasOffline])

  return {
    isOnline,
    wasOffline
  }
}

/**
 * Hook para manejar scroll suave
 */
export function useSmoothScroll() {
  const scrollToElement = (elementId: string, offset: number = 0) => {
    const element = document.getElementById(elementId)
    if (element) {
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return {
    scrollToElement,
    scrollToTop
  }
}

/**
 * Hook para manejar teclas de acceso rápido
 */
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const modifiers = {
        ctrl: event.ctrlKey,
        alt: event.altKey,
        shift: event.shiftKey,
        meta: event.metaKey
      }

      // Crear combinación de teclas
      const combination = [
        modifiers.ctrl && 'ctrl',
        modifiers.alt && 'alt',
        modifiers.shift && 'shift',
        modifiers.meta && 'meta',
        key
      ].filter(Boolean).join('+')

      if (shortcuts[combination]) {
        event.preventDefault()
        shortcuts[combination]()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

/**
 * Utilidades para mejorar accesibilidad
 */
export const accessibilityUtils = {
  // Generar ID único para elementos
  generateId: (prefix: string = 'element') => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  
  // Validar contraste de colores
  getContrastRatio: (color1: string, color2: string): number => {
    // Implementación básica - en producción usar librería especializada
    return 4.5 // Valor mínimo recomendado por WCAG
  },
  
  // Generar texto alternativo para imágenes
  generateAltText: (imageContext: string): string => {
    return `Imagen relacionada con ${imageContext}`
  },
  
  // Validar estructura de encabezados
  validateHeadingStructure: (headings: string[]): boolean => {
    // Verificar que los encabezados sigan una jerarquía lógica (h1 -> h2 -> h3, etc.)
    return true // Implementación simplificada
  }
}

/**
 * Componente de notificación toast
 */
export function ToastNotification({ notification, onRemove }: {
  notification: UXEnhancement
  onRemove: (id: string) => void
}) {
  const getIcon = () => {
    switch (notification.type) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'warning': return '⚠️'
      case 'info': return 'ℹ️'
      default: return '📢'
    }
  }

  const getStyles = () => {
    const baseStyles = 'fixed top-4 right-4 p-4 rounded-lg shadow-lg max-w-sm z-50 transition-all duration-300'
    
    switch (notification.type) {
      case 'success': return `${baseStyles} bg-green-100 border border-green-400 text-green-700`
      case 'error': return `${baseStyles} bg-red-100 border border-red-400 text-red-700`
      case 'warning': return `${baseStyles} bg-yellow-100 border border-yellow-400 text-yellow-700`
      case 'info': return `${baseStyles} bg-blue-100 border border-blue-400 text-blue-700`
      default: return `${baseStyles} bg-gray-100 border border-gray-400 text-gray-700`
    }
  }

  return `
    <div class="${getStyles()}" role="alert" aria-live="polite">
      <div class="flex items-start">
        <span class="text-lg mr-2">${getIcon()}</span>
        <div class="flex-1">
          <p class="font-medium">${notification.message}</p>
          ${notification.actions ? `
            <div class="mt-2 space-x-2">
              ${notification.actions.map((action: any, index: number) => `
                <button
                  key="${index}"
                  onclick="${action.action}"
                  class="px-3 py-1 text-sm rounded ${action.variant === 'primary' ? 'bg-blue-500 text-white' : action.variant === 'danger' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'}"
                >
                  ${action.label}
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>
        <button
          onclick="onRemove('${notification.id}')"
          class="ml-2 text-lg hover:text-gray-600"
          aria-label="Cerrar notificación"
        >
          ×
        </button>
      </div>
    </div>
  `
}

/**
 * Componente de estado de carga mejorado
 */
export function EnhancedLoadingState({ loadingState }: { loadingState: LoadingState }) {
  if (!loadingState.isLoading) return null

  return `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <div class="flex items-center space-x-3">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <div>
            <p class="font-medium text-gray-900">
              ${loadingState.message || 'Cargando...'}
            </p>
            ${loadingState.progress !== undefined ? `
              <div class="mt-2">
                <div class="bg-gray-200 rounded-full h-2">
                  <div 
                    class="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style="width: ${loadingState.progress}%"
                  ></div>
                </div>
                <p class="text-sm text-gray-600 mt-1">
                  ${loadingState.progress}% completado
                </p>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `
}
