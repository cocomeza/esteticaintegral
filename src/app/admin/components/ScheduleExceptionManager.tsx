'use client'
import { useState, useEffect } from 'react'
import { Calendar, Clock, AlertTriangle, Save, X, Trash2, Edit } from 'lucide-react'

interface ScheduleException {
  id: string
  exception_date: string
  start_time: string
  end_time: string
  lunch_start: string | null
  lunch_end: string | null
  reason: string | null
  is_active: boolean
}

interface ScheduleExceptionManagerProps {
  specialistId: string
}

export default function ScheduleExceptionManager({ specialistId }: ScheduleExceptionManagerProps) {
  const [exceptions, setExceptions] = useState<ScheduleException[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    exceptionDate: '',
    startTime: '09:00',
    endTime: '18:45',
    lunchStart: '12:45',
    lunchEnd: '14:15',
    reason: ''
  })
  const [validation, setValidation] = useState<any>(null)
  const [isValidating, setIsValidating] = useState(false)

  useEffect(() => {
    fetchExceptions()
  }, [specialistId])

  const fetchExceptions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/schedule-exceptions?specialistId=${specialistId}`)
      const data = await response.json()
      setExceptions(data.exceptions || [])
    } catch (error) {
      console.error('Error fetching exceptions:', error)
      setExceptions([])
    } finally {
      setLoading(false)
    }
  }

  const validateException = async () => {
    if (!formData.exceptionDate) {
      setValidation({ hasConflicts: false, canProceed: true, conflicts: [] })
      return
    }

    setIsValidating(true)
    try {
      const response = await fetch('/api/admin/schedule-exceptions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specialistId,
          exceptionDate: formData.exceptionDate,
          newStartTime: formData.startTime,
          newEndTime: formData.endTime
        })
      })

      const data = await response.json()
      setValidation(data.validation)
    } catch (error) {
      console.error('Error validating exception:', error)
      setValidation({ hasConflicts: false, canProceed: true, conflicts: [] })
    } finally {
      setIsValidating(false)
    }
  }

  useEffect(() => {
    if (formData.exceptionDate && formData.startTime && formData.endTime) {
      const timeout = setTimeout(() => {
        validateException()
      }, 500)
      return () => clearTimeout(timeout)
    }
  }, [formData.exceptionDate, formData.startTime, formData.endTime])

  const handleSave = async () => {
    if (!formData.exceptionDate) {
      alert('Debe seleccionar una fecha')
      return
    }

    if (validation?.hasConflicts && !confirm(
      `⚠️ Este cambio afectará ${validation.affectedAppointmentsCount} turno(s) existente(s). ¿Desea continuar?`
    )) {
      return
    }

    try {
      const method = editingId ? 'PUT' : 'POST'
      const body = editingId
        ? {
            exceptionId: editingId,
            startTime: formData.startTime,
            endTime: formData.endTime,
            lunchStart: formData.lunchStart || null,
            lunchEnd: formData.lunchEnd || null,
            reason: formData.reason || null
          }
        : {
            specialistId,
            exceptionDate: formData.exceptionDate,
            startTime: formData.startTime,
            endTime: formData.endTime,
            lunchStart: formData.lunchStart || null,
            lunchEnd: formData.lunchEnd || null,
            reason: formData.reason || null
          }

      const response = await fetch('/api/admin/schedule-exceptions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        await fetchExceptions()
        resetForm()
        alert(editingId ? 'Excepción actualizada' : 'Excepción creada')
      } else {
        const error = await response.json()
        alert(error.error || 'Error al guardar')
      }
    } catch (error) {
      alert('Error al guardar la excepción')
      console.error(error)
    }
  }

  const handleEdit = (exception: ScheduleException) => {
    setEditingId(exception.id)
    setFormData({
      exceptionDate: exception.exception_date,
      startTime: exception.start_time,
      endTime: exception.end_time,
      lunchStart: exception.lunch_start || '12:45',
      lunchEnd: exception.lunch_end || '14:15',
      reason: exception.reason || ''
    })
  }

  const handleDelete = async (exceptionId: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta excepción?')) return

    try {
      const response = await fetch('/api/admin/schedule-exceptions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exceptionId })
      })

      if (response.ok) {
        await fetchExceptions()
        alert('Excepción eliminada')
      } else {
        alert('Error al eliminar')
      }
    } catch (error) {
      alert('Error al eliminar la excepción')
      console.error(error)
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      exceptionDate: '',
      startTime: '09:00',
      endTime: '18:45',
      lunchStart: '12:45',
      lunchEnd: '14:15',
      reason: ''
    })
    setValidation(null)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return <div className="text-center py-8">Cargando excepciones...</div>
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
        <Calendar className="h-6 w-6 mr-2 text-primary" />
        Excepciones de Horario por Fecha
      </h2>

      <p className="text-sm text-gray-600 mb-6">
        Crea horarios especiales para fechas específicas (ej: cerrar a las 15:00 solo mañana martes). 
        Estas excepciones tienen prioridad sobre el horario regular.
      </p>

      {/* Formulario */}
      <div className="bg-pink-50 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold text-pink-900 mb-3">
          {editingId ? 'Editar Excepción' : 'Nueva Excepción de Horario'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
            <input
              type="date"
              value={formData.exceptionDate}
              onChange={(e) => setFormData({ ...formData, exceptionDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

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

          <div className="md:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo (opcional)</label>
            <input
              type="text"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Ej: Cita médica personal"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Validación de conflictos */}
        {isValidating && (
          <div className="mt-4 text-sm text-gray-600">Validando conflictos...</div>
        )}

        {validation && !isValidating && formData.exceptionDate && (
          <div className={`mt-4 p-4 rounded-lg border-2 ${
            validation.hasConflicts 
              ? 'bg-orange-50 border-orange-400 shadow-md' 
              : 'bg-green-50 border-green-300'
          }`}>
            <div className="flex items-start gap-3">
              <AlertTriangle className={`h-6 w-6 flex-shrink-0 mt-0.5 ${
                validation.hasConflicts ? 'text-orange-600' : 'text-green-600'
              }`} />
              <div className="flex-1">
                <p className={`text-base font-bold mb-2 ${
                  validation.hasConflicts ? 'text-orange-900' : 'text-green-900'
                }`}>
                  {validation.hasConflicts 
                    ? `⚠️ ADVERTENCIA: Este cambio afectará ${validation.affectedAppointmentsCount} turno(s) existente(s)`
                    : '✅ No hay conflictos con turnos existentes'
                  }
                </p>
                {validation.hasConflicts && validation.conflicts && validation.conflicts.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-semibold text-orange-900 mb-2">
                      Turnos que se verán afectados:
                    </p>
                    <ul className="space-y-1 text-sm text-orange-800 bg-orange-100 rounded p-3">
                      {validation.conflicts.map((conflict: any, idx: number) => (
                        <li key={idx} className="flex items-center justify-between py-1 border-b border-orange-200 last:border-0">
                          <span className="font-medium">{conflict.patientName}</span>
                          <span className="text-orange-700 ml-3">
                            {conflict.appointmentTime} - {conflict.serviceName}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs text-orange-700 font-medium">
                      💡 Debes contactar a estos pacientes antes de aplicar el cambio
                    </p>
                  </div>
                )}
                {validation.recommendation && (
                  <p className={`mt-2 text-sm ${
                    validation.hasConflicts ? 'text-orange-700' : 'text-green-700'
                  }`}>
                    {validation.recommendation}
                  </p>
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
            {editingId ? 'Actualizar' : 'Crear Excepción'}
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

      {/* Lista de excepciones */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Excepciones Configuradas</h3>
        
        {exceptions.map((exception) => (
          <div
            key={exception.id}
            className={`flex items-center justify-between p-4 border rounded-lg ${
              exception.is_active ? 'border-gray-200 bg-white' : 'border-gray-300 bg-gray-100'
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <div>
                  <span className="font-semibold text-gray-900">
                    {formatDate(exception.exception_date)}
                  </span>
                  <span className="text-gray-600 ml-3">
                    {exception.start_time} - {exception.end_time}
                  </span>
                </div>
                {exception.lunch_start && exception.lunch_end && (
                  <span className="text-sm text-orange-600">
                    Almuerzo: {exception.lunch_start} - {exception.lunch_end}
                  </span>
                )}
                {exception.reason && (
                  <span className="text-sm text-gray-500 italic">
                    ({exception.reason})
                  </span>
                )}
                {!exception.is_active && (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Inactiva</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEdit(exception)}
                className="p-2 text-primary hover:bg-pink-50 rounded"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(exception.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        
        {exceptions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay excepciones configuradas. Crea una para cambiar el horario de una fecha específica.
          </div>
        )}
      </div>
    </div>
  )
}

