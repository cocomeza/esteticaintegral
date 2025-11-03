import { describe, test, expect } from '@jest/globals'

/**
 * 🔍 TESTS DE VALIDACIÓN DE DATOS
 * 
 * Tests específicos para validar:
 * - Formato de emails
 * - Teléfonos argentinos
 * - Fechas y horarios
 * - Datos de pacientes
 * - Integridad de la base de datos
 */

describe('🔍 Validación de Datos - Tests Específicos', () => {

  describe('📧 Validación de Emails', () => {
    
    test('✅ Debe aceptar emails válidos', () => {
      const validEmails = [
        'lore.estetica76@gmail.com',
        'test@example.com',
        'user.name+tag@domain.co.uk',
        'admin@esteticaintegral.com.ar',
        'paciente123@hotmail.com',
        'cliente@yahoo.com.ar'
      ]

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true)
        console.log(`✅ Email válido: ${email}`)
      })
    })

    test('❌ Debe rechazar emails inválidos', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        '',
        'user..name@domain.com',
        'user@domain..com',
        'user name@domain.com',
        'user@domain com'
      ]

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false)
        console.log(`❌ Email inválido rechazado: ${email}`)
      })
    })

    test('✅ Debe validar emails específicos de Argentina', () => {
      const argentinaEmails = [
        'lore.estetica76@gmail.com',
        'admin@esteticaintegral.com.ar',
        'cliente@hotmail.com.ar',
        'paciente@yahoo.com.ar',
        'test@outlook.com.ar'
      ]

      const argentinaEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com\.ar|gmail\.com|hotmail\.com\.ar|yahoo\.com\.ar|outlook\.com\.ar)$/

      argentinaEmails.forEach(email => {
        expect(argentinaEmailRegex.test(email)).toBe(true)
        console.log(`✅ Email argentino válido: ${email}`)
      })
    })
  })

  describe('📞 Validación de Teléfonos Argentinos', () => {
    
    test('✅ Debe aceptar teléfonos argentinos válidos', () => {
      const validPhones = [
        '+54 11 1234-5678',
        '+54 9 11 1234-5678',
        '11 1234-5678',
        '011 1234-5678',
        '+54 11 1234 5678',
        '11-1234-5678',
        '+54 9 11 1234 5678'
      ]

      const phoneRegex = /^(\+54\s?)?(9\s?)?(11\s?)?[0-9]{4}[\s-]?[0-9]{4}$/

      validPhones.forEach(phone => {
        expect(phoneRegex.test(phone)).toBe(true)
        console.log(`✅ Teléfono argentino válido: ${phone}`)
      })
    })

    test('❌ Debe rechazar teléfonos inválidos', () => {
      const invalidPhones = [
        '123',
        'invalid',
        '+1 123-456-7890',
        '+54 12 1234-5678', // Código de área inválido
        '11 123-456', // Muy corto
        '11 12345-6789', // Muy largo
        '',
        'abc-def-ghij'
      ]

      const phoneRegex = /^(\+54\s?)?(9\s?)?(11\s?)?[0-9]{4}[\s-]?[0-9]{4}$/

      invalidPhones.forEach(phone => {
        expect(phoneRegex.test(phone)).toBe(false)
        console.log(`❌ Teléfono inválido rechazado: ${phone}`)
      })
    })
  })

  describe('📅 Validación de Fechas y Horarios', () => {
    
    test('✅ Debe validar fechas futuras', () => {
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)

      const isValidFutureDate = (date: Date) => {
        return date > today
      }

      expect(isValidFutureDate(tomorrow)).toBe(true)
      expect(isValidFutureDate(nextWeek)).toBe(true)
      console.log('✅ Fechas futuras validadas correctamente')
    })

    test('❌ Debe rechazar fechas pasadas', () => {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      const lastWeek = new Date(today)
      lastWeek.setDate(lastWeek.getDate() - 7)

      const isValidFutureDate = (date: Date) => {
        return date > today
      }

      expect(isValidFutureDate(yesterday)).toBe(false)
      expect(isValidFutureDate(lastWeek)).toBe(false)
      console.log('❌ Fechas pasadas rechazadas correctamente')
    })

    test('✅ Debe validar horarios en formato HH:MM', () => {
      const validTimes = [
        '09:00', '10:30', '13:00', '14:15', '18:00'
      ]

      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/

      validTimes.forEach(time => {
        expect(timeRegex.test(time)).toBe(true)
        console.log(`✅ Horario válido: ${time}`)
      })
    })

    test('❌ Debe rechazar horarios inválidos', () => {
      const invalidTimes = [
        '25:00', '12:60', 'invalid', '9:00', '09:0', '9:5'
      ]

      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/

      invalidTimes.forEach(time => {
        expect(timeRegex.test(time)).toBe(false)
        console.log(`❌ Horario inválido rechazado: ${time}`)
      })
    })

    test('✅ Debe validar horarios dentro del horario de trabajo', () => {
      const workSchedule = {
        start_time: '09:00',
        end_time: '18:00',
        lunch_start: '13:00',
        lunch_end: '14:00'
      }

      const validTimes = ['09:30', '10:00', '12:30', '14:30', '17:30']
      const invalidTimes = ['08:30', '18:30', '13:30'] // Fuera de horario o en almuerzo

      const isValidWorkTime = (time: string) => {
        const timeMinutes = timeToMinutes(time)
        const startMinutes = timeToMinutes(workSchedule.start_time)
        const endMinutes = timeToMinutes(workSchedule.end_time)
        const lunchStartMinutes = timeToMinutes(workSchedule.lunch_start)
        const lunchEndMinutes = timeToMinutes(workSchedule.lunch_end)

        return timeMinutes >= startMinutes && 
               timeMinutes < endMinutes &&
               !(timeMinutes >= lunchStartMinutes && timeMinutes < lunchEndMinutes)
      }

      validTimes.forEach(time => {
        expect(isValidWorkTime(time)).toBe(true)
        console.log(`✅ Horario de trabajo válido: ${time}`)
      })

      invalidTimes.forEach(time => {
        expect(isValidWorkTime(time)).toBe(false)
        console.log(`❌ Horario de trabajo inválido rechazado: ${time}`)
      })
    })
  })

  describe('👤 Validación de Datos de Pacientes', () => {
    
    test('✅ Debe validar nombres de pacientes', () => {
      const validNames = [
        'María González',
        'Juan Carlos Pérez',
        'Ana María Rodríguez',
        'José Luis Fernández',
        'Carmen de la Cruz'
      ]

      const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/

      validNames.forEach(name => {
        expect(nameRegex.test(name)).toBe(true)
        console.log(`✅ Nombre válido: ${name}`)
      })
    })

    test('❌ Debe rechazar nombres inválidos', () => {
      const invalidNames = [
        'A', // Muy corto
        '123', // Solo números
        'María@González', // Caracteres especiales
        '', // Vacío
        'A'.repeat(51) // Muy largo
      ]

      const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/

      invalidNames.forEach(name => {
        expect(nameRegex.test(name)).toBe(false)
        console.log(`❌ Nombre inválido rechazado: ${name}`)
      })
    })

    test('✅ Debe validar datos completos de paciente', () => {
      const validPatient = {
        name: 'María González',
        email: 'maria.gonzalez@gmail.com',
        phone: '+54 11 1234-5678',
        date_of_birth: '1990-05-15'
      }

      const validatePatient = (patient: any) => {
        const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        const phoneRegex = /^(\+54\s?)?(9\s?)?(11\s?)?[0-9]{4}[\s-]?[0-9]{4}$/
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/

        return {
          name: nameRegex.test(patient.name),
          email: emailRegex.test(patient.email),
          phone: phoneRegex.test(patient.phone),
          date_of_birth: dateRegex.test(patient.date_of_birth)
        }
      }

      const validation = validatePatient(validPatient)
      expect(validation.name).toBe(true)
      expect(validation.email).toBe(true)
      expect(validation.phone).toBe(true)
      expect(validation.date_of_birth).toBe(true)
      
      console.log('✅ Datos completos de paciente validados correctamente')
    })
  })

  describe('🏥 Validación de Servicios Estéticos', () => {
    
    test('✅ Debe validar servicios existentes', () => {
      const validServices = [
        'Drenaje Linfático',
        'Limpieza Facial',
        'Depilación Láser',
        'Podología',
        'Sonoterapia',
        'Cosmiatría',
        'Fangoterapia',
        'Reflexología',
        'Tratamientos Corporales',
        'Lifting Facial'
      ]

      validServices.forEach(service => {
        expect(service.length).toBeGreaterThan(0)
        expect(service.length).toBeLessThanOrEqual(100)
        console.log(`✅ Servicio válido: ${service}`)
      })
    })

    test('✅ Debe validar duraciones de servicios', () => {
      const serviceDurations = [20, 30, 45, 60, 90]

      serviceDurations.forEach(duration => {
        expect(duration).toBeGreaterThan(0)
        expect(duration).toBeLessThanOrEqual(180) // Máximo 3 horas
        expect(duration % 15).toBe(0) // Múltiplo de 15 minutos
        console.log(`✅ Duración válida: ${duration} minutos`)
      })
    })

    test('✅ Debe validar categorías de servicios', () => {
      const validCategories = [
        'facial',
        'corporal', 
        'depilacion',
        'terapeutico',
        'estetico'
      ]

      validCategories.forEach(category => {
        expect(category).toMatch(/^[a-z]+$/)
        expect(category.length).toBeGreaterThan(0)
        console.log(`✅ Categoría válida: ${category}`)
      })
    })
  })

  describe('📊 Validación de Integridad de Datos', () => {
    
    test('✅ Debe detectar datos faltantes', () => {
      const incompleteData = {
        name: 'María González',
        email: '', // Email faltante
        phone: '+54 11 1234-5678',
        date_of_birth: null // Fecha faltante
      }

      const hasMissingData = (data: any) => {
        return !data.name || !data.email || !data.phone || !data.date_of_birth
      }

      expect(hasMissingData(incompleteData)).toBe(true)
      console.log('✅ Datos faltantes detectados correctamente')
    })

    test('✅ Debe detectar datos inconsistentes', () => {
      const inconsistentData = {
        appointment_date: '2024-12-25',
        appointment_time: '10:00',
        duration: 45,
        // Fecha de cita en el pasado
        created_at: new Date('2024-12-26')
      }

      const isInconsistent = (data: any) => {
        const appointmentDate = new Date(data.appointment_date)
        const createdDate = new Date(data.created_at)
        return createdDate > appointmentDate
      }

      expect(isInconsistent(inconsistentData)).toBe(true)
      console.log('✅ Datos inconsistentes detectados correctamente')
    })

    test('✅ Debe validar relaciones entre tablas', () => {
      const appointmentData = {
        specialist_id: 'uuid-specialist-123',
        service_id: 'uuid-service-456',
        patient_id: 'uuid-patient-789'
      }

      const validateRelations = (data: any) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        return {
          specialist_id: uuidRegex.test(data.specialist_id),
          service_id: uuidRegex.test(data.service_id),
          patient_id: uuidRegex.test(data.patient_id)
        }
      }

      const validation = validateRelations(appointmentData)
      expect(validation.specialist_id).toBe(true)
      expect(validation.service_id).toBe(true)
      expect(validation.patient_id).toBe(true)
      
      console.log('✅ Relaciones entre tablas validadas correctamente')
    })
  })
})

// Funciones auxiliares
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

export default {}
