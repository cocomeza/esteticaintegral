'use client'
import { useState, useEffect } from 'react'
import { Clock, Plus, Edit, Trash2, Save, X, Calendar, AlertTriangle } from 'lucide-react'

interface WorkSchedule {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  lunch_start: string | null
  lunch_end: string | null
  is_active: boolean
}

interface ScheduleManagerProps {
  specialistId: string
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' }
]

export default function ScheduleManager({ specialistId }: ScheduleManagerProps) {
  const [schedules, setSchedules] = useState<WorkSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '18:45',
    lunchStart: '13:00',
    lunchEnd: '14:00'
  })
  const [validation, setValidation] = useState<any>(null)
  const [isValidating, setIsValidating] = useState(false)

  useEffect(() => {
    fetchSchedules()
  }, [specialistId])

  // Validar conflictos cuando se edita un horario
  useEffect(() => {
    if (editingId && formData.startTime && formData.endTime) {
      validateScheduleChange()
    }
  }, [editingId, formData.startTime, formData.endTime, formData.lunchStart, formData.lunchEnd])

  const validateScheduleChange = async () => {
    if (!editingId) return

    const schedule = schedules.find(s => s.id === editingId)
    if (!schedule) return

    setIsValidating(true)
    try {
      const response = await fetch('/api/admin/schedules/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specialistId,
          dayOfWeek: schedule.day_of_week,
          newStartTime: formData.startTime,
          newEndTime: formData.endTime,
          newLunchStart: formData.lunchStart || null,
          newLunchEnd: formData.lunchEnd || null
        })
      })

      const data = await response.json()
      setValidation(data.validation)
    } catch (error) {
      console.error('Error validating schedule:', error)
      setValidation({ hasConflicts: false, canProceed: true, conflicts: [] })
    } finally {
      setIsValidating(false)
    }
  }

  const fetchSchedules = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/schedules?specialistId=${specialistId}`)
      const data = await response.json()
      setSchedules(data.schedules || [])
    } catch (error) {
      console.error('Error fetching schedules:', error)
      setSchedules([])
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    // Si hay conflictos, pedir confirmación
    if (editingId && validation?.hasConflicts) {
      const confirmMessage = `⚠️ Este cambio afectará ${validation.affectedAppointmentsCount} turno(s) existente(s) para ${getDayLabel(formData.dayOfWeek)}.\n\n¿Desea continuar?`
      if (!confirm(confirmMessage)) {
        return
      }
    }

    try {
      const method = editingId ? 'PUT' : 'POST'
      const body = editingId 
        ? {
            scheduleId: editingId,
            startTime: formData.startTime,
            endTime: formData.endTime,
            lunchStart: formData.lunchStart || null,
            lunchEnd: formData.lunchEnd || null
          }
        : {
            specialistId,
            dayOfWeek: formData.dayOfWeek,
            startTime: formData.startTime,
            endTime: formData.endTime,
            lunchStart: formData.lunchStart || null,
            lunchEnd: formData.lunchEnd || null
          }

      const response = await fetch('/api/admin/schedules', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        await fetchSchedules()
        resetForm()
        alert(editingId ? 'Horario actualizado' : 'Horario creado')
      } else {
        const error = await response.json()
        alert(error.error || 'Error al guardar')
      }
    } catch (error) {
      alert('Error al guardar el horario')
      console.error(error)
    }
  }

  const handleEdit = (schedule: WorkSchedule) => {
    setEditingId(schedule.id)
    setFormData({
      dayOfWeek: schedule.day_of_week,
      startTime: schedule.start_time,
      endTime: schedule.end_time,
      lunchStart: schedule.lunch_start || '',
      lunchEnd: schedule.lunch_end || ''
    })
  }

  const handleDelete = async (scheduleId: string) => {
    if (!confirm('¿Seguro que deseas eliminar este horario?')) return

    try {
      const response = await fetch('/api/admin/schedules', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId })
      })

      if (response.ok) {
        await fetchSchedules()
        alert('Horario eliminado')
      } else {
        alert('Error al eliminar')
      }
    } catch (error) {
      alert('Error al eliminar el horario')
      console.error(error)
    }
  }

  const handleToggleActive = async (schedule: WorkSchedule) => {
    try {
      const response = await fetch('/api/admin/schedules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId: schedule.id,
          isActive: !schedule.is_active
        })
      })

      if (response.ok) {
        await fetchSchedules()
      }
    } catch (error) {
      console.error('Error updating schedule:', error)
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '18:45',
      lunchStart: '13:00',
      lunchEnd: '14:00'
    })
    setValidation(null)
  }

  const getDayLabel = (dayOfWeek: number) => {
    return DAYS_OF_WEEK.find(d => d.value === dayOfWeek)?.label || 'Desconocido'
  }

  if (loading) {
    return <div className="text-center py-8">Cargando horarios...</div>
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
        <Clock className="h-6 w-6 mr-2 text-primary" />
        Gestión de Horarios
      </h2>

      {/* Formulario */}
      <div className="bg-pink-50 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold text-pink-900 mb-3">
          {editingId ? 'Editar Horario' : 'Agregar Nuevo Horario'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {!editingId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Día de la semana</label>
              <select
                value={formData.dayOfWeek}
                onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {DAYS_OF_WEEK.map((day) => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hora inicio</label>
            <input
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hora fin</label>
            <input
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Almuerzo inicio</label>
            <input
              type="time"
              value={formData.lunchStart}
              onChange={(e) => setFormData({ ...formData, lunchStart: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Almuerzo fin</label>
            <input
              type="time"
              value={formData.lunchEnd}
              onChange={(e) => setFormData({ ...formData, lunchEnd: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Validación de conflictos */}
        {isValidating && editingId && (
          <div className="mt-4 text-sm text-gray-600">Validando conflictos...</div>
        )}

        {validation && !isValidating && editingId && (
          <div className={`mt-4 p-3 rounded-lg ${
            validation.hasConflicts 
              ? 'bg-orange-50 border border-orange-200' 
              : 'bg-green-50 border border-green-200'
          }`}>
            <div className="flex items-start gap-2">
              <AlertTriangle className={`h-5 w-5 ${
                validation.hasConflicts ? 'text-orange-600' : 'text-green-600'
              }`} />
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  validation.hasConflicts ? 'text-orange-800' : 'text-green-800'
                }`}>
                  {validation.hasConflicts 
                    ? `⚠️ Este cambio afectará ${validation.affectedAppointmentsCount} turno(s) futuro(s) para ${getDayLabel(formData.dayOfWeek)}`
                    : `✅ No hay conflictos con turnos futuros para ${getDayLabel(formData.dayOfWeek)}`
                  }
                </p>
                {validation.hasConflicts && validation.conflicts && validation.conflicts.length > 0 && (
                  <ul className="mt-2 text-xs text-orange-700 list-disc list-inside">
                    {validation.conflicts.slice(0, 3).map((conflict: any, idx: number) => (
                      <li key={idx}>
                        {conflict.patientName} - {conflict.appointmentDate} {conflict.appointmentTime} ({conflict.serviceName})
                      </li>
                    ))}
                    {validation.conflicts.length > 3 && (
                      <li>... y {validation.conflicts.length - 3} más</li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSave}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-primary to-pink-700 text-white rounded-lg hover:from-pink-700 hover:to-pink-800 shadow-md"
          >
            <Save className="h-4 w-4 mr-2" />
            {editingId ? 'Actualizar' : 'Crear'}
          </button>
          {editingId && (
            <button
              onClick={resetForm}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Lista de horarios */}
      <div className="space-y-3">
        {schedules.map((schedule) => (
          <div
            key={schedule.id}
            className={`flex items-center justify-between p-4 border rounded-lg ${
              schedule.is_active ? 'border-gray-200 bg-white' : 'border-gray-300 bg-gray-100'
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <span className="font-semibold text-gray-900">{getDayLabel(schedule.day_of_week)}</span>
                <span className="text-gray-600">
                  {schedule.start_time} - {schedule.end_time}
                </span>
                {schedule.lunch_start && schedule.lunch_end && (
                  <span className="text-sm text-orange-600">
                    Almuerzo: {schedule.lunch_start} - {schedule.lunch_end}
                  </span>
                )}
                {!schedule.is_active && (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Inactivo</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleActive(schedule)}
                className={`px-3 py-1 text-xs rounded ${
                  schedule.is_active
                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {schedule.is_active ? 'Desactivar' : 'Activar'}
              </button>
              <button
                onClick={() => handleEdit(schedule)}
                className="p-2 text-primary hover:bg-pink-50 rounded"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(schedule.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        
        {schedules.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay horarios configurados. Agrega uno para comenzar.
          </div>
        )}
      </div>
    </div>
  )
}

