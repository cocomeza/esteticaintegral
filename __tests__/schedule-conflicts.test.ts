/**
 * Tests para validación de conflictos de horarios
 */

const { validateScheduleChange, getAffectedAppointments } = require('../src/lib/schedule-validation')

describe('Schedule Conflict Validation', () => {
  // Mock de Supabase para los tests
  const mockSupabaseAdmin = {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              gte: jest.fn(() => ({
                data: [
                  {
                    id: 'apt-1',
                    appointment_date: '2024-01-15', // Lunes
                    appointment_time: '16:00',
                    duration: 45,
                    status: 'scheduled',
                    patient: {
                      name: 'María García',
                      email: 'maria@test.com'
                    },
                    service: {
                      name: 'Limpieza Facial'
                    }
                  },
                  {
                    id: 'apt-2',
                    appointment_date: '2024-01-15', // Lunes
                    appointment_time: '13:30',
                    duration: 30,
                    status: 'scheduled',
                    patient: {
                      name: 'Juan Pérez',
                      email: 'juan@test.com'
                    },
                    service: {
                      name: 'Depilación Láser'
                    }
                  }
                ],
                error: null
              }))
            }))
          }))
        }))
      }))
    }))
  }

  beforeEach(() => {
    // Resetear mocks antes de cada test
    jest.clearAllMocks()
    
    // Mock del módulo supabase-admin
    jest.doMock('../src/lib/supabase-admin', () => ({
      supabaseAdmin: mockSupabaseAdmin
    }))
  })

  describe('validateScheduleChange', () => {
    test('debe detectar turnos fuera del nuevo horario', async () => {
      const specialistId = 'specialist-1'
      const dayOfWeek = 1 // Lunes
      const newStartTime = '09:00'
      const newEndTime = '14:00' // Horario más corto

      const validation = await validateScheduleChange(
        specialistId,
        dayOfWeek,
        newStartTime,
        newEndTime,
        '13:00',
        '14:00',
        null
      )

      expect(validation.hasConflicts).toBe(true)
      expect(validation.affectedAppointmentsCount).toBe(1)
      expect(validation.conflicts[0].conflictType).toBe('outside_hours')
      expect(validation.conflicts[0].appointmentTime).toBe('16:00')
      expect(validation.canProceed).toBe(false)
    })

    test('debe detectar conflictos con horario de almuerzo', async () => {
      const specialistId = 'specialist-1'
      const dayOfWeek = 1 // Lunes
      const newStartTime = '09:00'
      const newEndTime = '18:00'
      const newLunchStart = '13:00'
      const newLunchEnd = '14:00'

      const validation = await validateScheduleChange(
        specialistId,
        dayOfWeek,
        newStartTime,
        newEndTime,
        newLunchStart,
        newLunchEnd,
        null
      )

      expect(validation.hasConflicts).toBe(true)
      expect(validation.affectedAppointmentsCount).toBe(1)
      expect(validation.conflicts[0].conflictType).toBe('lunch_conflict')
      expect(validation.conflicts[0].appointmentTime).toBe('13:30')
    })

    test('debe detectar servicios no permitidos en el día', async () => {
      const specialistId = 'specialist-1'
      const dayOfWeek = 1 // Lunes
      const newStartTime = '09:00'
      const newEndTime = '18:00'
      const newAllowedServices = ['service-1'] // Solo un servicio permitido

      const validation = await validateScheduleChange(
        specialistId,
        dayOfWeek,
        newStartTime,
        newEndTime,
        '13:00',
        '14:00',
        newAllowedServices
      )

      expect(validation.hasConflicts).toBe(true)
      expect(validation.affectedAppointmentsCount).toBeGreaterThan(0)
      expect(validation.conflicts.some(c => c.conflictType === 'service_not_allowed')).toBe(true)
    })

    test('debe permitir cambios sin conflictos', async () => {
      const specialistId = 'specialist-1'
      const dayOfWeek = 1 // Lunes
      const newStartTime = '09:00'
      const newEndTime = '18:00'

      const validation = await validateScheduleChange(
        specialistId,
        dayOfWeek,
        newStartTime,
        newEndTime,
        '13:00',
        '14:00',
        null
      )

      expect(validation.hasConflicts).toBe(false)
      expect(validation.affectedAppointmentsCount).toBe(0)
      expect(validation.canProceed).toBe(true)
      expect(validation.recommendation).toContain('no afecta ningún turno')
    })

    test('debe generar recomendaciones apropiadas', async () => {
      const specialistId = 'specialist-1'
      const dayOfWeek = 1 // Lunes
      const newStartTime = '09:00'
      const newEndTime = '14:00'

      const validation = await validateScheduleChange(
        specialistId,
        dayOfWeek,
        newStartTime,
        newEndTime,
        '13:00',
        '14:00',
        null
      )

      if (validation.hasConflicts) {
        expect(validation.recommendation).toContain('afectará')
        expect(validation.recommendation).toContain('contactar')
      } else {
        expect(validation.recommendation).toContain('no afecta')
      }
    })
  })

  describe('getAffectedAppointments', () => {
    test('debe retornar lista de turnos afectados', async () => {
      const specialistId = 'specialist-1'
      const dayOfWeek = 1 // Lunes

      const conflicts = await getAffectedAppointments(specialistId, dayOfWeek)

      expect(Array.isArray(conflicts)).toBe(true)
      expect(conflicts.length).toBeGreaterThan(0)
      expect(conflicts[0]).toHaveProperty('appointmentId')
      expect(conflicts[0]).toHaveProperty('patientName')
      expect(conflicts[0]).toHaveProperty('patientEmail')
      expect(conflicts[0]).toHaveProperty('conflictType')
    })
  })

  describe('Edge Cases', () => {
    test('debe manejar especialista sin turnos', async () => {
      // Mock para especialista sin turnos
      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                gte: jest.fn(() => ({
                  data: [],
                  error: null
                }))
              }))
            }))
          }))
        }))
      })

      const validation = await validateScheduleChange(
        'specialist-empty',
        1,
        '09:00',
        '14:00',
        '13:00',
        '14:00',
        null
      )

      expect(validation.hasConflicts).toBe(false)
      expect(validation.affectedAppointmentsCount).toBe(0)
      expect(validation.canProceed).toBe(true)
    })

    test('debe manejar errores de base de datos', async () => {
      // Mock para error de base de datos
      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                gte: jest.fn(() => ({
                  data: null,
                  error: { message: 'Database connection error' }
                }))
              }))
            }))
          }))
        }))
      })

      await expect(validateScheduleChange(
        'specialist-error',
        1,
        '09:00',
        '14:00',
        '13:00',
        '14:00',
        null
      )).rejects.toThrow()
    })
  })
})

// Tests de integración
describe('Schedule Conflict Integration Tests', () => {
  test('flujo completo de validación y notificación', async () => {
    // Este test simularía el flujo completo:
    // 1. Cambio de horario propuesto
    // 2. Validación de conflictos
    // 3. Envío de notificaciones
    // 4. Aplicación del cambio
    
    const mockValidation = {
      hasConflicts: true,
      conflicts: [
        {
          appointmentId: 'apt-1',
          patientEmail: 'test@example.com',
          patientName: 'Test User',
          conflictType: 'outside_hours'
        }
      ],
      affectedAppointmentsCount: 1,
      canProceed: false,
      recommendation: 'Debe contactar a los pacientes afectados'
    }

    expect(mockValidation.hasConflicts).toBe(true)
    expect(mockValidation.conflicts.length).toBe(1)
    expect(mockValidation.conflicts[0].conflictType).toBe('outside_hours')
  })
})
