'use client'
import { useState, useEffect } from 'react'
import { Megaphone, Plus, Edit, Trash2, Save, X, AlertCircle, Eye, EyeOff } from 'lucide-react'

interface Announcement {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'alert' | 'success' | 'vacation'
  start_date: string | null
  end_date: string | null
  show_on_home: boolean
  block_bookings: boolean
  is_active: boolean
  created_at: string
}

const ANNOUNCEMENT_TYPES = [
  { value: 'info', label: 'Información', color: 'bg-blue-100 text-blue-800' },
  { value: 'warning', label: 'Advertencia', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'alert', label: 'Alerta', color: 'bg-red-100 text-red-800' },
  { value: 'success', label: 'Éxito', color: 'bg-green-100 text-green-800' },
  { value: 'vacation', label: 'Vacaciones', color: 'bg-purple-100 text-purple-800' }
]

export default function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'alert' | 'success' | 'vacation',
    startDate: '',
    endDate: '',
    showOnHome: true,
    blockBookings: false
  })

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/announcements')
      const data = await response.json()
      setAnnouncements(data.announcements || [])
    } catch (error) {
      console.error('Error fetching announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.title || !formData.message) {
      alert('El título y mensaje son obligatorios')
      return
    }

    try {
      const method = editingId ? 'PUT' : 'POST'
      const body = editingId 
        ? {
            announcementId: editingId,
            title: formData.title,
            message: formData.message,
            startDate: formData.startDate || null,
            endDate: formData.endDate || null,
            showOnHome: formData.showOnHome,
            blockBookings: formData.blockBookings
          }
        : {
            title: formData.title,
            message: formData.message,
            type: formData.type,
            startDate: formData.startDate || null,
            endDate: formData.endDate || null,
            showOnHome: formData.showOnHome,
            blockBookings: formData.blockBookings
          }

      const response = await fetch('/api/admin/announcements', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        await fetchAnnouncements()
        resetForm()
        alert(editingId ? 'Anuncio actualizado' : 'Anuncio creado')
      } else {
        const error = await response.json()
        alert(error.error || 'Error al guardar')
      }
    } catch (error) {
      alert('Error al guardar el anuncio')
      console.error(error)
    }
  }

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id)
    setFormData({
      title: announcement.title,
      message: announcement.message,
      type: announcement.type,
      startDate: announcement.start_date || '',
      endDate: announcement.end_date || '',
      showOnHome: announcement.show_on_home,
      blockBookings: announcement.block_bookings
    })
  }

  const handleDelete = async (announcementId: string) => {
    if (!confirm('¿Seguro que deseas eliminar este anuncio?')) return

    try {
      const response = await fetch('/api/admin/announcements', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcementId })
      })

      if (response.ok) {
        await fetchAnnouncements()
        alert('Anuncio eliminado')
      } else {
        alert('Error al eliminar')
      }
    } catch (error) {
      alert('Error al eliminar el anuncio')
      console.error(error)
    }
  }

  const handleToggleActive = async (announcement: Announcement) => {
    try {
      const response = await fetch('/api/admin/announcements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          announcementId: announcement.id,
          isActive: !announcement.is_active
        })
      })

      if (response.ok) {
        await fetchAnnouncements()
      }
    } catch (error) {
      console.error('Error updating announcement:', error)
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      title: '',
      message: '',
      type: 'info',
      startDate: '',
      endDate: '',
      showOnHome: true,
      blockBookings: false
    })
  }

  const getTypeLabel = (type: string) => {
    return ANNOUNCEMENT_TYPES.find(t => t.value === type)?.label || type
  }

  const getTypeColor = (type: string) => {
    return ANNOUNCEMENT_TYPES.find(t => t.value === type)?.color || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return <div className="text-center py-8">Cargando anuncios...</div>
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
        <Megaphone className="h-6 w-6 mr-2 text-indigo-600" />
        Gestión de Anuncios Públicos
      </h2>

      {/* Formulario */}
      <div className="bg-indigo-50 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold text-indigo-900 mb-3">
          {editingId ? 'Editar Anuncio' : 'Crear Nuevo Anuncio'}
        </h3>
        <div className="space-y-4">
          {!editingId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de anuncio</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {ANNOUNCEMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: Cerrado por vacaciones"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Ej: Estaremos de vacaciones del 20 al 30 de diciembre. Las reservas se reanudarán el 31 de diciembre."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio (opcional)</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin (opcional)</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.showOnHome}
                onChange={(e) => setFormData({ ...formData, showOnHome: e.target.checked })}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Mostrar en página principal</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.blockBookings}
                onChange={(e) => setFormData({ ...formData, blockBookings: e.target.checked })}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700 font-medium">
                Bloquear reservas durante este periodo
              </span>
            </label>
          </div>

          {formData.blockBookings && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                <div className="text-sm text-red-800">
                  <strong>Importante:</strong> Mientras este anuncio esté activo, los pacientes no podrán hacer nuevas reservas en el sistema.
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSave}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
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

      {/* Lista de anuncios */}
      <div className="space-y-3">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className={`flex items-start justify-between p-4 border rounded-lg ${
              announcement.is_active ? 'border-gray-200 bg-white' : 'border-gray-300 bg-gray-100'
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(announcement.type)}`}>
                  {getTypeLabel(announcement.type)}
                </span>
                {!announcement.is_active && (
                  <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">Inactivo</span>
                )}
                {announcement.block_bookings && (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded font-medium">
                    Bloquea Reservas
                  </span>
                )}
                {announcement.show_on_home && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Visible en Home
                  </span>
                )}
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">{announcement.title}</h4>
              <p className="text-sm text-gray-600 mb-2 whitespace-pre-line">{announcement.message}</p>
              {(announcement.start_date || announcement.end_date) && (
                <div className="text-xs text-gray-500">
                  {announcement.start_date && (
                    <span>Desde: {new Date(announcement.start_date).toLocaleDateString('es-AR')}</span>
                  )}
                  {announcement.start_date && announcement.end_date && ' • '}
                  {announcement.end_date && (
                    <span>Hasta: {new Date(announcement.end_date).toLocaleDateString('es-AR')}</span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => handleToggleActive(announcement)}
                className={`px-3 py-1 text-xs rounded ${
                  announcement.is_active
                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
                title={announcement.is_active ? 'Desactivar' : 'Activar'}
              >
                {announcement.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                onClick={() => handleEdit(announcement)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(announcement.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        
        {announcements.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay anuncios creados. Crea uno para comunicar información importante a tus pacientes.
          </div>
        )}
      </div>
    </div>
  )
}

