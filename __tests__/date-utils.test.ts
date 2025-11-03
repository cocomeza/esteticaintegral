/**
 * Tests para utilidades de fechas
 * 🧪 Testing para manejo correcto de fechas sin timezone issues
 */

import { 
  getTodayString, 
  formatDateForAPI, 
  parseLocalDate, 
  getDayOfWeek,
  isValidDateString,
  fixDateFromDatabase 
} from '../src/lib/date-utils'

describe('Date Utils', () => {
  describe('getTodayString', () => {
    test('debe retornar fecha en formato YYYY-MM-DD', () => {
      const today = getTodayString()
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    test('debe retornar la fecha actual local', () => {
      const today = getTodayString()
      const now = new Date()
      const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      expect(today).toBe(expected)
    })
  })

  describe('formatDateForAPI', () => {
    test('debe formatear Date a YYYY-MM-DD', () => {
      const date = new Date(2024, 0, 15) // 15 de enero 2024
      expect(formatDateForAPI(date)).toBe('2024-01-15')
    })

    test('debe agregar ceros a la izquierda', () => {
      const date = new Date(2024, 0, 5) // 5 de enero 2024
      expect(formatDateForAPI(date)).toBe('2024-01-05')
    })

    test('debe manejar fin de año', () => {
      const date = new Date(2024, 11, 31) // 31 de diciembre 2024
      expect(formatDateForAPI(date)).toBe('2024-12-31')
    })
  })

  describe('parseLocalDate', () => {
    test('debe parsear YYYY-MM-DD a Date local', () => {
      const date = parseLocalDate('2024-01-15')
      expect(date.getFullYear()).toBe(2024)
      expect(date.getMonth()).toBe(0) // Enero = 0
      expect(date.getDate()).toBe(15)
    })

    test('debe evitar problemas de timezone', () => {
      // Fecha que históricamente causaba problemas
      const date = parseLocalDate('2024-01-30')
      expect(date.getDate()).toBe(30)
      expect(date.getMonth()).toBe(0)
    })
  })

  describe('getDayOfWeek', () => {
    test('debe retornar día de la semana correcto', () => {
      // 2024-01-01 es lunes (1)
      expect(getDayOfWeek('2024-01-01')).toBe(1)
      
      // 2024-01-07 es domingo (0)
      expect(getDayOfWeek('2024-01-07')).toBe(0)
      
      // 2024-01-06 es sábado (6)
      expect(getDayOfWeek('2024-01-06')).toBe(6)
    })
  })

  describe('isValidDateString', () => {
    test('debe validar fechas correctas', () => {
      expect(isValidDateString('2024-01-15')).toBe(true)
      expect(isValidDateString('2024-12-31')).toBe(true)
      expect(isValidDateString('2024-02-29')).toBe(true) // Año bisiesto
    })

    test('debe rechazar fechas inválidas', () => {
      expect(isValidDateString('2024-13-01')).toBe(false) // Mes inválido
      expect(isValidDateString('2024-02-30')).toBe(false) // Día inválido
      expect(isValidDateString('2023-02-29')).toBe(false) // No bisiesto
      expect(isValidDateString('2024/01/15')).toBe(false) // Formato incorrecto
      expect(isValidDateString('15-01-2024')).toBe(false) // Orden incorrecto
      expect(isValidDateString('')).toBe(false)
      expect(isValidDateString('invalid')).toBe(false)
    })
  })

  describe('fixDateFromDatabase', () => {
    test('debe mantener fechas ya válidas', () => {
      expect(fixDateFromDatabase('2024-01-15')).toBe('2024-01-15')
    })

    test('debe corregir fechas con timestamp', () => {
      const fixed = fixDateFromDatabase('2024-01-15T10:30:00.000Z')
      expect(fixed).toMatch(/^2024-01-\d{2}$/)
    })

    test('debe manejar fechas inválidas sin crash', () => {
      const result = fixDateFromDatabase('invalid-date')
      expect(typeof result).toBe('string')
    })
  })
})

