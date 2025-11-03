'use client'
import { useState, useEffect } from 'react'
import { Calendar, Plus, Edit, Trash2, Save, X, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Closure {
  id: string
  closure_type: 'vacation' | 'holiday' | 'personal' | 'maintenance'
  start_date: string
  end_date: string
  reason: string | null
  is_active: boolean
  created_at: string
}

interface ClosureManagerProps {
  specialistId: string
}

const CLOSURE_TYPES = [
  { value: 'vacation', label: 'Vacaciones', color: 'bg-blue-100 text-blue-800' },
  { value: 'holiday', label: 'Feriado', color: 'bg-purple-100 text-purple-800' },
  { value: 'personal', label: 'Personal', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'maintenance', label: 'Mantenimiento', color: 'bg-orange-100 text-orange-800' }
]

export default function ClosureManager({ specialistId }: ClosureManagerProps) {
  const [closures, setClosures] = useState<Closure[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [conflictingAppointments, setConflictingAppointments] = useState<any[]>([])
  const [formData, setFormData] = useState({
    closureType: 'vacation' as 'vacation' | 'holiday' | 'personal' | 'maintenance',
    startDate: '',
    endDate: '',
    reason: ''
  })

  useEffect(() => {
    fetchClosures()
  }, [specialistId])

  const fetchClosures = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/closures?specialistId=${specialistId}`)
      const data = await response.json()
      setClosures(data.closures || [])
    } catch (error) {
      console.error('Error fetching closures:', error)
      setClosures([])
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.startDate || !formData.endDate) {
      alert('Por favor completa las fechas')
      return
    }

    try {
      const method = editingId ? 'PUT' : 'POST'
      const body = editingId 
        ? {
            closureId: editingId,
            startDate: formData.startDate,
            endDate: formData.endDate,
            reason: formData.reason || null
          }
        : {
            specialistId,
            closureType: formData.closureType,
            startDate: formData.startDate,
            endDate: formData.endDate,
            reason: formData.reason || null
          }

      const response = await fetch('/api/admin/closures', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        await fetchClosures()
        resetForm()
        alert(editingId ? 'Cierre actualizado' : 'Cierre creado')
      } else {
        const error = await response.json()
        
        // Mostrar turnos en conflicto si existen
        if (error.appointments) {
          setConflictingAppointments(error.appointments)
        }
        
        alert(error.error || 'Error al guardar')
      }
    } catch (error) {
      alert('Error al guardar el cierre')
      console.error(error)
    }
  }

  const handleEdit = (closure: Closure) => {
    setEditingId(closure.id)
    setFormData({
      closureType: closure.closure_type,
      startDate: closure.start_date,
      endDate: closure.end_date,
      reason: closure.reason || ''
    })
  }

  const handleDelete = async (closureId: string) => {
    if (!confirm('¿Seguro que deseas eliminar este cierre?')) return

    try {
      const response = await fetch('/api/admin/closures', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ closureId })
      })

      if (response.ok) {
        await fetchClosures()
        alert('Cierre eliminado')
      } else {
        alert('Error al eliminar')
      }
    } catch (error) {
      alert('Error al eliminar el cierre')
      console.error(error)
    }
  }

  const handleToggleActive = async (closure: Closure) => {
    try {
      const response = await fetch('/api/admin/closures', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          closureId: closure.id,
          isActive: !closure.is_active
        })
      })

      if (response.ok) {
        await fetchClosures()
      }
    } catch (error) {
      console.error('Error updating closure:', error)
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setConflictingAppointments([])
    setFormData({
      closureType: 'vacation',
      startDate: '',
      endDate: '',
      reason: ''
    })
  }

  const getClosureTypeLabel = (type: string) => {
    return CLOSURE_TYPES.find(t => t.value === type)?.label || type
  }

  const getClosureTypeColor = (type: string) => {
    return CLOSURE_TYPES.find(t => t.value === type)?.color || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return <div className="text-center py-8">Cargando cierres...</div>
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
        <Calendar className="h-6 w-6 mr-2 text-primary" />
        Gestión de Cierres y Vacaciones
      </h2>

      {/* Formulario */}
      <div className="bg-purple-50 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold text-purple-900 mb-3">
          {editingId ? 'Editar Cierre' : 'Agregar Nuevo Cierre'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!editingId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de cierre</label>
              <select
                value={formData.closureType}
                onChange={(e) => setFormData({ ...formData, closureType: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                {CLOSURE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo (opcional)</label>
            <input
              type="text"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Ej: Vacaciones de verano, Feriado nacional..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSave}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 shadow-md"
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

        {/* Mostrar turnos en conflicto */}
        {conflictingAppointments.length > 0 && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-900 mb-2">
                  Turnos programados en este periodo:
                </h4>
                <ul className="text-sm text-red-800 space-y-1">
                  {conflictingAppointments && conflictingAppointments.map((apt, idx) => (
                    <li key={idx}>
                      • {apt.appointment_date} a las {apt.appointment_time} - {apt.patient?.name}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-red-700 mt-2">
                  Debes reprogramar o cancelar estos turnos antes de crear el cierre.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lista de cierres */}
      <div className="space-y-3">
        {closures && closures.map((closure) => (
          <div
            key={closure.id}
            className={`flex items-center justify-between p-4 border rounded-lg ${
              closure.is_active ? 'border-gray-200 bg-white' : 'border-gray-300 bg-gray-100'
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-2 py-1 text-xs font-medium rounded ${getClosureTypeColor(closure.closure_type)}`}>
                  {getClosureTypeLabel(closure.closure_type)}
                </span>
                {!closure.is_active && (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Inactivo</span>
                )}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">
                  {format(new Date(closure.start_date), 'dd/MM/yyyy')} - {format(new Date(closure.end_date), 'dd/MM/yyyy')}
                </span>
                {closure.reason && (
                  <span className="ml-2 text-gray-500">• {closure.reason}</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleActive(closure)}
                className={`px-3 py-1 text-xs rounded ${
                  closure.is_active
                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {closure.is_active ? 'Desactivar' : 'Activar'}
              </button>
              <button
                onClick={() => handleEdit(closure)}
                className="p-2 text-primary hover:bg-pink-50 rounded"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(closure.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        
        {closures.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay cierres programados. Agrega uno cuando sea necesario.
          </div>
        )}
      </div>
    </div>
  )
}

