/**
 * Tests para validación de overlap de horarios
 * 🧪 Testing crítico para Bug #3
 */

describe('Validación de Overlap de Horarios', () => {
  describe('checkOverlap', () => {
    // Función helper para verificar overlap
    function checkOverlap(
      proposedStart: number,
      proposedEnd: number,
      occupiedStart: number,
      occupiedEnd: number
    ): boolean {
      return (
        (proposedStart >= occupiedStart && proposedStart < occupiedEnd) ||
        (proposedEnd > occupiedStart && proposedEnd <= occupiedEnd) ||
        (proposedStart <= occupiedStart && proposedEnd >= occupiedEnd)
      )
    }

    test('debe detectar overlap cuando propuesta empieza durante ocupado', () => {
      // Ocupado: 10:00-10:45 (600-645 min)
      // Propuesta: 10:30-11:15 (630-675 min)
      expect(checkOverlap(630, 675, 600, 645)).toBe(true)
    })

    test('debe detectar overlap cuando propuesta termina durante ocupado', () => {
      // Ocupado: 10:00-10:45 (600-645 min)
      // Propuesta: 9:30-10:15 (570-615 min)
      expect(checkOverlap(570, 615, 600, 645)).toBe(true)
    })

    test('debe detectar overlap cuando propuesta contiene completamente ocupado', () => {
      // Ocupado: 10:00-10:45 (600-645 min)
      // Propuesta: 9:00-11:00 (540-660 min)
      expect(checkOverlap(540, 660, 600, 645)).toBe(true)
    })

    test('debe detectar overlap cuando ocupado contiene completamente propuesta', () => {
      // Ocupado: 10:00-11:00 (600-660 min)
      // Propuesta: 10:15-10:45 (615-645 min)
      expect(checkOverlap(615, 645, 600, 660)).toBe(true)
    })

    test('NO debe detectar overlap cuando propuesta es antes de ocupado', () => {
      // Ocupado: 10:00-10:45 (600-645 min)
      // Propuesta: 9:00-10:00 (540-600 min)
      expect(checkOverlap(540, 600, 600, 645)).toBe(false)
    })

    test('NO debe detectar overlap cuando propuesta es después de ocupado', () => {
      // Ocupado: 10:00-10:45 (600-645 min)
      // Propuesta: 10:45-11:30 (645-690 min)
      expect(checkOverlap(645, 690, 600, 645)).toBe(false)
    })

    test('caso real: servicio 45min a las 10:00, verificar 10:30 no disponible', () => {
      // Cita existente: 10:00-10:45
      const existingStart = 10 * 60 // 10:00 = 600 min
      const existingEnd = existingStart + 45 // 10:45 = 645 min
      
      // Intentar reservar a las 10:30 por 45 min
      const proposedStart = 10 * 60 + 30 // 10:30 = 630 min
      const proposedEnd = proposedStart + 45 // 11:15 = 675 min
      
      expect(checkOverlap(proposedStart, proposedEnd, existingStart, existingEnd)).toBe(true)
    })

    test('caso real: servicio 45min a las 10:00, verificar 10:45 SÍ disponible', () => {
      // Cita existente: 10:00-10:45
      const existingStart = 10 * 60 // 10:00 = 600 min
      const existingEnd = existingStart + 45 // 10:45 = 645 min
      
      // Intentar reservar a las 10:45 por 45 min
      const proposedStart = 10 * 60 + 45 // 10:45 = 645 min
      const proposedEnd = proposedStart + 45 // 11:30 = 690 min
      
      expect(checkOverlap(proposedStart, proposedEnd, existingStart, existingEnd)).toBe(false)
    })
  })

  describe('Múltiples citas ocupadas', () => {
    function isTimeSlotAvailable(
      proposedStart: number,
      proposedEnd: number,
      occupiedSlots: Array<{ start: number; end: number }>
    ): boolean {
      for (const slot of occupiedSlots) {
        if (
          (proposedStart >= slot.start && proposedStart < slot.end) ||
          (proposedEnd > slot.start && proposedEnd <= slot.end) ||
          (proposedStart <= slot.start && proposedEnd >= slot.end)
        ) {
          return false // Hay overlap
        }
      }
      return true // No hay overlap
    }

    test('debe manejar múltiples citas ocupadas correctamente', () => {
      const occupiedSlots = [
        { start: 540, end: 585 },  // 9:00-9:45
        { start: 600, end: 645 },  // 10:00-10:45
        { start: 720, end: 765 },  // 12:00-12:45
      ]

      // Intentar 9:30-10:15 (debería fallar por overlap con 9:00 y 10:00)
      expect(isTimeSlotAvailable(570, 615, occupiedSlots)).toBe(false)

      // Intentar 9:45-10:30 (debería fallar por overlap con 10:00)
      expect(isTimeSlotAvailable(585, 630, occupiedSlots)).toBe(false)

      // Intentar 10:45-11:30 (debería estar disponible)
      expect(isTimeSlotAvailable(645, 690, occupiedSlots)).toBe(true)

      // Intentar 11:00-11:45 (debería estar disponible)
      expect(isTimeSlotAvailable(660, 705, occupiedSlots)).toBe(true)

      // Intentar 12:30-13:15 (debería fallar por overlap con 12:00)
      expect(isTimeSlotAvailable(750, 795, occupiedSlots)).toBe(false)
    })
  })

  describe('Horario de almuerzo', () => {
    test('debe excluir horario de almuerzo como ocupado', () => {
      const occupiedSlots = [
        { start: 780, end: 840 }, // 13:00-14:00 (almuerzo)
      ]

      // Intentar 13:00-13:45
      expect(
        isTimeSlotAvailable(780, 825, occupiedSlots)
      ).toBe(false)

      // Intentar 13:30-14:15
      expect(
        isTimeSlotAvailable(810, 855, occupiedSlots)
      ).toBe(false)

      // Intentar 14:00-14:45 (después del almuerzo)
      expect(
        isTimeSlotAvailable(840, 885, occupiedSlots)
      ).toBe(true)
    })

    function isTimeSlotAvailable(
      proposedStart: number,
      proposedEnd: number,
      occupiedSlots: Array<{ start: number; end: number }>
    ): boolean {
      for (const slot of occupiedSlots) {
        if (
          (proposedStart >= slot.start && proposedStart < slot.end) ||
          (proposedEnd > slot.start && proposedEnd <= slot.end) ||
          (proposedStart <= slot.start && proposedEnd >= slot.end)
        ) {
          return false
        }
      }
      return true
    }
  })
})

