'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  LogOut, 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle,
  Search,
  Filter,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Eye,
  Home,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Settings,
  CalendarX,
  Megaphone,
  User
} from 'lucide-react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import type { AdminUser } from '../../../lib/admin-auth'
import { formatDateForDisplay, getTodayString, fixDateFromDatabase, debugDateProblem } from '../../../lib/date-utils'
import { debugDateIssues, testDateFormatting } from '../../../lib/debug-dates-browser'
import ScheduleManager from './ScheduleManager'
import ScheduleExceptionManager from './ScheduleExceptionManager'
import ClosureManager from './ClosureManager'
import AnnouncementManager from './AnnouncementManager'
import CalendarView from './CalendarView'

interface AdminDashboardProps {
  adminUser: AdminUser
}

type TabType = 'appointments' | 'schedules' | 'exceptions' | 'closures' | 'announcements'

interface AppointmentData {
  id: string
  appointment_date: string
  appointment_time: string
  status: 'scheduled' | 'completed' | 'cancelled'
  notes?: string
  created_at?: string  // ✅ Cambiar a opcional para compatibilidad
  specialist: {
    id: string
    name: string
    email: string
    phone: string
    title: string
  }
  service: {
    id: string
    name: string
    description: string
    duration: number
  }
  patient: {
    id: string
    name: string
    email: string
    phone: string
  }
}

// 📊 MEJORA #10: Interfaz de estadísticas mejorada
interface Stats {
  // Básicas
  total: number
  today: number
  scheduled: number
  completed: number
  cancelled?: number
  
  // Por período
  thisWeek?: number
  thisMonth?: number
  
  // Métricas adicionales
  topServices?: Array<{ service: string; count: number }>
  occupancyRate?: number
  avgAppointmentsPerDay?: number
}

interface Doctor {
  id: string
  name: string
  email: string
  title: string
}

interface Patient {
  id: string
  name: string
  email: string
  phone: string
}

interface CreateAppointmentForm {
  serviceId: string
  patientName: string
  appointmentDate: string
  appointmentTime: string
  notes: string
}

// Lorena Esquivel es la única especialista
const LORENA_ESQUIVEL = {
  id: 'lorena-esquivel-id', // Se obtendrá dinámicamente
  name: 'Lorena Esquivel',
  email: 'lorena@esteticaintegral.com',
  title: 'Esteticista Profesional'
}

export default function AdminDashboard({ adminUser }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('appointments')
  const [appointments, setAppointments] = useState<AppointmentData[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, today: 0, scheduled: 0, completed: 0 })
  const [specialists, setSpecialists] = useState<Doctor[]>([LORENA_ESQUIVEL])
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [specialistId, setSpecialistId] = useState<string>('')
  
  // 📅 MEJORA #6: Vista de calendario
  const [viewType, setViewType] = useState<'list' | 'calendar'>('list')
  
  // Filtros
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [specialistFilter, setSpecialistFilter] = useState('')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Filtros inteligentes
  const [viewMode, setViewMode] = useState<'active' | 'history' | 'all'>('active')
  const [periodFilter, setPeriodFilter] = useState<'today' | 'week' | 'month' | 'quarter' | 'custom'>('month')
  const [showCompleted, setShowCompleted] = useState(false)
  
  // Modales y formularios
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<AppointmentData | null>(null)
  const [deletingAppointment, setDeletingAppointment] = useState<AppointmentData | null>(null)
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [formLoading, setFormLoading] = useState(false)
  
  // 🔄 MEJORA #7: Tracking de cambios sin guardar
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  // Usar función centralizada para formateo de fechas con depuración y corrección
  const formatYmdStatic = (ymd: string) => {
    console.log(`🔍 Formateando fecha: ${ymd}`)
    
    // Depurar el problema específico
    debugDateProblem(ymd, 'AdminDashboard')
    
    // Corregir la fecha si viene de la base de datos
    const correctedDate = fixDateFromDatabase(ymd)
    
    // Formatear para mostrar
    const result = formatDateForDisplay(correctedDate)
    console.log(`📅 Resultado final: ${result}`)
    
    // Depuración adicional
    const testResult = testDateFormatting(ymd)
    if (testResult.hasIssue) {
      console.warn(`⚠️ PROBLEMA DETECTADO con fecha ${ymd}:`, testResult)
    }
    
    return result
  }
  
  // Formulario de crear/editar cita
  const [appointmentForm, setAppointmentForm] = useState<CreateAppointmentForm>({
    serviceId: '',
    patientName: '',
    appointmentDate: '',
    appointmentTime: '',
    notes: ''
  })
  
  const router = useRouter()

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch stats, specialists, appointments and services (no patients needed)
      const [statsRes, appointmentsRes, servicesRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch(`/api/admin/appointments?page=${currentPage}&search=${encodeURIComponent(search)}&status=${statusFilter}&specialistId=${specialistFilter}&startDate=${dateFromFilter}&endDate=${dateToFilter}`),
        fetch('/api/admin/services')
      ])

      if (!statsRes.ok || !appointmentsRes.ok || !servicesRes.ok) {
        throw new Error('Error al cargar datos')
      }

      const statsData = await statsRes.json()
      const appointmentsData = await appointmentsRes.json()
      const servicesData = await servicesRes.json()

      setStats(statsData.stats || { total: 0, today: 0, scheduled: 0, completed: 0 })
      
      // Lorena Esquivel es la única especialista - usar datos estáticos
      setSpecialists([LORENA_ESQUIVEL])
      
      // Obtener el ID real de Lorena desde la base de datos si está disponible
      if (statsData.specialists && statsData.specialists.length > 0) {
        const lorenaFromDB = statsData.specialists.find((s: any) => 
          s.name.toLowerCase().includes('lorena') || 
          s.name.toLowerCase().includes('esquivel')
        )
        if (lorenaFromDB) {
          setSpecialistId(lorenaFromDB.id)
        } else {
        setSpecialistId(statsData.specialists[0].id)
        }
      } else {
        // Si no hay especialistas en la DB, usar un ID por defecto
        setSpecialistId('lorena-esquivel-id')
      }
      
      // Depurar las fechas que vienen de la API
      console.log('📊 Datos de citas recibidos:', appointmentsData.appointments)
      if (appointmentsData.appointments && appointmentsData.appointments.length > 0) {
        appointmentsData.appointments.forEach((appointment: AppointmentData, index: number) => {
          console.log(`📅 Cita ${index + 1}:`, {
            id: appointment.id,
            appointment_date: appointment.appointment_date,
            appointment_time: appointment.appointment_time,
            patient: appointment.patient?.name
          })
          debugDateProblem(appointment.appointment_date, `Cita ${index + 1}`)
        })
      }
      
      setAppointments(appointmentsData.appointments || [])
      setTotalPages(appointmentsData.totalPages || 1)
      setServices(servicesData.services || [])
    } catch (err) {
      setError('Error al cargar los datos del panel')
      console.error(err)
      // Asegurar que los arrays nunca sean undefined
      setAppointments([])
      setSpecialists([])
      setServices([])
      setStats({ total: 0, today: 0, scheduled: 0, completed: 0 })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Depuración temporal de fechas
    debugDateIssues()
    
    // Probar con fechas específicas
    testDateFormatting('2024-01-30')
    testDateFormatting('2024-12-31')
    testDateFormatting('2024-02-29')
    
    fetchData()
  }, [currentPage, search, statusFilter, specialistFilter, dateFromFilter, dateToFilter])

  // 🔄 MEJORA #7: Advertencia antes de salir con cambios sin guardar
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = '¿Seguro que quieres salir? Hay cambios sin guardar.'
        return '¿Seguro que quieres salir? Hay cambios sin guardar.'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
      router.push('/admin/login')
    } catch (err) {
      console.error('Error al cerrar sesión:', err)
    }
  }

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/appointments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ appointmentId, status: newStatus }),
      })

      if (response.ok) {
        await fetchData() // Recargar datos
      } else {
        throw new Error('Error al actualizar')
      }
    } catch (err) {
      alert('Error al actualizar la cita')
    }
  }

  // Nuevas funciones para CRUD completo
  const fetchAvailableTimes = async (specialistId: string, date: string, serviceId?: string) => {
    try {
      let url = `/api/admin/available-times?specialistId=${specialistId}&date=${date}`
      if (serviceId) {
        url += `&serviceId=${serviceId}`
      }
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setAvailableTimes(data.availableTimes)
      } else {
        setAvailableTimes([])
      }
    } catch (err) {
      console.error('Error fetching available times:', err)
      setAvailableTimes([])
    }
  }

  const handleCreateAppointment = async () => {
    if (!appointmentForm.serviceId || !appointmentForm.patientName || !appointmentForm.appointmentDate || !appointmentForm.appointmentTime) {
      alert('Por favor completa todos los campos obligatorios')
      return
    }

    setFormLoading(true)
    setHasUnsavedChanges(false) // 🔄 Limpiar flag al guardar
    try {
      // Usar el ID de Lorena Esquivel que ya tenemos
      if (!specialistId) {
        throw new Error('No se encontró especialista activo')
      }

      // Crear el paciente con solo el nombre
        const patientResponse = await fetch('/api/admin/patients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: appointmentForm.patientName,
          email: `${appointmentForm.patientName.toLowerCase().replace(/\s+/g, '.')}@paciente.com`,
          phone: ''
          })
        })

      if (!patientResponse.ok) {
          const error = await patientResponse.json()
          throw new Error(error.error)
      }
      
      const patientData = await patientResponse.json()
      const patientId = patientData.patient.id

      const response = await fetch('/api/admin/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specialistId: specialistId,
          serviceId: appointmentForm.serviceId,
          patientId: patientId,
          appointmentDate: appointmentForm.appointmentDate,
          appointmentTime: appointmentForm.appointmentTime,
          notes: appointmentForm.notes
        })
      })

      if (response.ok) {
        setShowCreateModal(false)
        resetForm()
        await fetchData()
        alert('Cita creada exitosamente')
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (err: any) {
      alert(err.message || 'Error al crear la cita')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEditAppointment = async () => {
    if (!editingAppointment || !appointmentForm.serviceId || !appointmentForm.appointmentDate || !appointmentForm.appointmentTime) {
      alert('Por favor completa todos los campos obligatorios')
      return
    }

      setFormLoading(true)
      setHasUnsavedChanges(false) // 🔄 Limpiar flag al guardar
      try {
        // Usar el ID de Lorena Esquivel que ya tenemos
        if (!specialistId) {
          throw new Error('No se encontró especialista activo')
        }

        // Normalizar fecha para asegurar formato YYYY-MM-DD
        const normalizeDate = (dateStr: string) => {
          if (!dateStr) return dateStr
          // Si ya está en formato YYYY-MM-DD, devolverlo
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
            return dateStr.trim()
          }
          // Intentar parsear y formatear
          const date = new Date(dateStr)
          if (isNaN(date.getTime())) {
            console.warn('⚠️ Fecha inválida:', dateStr)
            return dateStr
          }
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }

        const normalizedDate = normalizeDate(appointmentForm.appointmentDate)
        
        console.log('✏️ Editando cita:', {
          appointmentId: editingAppointment.id,
          fechaOriginal: appointmentForm.appointmentDate,
          fechaNormalizada: normalizedDate,
          hora: appointmentForm.appointmentTime,
          servicio: appointmentForm.serviceId
        })

        const response = await fetch('/api/admin/appointments', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appointmentId: editingAppointment.id,
            specialistId: specialistId,
            serviceId: appointmentForm.serviceId,
            patientId: editingAppointment.patient.id, // Usar el paciente existente
            appointmentDate: normalizedDate,
            appointmentTime: appointmentForm.appointmentTime,
            notes: appointmentForm.notes
          })
        })

      if (response.ok) {
        setShowEditModal(false)
        setEditingAppointment(null)
        resetForm()
        await fetchData()
        alert('✅ Cita actualizada exitosamente. El horario anterior quedó disponible para otros pacientes.')
        } else {
          const error = await response.json()
          console.error('❌ Error al actualizar:', error)
          throw new Error(error.error || 'Error al actualizar la cita')
        }
      } catch (err: any) {
        console.error('❌ Error en handleEditAppointment:', err)
        alert(err.message || 'Error al actualizar la cita')
      } finally {
        setFormLoading(false)
      }
  }

  const handleDeleteAppointment = async () => {
    if (!deletingAppointment) return

    setFormLoading(true)
    try {
      const response = await fetch('/api/admin/appointments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: deletingAppointment.id })
      })

      if (response.ok) {
        setShowDeleteModal(false)
        setDeletingAppointment(null)
        await fetchData()
        alert('Cita eliminada exitosamente')
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (err: any) {
      alert(err.message || 'Error al eliminar la cita')
    } finally {
      setFormLoading(false)
    }
  }

  const openCreateModal = () => {
    // 🔄 MEJORA #7: Advertir si hay cambios sin guardar
    if (hasUnsavedChanges) {
      if (!confirm('¿Seguro que quieres crear una nueva cita? Hay cambios sin guardar.')) {
        return
      }
    }
    resetForm()
    setHasUnsavedChanges(false)
    setShowCreateModal(true)
    
    // Cargar horarios disponibles para hoy si hay especialista
    if (specialistId) {
      const today = getTodayString()
      fetchAvailableTimes(specialistId, today)
    }
  }

  const openEditModal = (appointment: AppointmentData) => {
    setEditingAppointment(appointment)
    setAppointmentForm({
      serviceId: appointment.service.id,
      patientName: appointment.patient.name,
      appointmentDate: appointment.appointment_date,
      appointmentTime: appointment.appointment_time,
      notes: appointment.notes || ''
    })
    // Fetch available times for the selected specialist and date
    fetchAvailableTimes(appointment.specialist.id, appointment.appointment_date, appointment.service.id)
    setShowEditModal(true)
  }

  const openDeleteModal = (appointment: AppointmentData) => {
    setDeletingAppointment(appointment)
    setShowDeleteModal(true)
  }

  const resetForm = () => {
    setAppointmentForm({
      serviceId: '',
      patientName: '',
      appointmentDate: '',
      appointmentTime: '',
      notes: ''
    })
    setAvailableTimes([])
    setHasUnsavedChanges(false) // 🔄 Limpiar flag al resetear
  }

  // Funciones para períodos inteligentes
  const getPeriodDates = (period: string) => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    
    switch (period) {
      case 'today':
        return { from: todayStr, to: todayStr }
      
      case 'week':
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        return { 
          from: weekStart.toISOString().split('T')[0], 
          to: weekEnd.toISOString().split('T')[0] 
        }
      
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        return { 
          from: monthStart.toISOString().split('T')[0], 
          to: monthEnd.toISOString().split('T')[0] 
        }
      
      case 'quarter':
        const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1)
        const quarterEnd = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3 + 3, 0)
        return { 
          from: quarterStart.toISOString().split('T')[0], 
          to: quarterEnd.toISOString().split('T')[0] 
        }
      
      default:
        return { from: '', to: '' }
    }
  }

  const getActiveAppointments = () => {
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    const cutoffDate = threeMonthsAgo.toISOString().split('T')[0]
    
    return appointments.filter((appointment: any) => {
      const appointmentDate = appointment.appointment_date
      return appointmentDate >= cutoffDate
    })
  }

  const getHistoricalAppointments = () => {
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    const cutoffDate = threeMonthsAgo.toISOString().split('T')[0]
    
    return appointments.filter((appointment: any) => {
      const appointmentDate = appointment.appointment_date
      return appointmentDate < cutoffDate
    })
  }

  // Handlers para filtros inteligentes
  const handlePeriodChange = (period: string) => {
    setPeriodFilter(period as any)
    if (period !== 'custom') {
      const dates = getPeriodDates(period)
      setDateFromFilter(dates.from)
      setDateToFilter(dates.to)
    }
  }

  const handleViewModeChange = (mode: 'active' | 'history' | 'all') => {
    setViewMode(mode)
    setCurrentPage(1) // Reset pagination
  }

  // Función para obtener citas filtradas inteligentemente
  const getFilteredAppointments = () => {
    let filtered = appointments

    // Filtro por modo de vista
    switch (viewMode) {
      case 'active':
        filtered = getActiveAppointments()
        break
      case 'history':
        filtered = getHistoricalAppointments()
        break
      case 'all':
      default:
        filtered = appointments
        break
    }

    // Filtro por búsqueda
    if (search) {
      filtered = filtered.filter(appointment =>
        appointment.patient?.name?.toLowerCase().includes(search.toLowerCase()) ||
        appointment.patient?.email?.toLowerCase().includes(search.toLowerCase()) ||
        appointment.patient?.phone?.includes(search)
      )
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter((appointment: any) => appointment.status === statusFilter)
    }

    // Filtro por especialista
    if (specialistFilter) {
      filtered = filtered.filter((appointment: any) => appointment.specialist?.id === specialistFilter)
    }

    // Filtro por fechas
    if (dateFromFilter) {
      filtered = filtered.filter((appointment: any) => appointment.appointment_date >= dateFromFilter)
    }
    if (dateToFilter) {
      filtered = filtered.filter((appointment: any) => appointment.appointment_date <= dateToFilter)
    }

    // Filtro para mostrar/ocultar completadas en vista activa
    if (viewMode === 'active' && !showCompleted) {
      filtered = filtered.filter((appointment: any) => appointment.status !== 'completed')
    }

    return filtered
  }

  // Handle form changes
  const handleFormChange = async (field: keyof CreateAppointmentForm, value: string) => {
    setHasUnsavedChanges(true) // 🔄 MEJORA #7: Marcar que hay cambios sin guardar
    
    setAppointmentForm(prev => ({
      ...prev,
      [field]: value
    }))

    // If service or date changes, fetch available times
    if (field === 'appointmentDate' || field === 'serviceId') {
      const date = field === 'appointmentDate' ? value : appointmentForm.appointmentDate
      const serviceId = field === 'serviceId' ? value : appointmentForm.serviceId
      
      if (date && specialistId) {
        try {
          await fetchAvailableTimes(specialistId, date, serviceId)
        } catch (error) {
          console.error('Error fetching available times:', error)
          setAvailableTimes([])
        }
      } else {
        setAvailableTimes([])
      }
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      scheduled: 'bg-pink-100 text-pink-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    const labels = {
      scheduled: 'Programada',
      completed: 'Completada',
      cancelled: 'Cancelada'
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  if (loading && appointments.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-light via-white to-secondary/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando panel de administración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-light via-white to-secondary/30">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-pink-700 bg-clip-text text-transparent">Panel de Administración</h1>
              <p className="text-sm text-neutral">Bienvenido, {adminUser.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="flex items-center px-4 py-2 text-primary hover:text-pink-700 hover:bg-pink-50 rounded-lg transition-colors"
              >
                <Home className="h-4 w-4 mr-2" />
                Volver al Home
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('appointments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'appointments'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-primary hover:border-pink-300'
              }`}
            >
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Turnos
              </div>
            </button>
            <button
              onClick={() => setActiveTab('schedules')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'schedules'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-primary hover:border-pink-300'
              }`}
            >
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Horarios
              </div>
            </button>
            <button
              onClick={() => setActiveTab('exceptions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'exceptions'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-primary hover:border-pink-300'
              }`}
            >
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Excepciones
              </div>
            </button>
            <button
              onClick={() => setActiveTab('closures')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'closures'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-primary hover:border-pink-300'
              }`}
            >
              <div className="flex items-center">
                <CalendarX className="h-5 w-5 mr-2" />
                Cierres / Vacaciones
              </div>
            </button>
            <button
              onClick={() => setActiveTab('announcements')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'announcements'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-primary hover:border-pink-300'
              }`}
            >
              <div className="flex items-center">
                <Megaphone className="h-5 w-5 mr-2" />
                Anuncios
              </div>
            </button>
          </nav>
        </div>

        {/* Stats Cards - Solo mostrar en pestaña de turnos */}
        {/* 📊 MEJORA #10: Estadísticas mejoradas con más métricas */}
        {activeTab === 'appointments' && (
          <>
          {/* Primera fila de estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6 border border-pink-100">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-pink-100 to-pink-200 rounded-lg">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Citas</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-primary to-pink-700 bg-clip-text text-transparent">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border border-pink-100">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hoy</p>
                <p className="text-2xl font-bold text-purple-600">{stats.today}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border border-pink-100">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-yellow-100 to-amber-200 rounded-lg">
                <Users className="h-6 w-6 text-amber-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Programadas</p>
                <p className="text-2xl font-bold text-amber-600">{stats.scheduled}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border border-pink-100">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-200 rounded-lg">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completadas</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Segunda fila de estadísticas - Nuevas métricas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border border-blue-100">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Esta Semana</p>
                <p className="text-2xl font-bold text-blue-600">{stats.thisWeek || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-indigo-100">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-lg">
                <Calendar className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Este Mes</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.thisMonth || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-cyan-100">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-lg">
                <Users className="h-6 w-6 text-cyan-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Promedio/Día</p>
                <p className="text-2xl font-bold text-cyan-600">{stats.avgAppointmentsPerDay || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-teal-100">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-teal-100 to-teal-200 rounded-lg">
                <CheckCircle className="h-6 w-6 text-teal-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ocupación</p>
                <p className="text-2xl font-bold text-teal-600">{stats.occupancyRate || 0}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Servicios */}
        {stats.topServices && stats.topServices.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-pink-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Servicios Más Solicitados (Este Mes)</h3>
            <div className="space-y-3">
              {stats.topServices.map((item, index) => (
                <div key={item.service} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full text-sm font-bold mr-3">
                      {index + 1}
                    </span>
                    <span className="text-gray-900 font-medium">{item.service}</span>
                  </div>
                  <span className="text-gray-600 font-semibold">{item.count} citas</span>
                </div>
              ))}
            </div>
          </div>
        )}
        </>
        )}

        {/* Content Based on Active Tab */}
        {activeTab === 'appointments' && (
          <>
            {/* 📅 MEJORA #6: Toggle entre vista lista y calendario */}
            <div className="mb-4 flex justify-end">
              <div className="inline-flex rounded-lg border border-gray-300 p-1">
                <button
                  onClick={() => setViewType('list')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewType === 'list'
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Vista Lista
                </button>
                <button
                  onClick={() => setViewType('calendar')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewType === 'calendar'
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Vista Calendario
                </button>
              </div>
            </div>

            {/* Vista de Calendario */}
            {viewType === 'calendar' && (
              <CalendarView 
                appointments={getFilteredAppointments()} 
                onEditAppointment={openEditModal}
                onRefresh={fetchData}
              />
            )}

            {/* Vista de Lista */}
            {viewType === 'list' && (
              <>
            {/* Filters and Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col gap-4">
            {/* Primera fila: Búsqueda y filtros básicos */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por paciente..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white border-2 border-gray-500 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-white border-2 border-gray-500 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                >
                  <option value="all">Todos los estados</option>
                  <option value="scheduled">Programadas</option>
                  <option value="completed">Completadas</option>
                  <option value="cancelled">Canceladas</option>
                </select>
                
                <select
                  value={specialistFilter}
                  onChange={(e) => setSpecialistFilter(e.target.value)}
                  className="px-4 py-2 bg-white border-2 border-gray-500 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                >
                  <option value="">Todos los especialistas</option>
                  {specialists && specialists.map((specialist) => (
                    <option key={specialist.id} value={specialist.id}>
                      {specialist.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={openCreateModal}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-primary to-pink-700 text-white font-medium rounded-lg hover:from-pink-700 hover:to-pink-800 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Nueva Cita
              </button>
            </div>

            {/* Segunda fila: Filtros inteligentes */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center pt-4 border-t border-gray-200">
              {/* Modo de vista */}
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Vista:</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleViewModeChange('active')}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                      viewMode === 'active' 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Activas (3 meses)
                  </button>
                  <button
                    onClick={() => handleViewModeChange('history')}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                      viewMode === 'history' 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Historial
                  </button>
                  <button
                    onClick={() => handleViewModeChange('all')}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                      viewMode === 'all' 
                        ? 'bg-gray-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Todas
                  </button>
                </div>
              </div>

              {/* Períodos rápidos */}
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Período:</span>
                <div className="flex gap-1 flex-wrap">
                  {['today', 'week', 'month', 'quarter'].map((period) => (
                    <button
                      key={period}
                      onClick={() => handlePeriodChange(period)}
                      className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                        periodFilter === period 
                          ? 'bg-pink-600 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {period === 'today' ? 'Hoy' : 
                       period === 'week' ? 'Semana' :
                       period === 'month' ? 'Mes' : 'Trimestre'}
                    </button>
                  ))}
                  <button
                    onClick={() => setPeriodFilter('custom')}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                      periodFilter === 'custom' 
                        ? 'bg-pink-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Personalizado
                  </button>
                </div>
              </div>

              {/* Mostrar completadas */}
              {viewMode === 'active' && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showCompleted"
                    checked={showCompleted}
                    onChange={(e) => setShowCompleted(e.target.checked)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="showCompleted" className="text-sm text-gray-700">
                    Incluir completadas
                  </label>
                </div>
              )}
            </div>

            {/* Tercera fila: Filtros de fecha personalizados */}
            {periodFilter === 'custom' && (
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center pt-4 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Filtrar por fecha:</span>
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <label className="text-sm text-gray-600">Desde:</label>
                <input
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                  className="px-3 py-2 bg-white border-2 border-gray-500 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <label className="text-sm text-gray-600">Hasta:</label>
                <input
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                  className="px-3 py-2 bg-white border-2 border-gray-500 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                />
              </div>
              {(dateFromFilter || dateToFilter) && (
                <button
                  onClick={() => {
                    setDateFromFilter('')
                    setDateToFilter('')
                  }}
                  className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Limpiar fechas
                </button>
              )}
              </div>
            )}
          </div>
        </div>

        {/* Appointments Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Citas Médicas</h3>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>
                  Mostrando {getFilteredAppointments().length} de {appointments.length} citas
                </span>
                {viewMode === 'active' && (
                  <span className="px-2 py-1 bg-pink-100 text-pink-800 rounded-full text-xs">
                    Activas
                  </span>
                )}
                {viewMode === 'history' && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                    Historial
                  </span>
                )}
                {viewMode === 'all' && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                    Todas
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha y Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paciente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Médico
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Especialidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredAppointments().map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{formatYmdStatic(appointment.appointment_date)}</div>
                        <div className="text-gray-500">{appointment.appointment_time}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{appointment.patient.name}</div>
                        <div className="text-gray-500">{appointment.patient.email}</div>
                        <div className="text-gray-500">{appointment.patient.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{appointment.specialist.name}</div>
                        <div className="text-gray-500">{appointment.specialist.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {appointment.service.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(appointment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex flex-col space-y-1">
                        {/* Botones principales de CRUD */}
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(appointment)}
                            className="inline-flex items-center px-2 py-1 text-primary hover:text-pink-800 hover:bg-pink-50 rounded text-xs font-medium transition-colors"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </button>
                          <button
                            onClick={() => openDeleteModal(appointment)}
                            className="inline-flex items-center px-2 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded text-xs font-medium transition-colors"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Eliminar
                          </button>
                        </div>
                        
                        {/* Botones de estado */}
                        <div className="flex space-x-2">
                          {appointment.status === 'scheduled' && (
                            <>
                              <button
                                onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                                className="text-green-600 hover:text-green-800 text-xs font-medium hover:bg-green-50 px-2 py-1 rounded transition-colors"
                              >
                                Completar
                              </button>
                              <button
                                onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                                className="text-orange-600 hover:text-orange-800 text-xs font-medium hover:bg-orange-50 px-2 py-1 rounded transition-colors"
                              >
                                Cancelar
                              </button>
                            </>
                          )}
                          {appointment.status === 'cancelled' && (
                            <button
                              onClick={() => updateAppointmentStatus(appointment.id, 'scheduled')}
                              className="text-primary hover:text-pink-800 text-xs font-medium hover:bg-pink-50 px-2 py-1 rounded transition-colors"
                            >
                              Reactivar
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Página <span className="font-medium">{currentPage}</span> de{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
              </>
            )}
          </>
        )}

        {/* Schedule Management Tab */}
        {activeTab === 'schedules' && specialistId && (
          <ScheduleManager specialistId={specialistId} />
        )}

        {/* Schedule Exceptions Tab */}
        {activeTab === 'exceptions' && specialistId && (
          <ScheduleExceptionManager specialistId={specialistId} />
        )}

        {/* Closure Management Tab */}
        {activeTab === 'closures' && specialistId && (
          <ClosureManager specialistId={specialistId} />
        )}

        {/* Announcements Management Tab */}
        {activeTab === 'announcements' && (
          <AnnouncementManager />
        )}
      </main>

      {/* Modal para Crear Nueva Cita */}
      <Transition appear show={showCreateModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowCreateModal(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                    Crear Nueva Cita Médica
                  </Dialog.Title>
                  
                  <div className="space-y-4">
                    {/* Información del Especialista */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-blue-900">Especialista</p>
                          <p className="text-sm text-blue-700">Lorena Esquivel - Esteticista Profesional</p>
                        </div>
                      </div>
                    </div>

                    {/* Selección de Servicio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Servicio</label>
                      <select
                        value={appointmentForm.serviceId}
                        onChange={(e) => handleFormChange('serviceId', e.target.value)}
                        className="w-full px-3 py-2 bg-white border-2 border-gray-500 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                        required
                      >
                        <option value="">Seleccionar servicio...</option>
                        {services && services.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.name} ({service.duration} min)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Nombre del Paciente */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Paciente</label>
                          <input
                            type="text"
                        value={appointmentForm.patientName}
                            onChange={(e) => handleFormChange('patientName', e.target.value)}
                            className="w-full px-3 py-2 bg-white border-2 border-gray-500 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                        placeholder="Ej: María González"
                            required
                          />
                        </div>

                    {/* Fecha y Hora */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                        <input
                          type="date"
                          value={appointmentForm.appointmentDate}
                          onChange={(e) => handleFormChange('appointmentDate', e.target.value)}
                          min={getTodayString()}
                          className="w-full px-3 py-2 bg-white border-2 border-gray-500 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hora</label>
                        <select
                          value={appointmentForm.appointmentTime}
                          onChange={(e) => handleFormChange('appointmentTime', e.target.value)}
                          className="w-full px-3 py-2 bg-white border-2 border-gray-500 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                          required
                        >
                          <option value="">Seleccionar hora...</option>
                          {availableTimes && availableTimes.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Notas */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notas (opcional)</label>
                      <textarea
                        value={appointmentForm.notes}
                        onChange={(e) => handleFormChange('notes', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 bg-white border-2 border-gray-500 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      onClick={() => setShowCreateModal(false)}
                      disabled={formLoading}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 flex items-center"
                      onClick={handleCreateAppointment}
                      disabled={formLoading}
                    >
                      {formLoading && (
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      )}
                      <Save className="h-4 w-4 mr-1" />
                      Crear Cita
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Modal para Editar Cita */}
      <Transition appear show={showEditModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowEditModal(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                    Editar Cita Médica
                  </Dialog.Title>

                  {/* Mensaje informativo */}
                  <div className="bg-pink-50 border border-pink-200 rounded-lg p-3 mb-4">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-pink-900">
                        <strong>Nota:</strong> Al cambiar la fecha u hora, el horario anterior quedará disponible automáticamente para otros pacientes.
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Información del Paciente (solo lectura) */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Paciente</h4>
                      <p className="text-sm text-gray-900">{appointmentForm.patientName}</p>
                    </div>

                    {/* Información del Especialista */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-blue-900">Especialista</p>
                          <p className="text-sm text-blue-700">Lorena Esquivel - Esteticista Profesional</p>
                        </div>
                      </div>
                    </div>

                    {/* Selección de Servicio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Servicio</label>
                      <select
                        value={appointmentForm.serviceId}
                        onChange={(e) => handleFormChange('serviceId', e.target.value)}
                        className="w-full px-3 py-2 bg-white border-2 border-gray-500 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                        required
                      >
                        <option value="">Seleccionar servicio...</option>
                        {services && services.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.name} ({service.duration} min)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Fecha y Hora */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                        <input
                          type="date"
                          value={appointmentForm.appointmentDate}
                          onChange={(e) => handleFormChange('appointmentDate', e.target.value)}
                          min={getTodayString()}
                          className="w-full px-3 py-2 bg-white border-2 border-gray-500 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hora</label>
                        <select
                          value={appointmentForm.appointmentTime}
                          onChange={(e) => handleFormChange('appointmentTime', e.target.value)}
                          className="w-full px-3 py-2 bg-white border-2 border-gray-500 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                          required
                        >
                          <option value="">Seleccionar hora...</option>
                          {availableTimes && availableTimes.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Notas */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
                      <textarea
                        value={appointmentForm.notes}
                        onChange={(e) => handleFormChange('notes', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 bg-white border-2 border-gray-500 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      onClick={() => setShowEditModal(false)}
                      disabled={formLoading}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary to-pink-700 hover:from-pink-700 hover:to-pink-800 rounded-lg transition-colors disabled:opacity-50 flex items-center"
                      onClick={handleEditAppointment}
                      disabled={formLoading}
                    >
                      {formLoading && (
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      )}
                      <Save className="h-4 w-4 mr-1" />
                      Guardar Cambios
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Modal de Confirmación para Eliminar */}
      <Transition appear show={showDeleteModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowDeleteModal(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                    Confirmar Eliminación
                  </Dialog.Title>
                  
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-4">
                      ¿Estás seguro de que deseas eliminar permanentemente esta cita médica?
                    </p>
                    
                    {deletingAppointment && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-red-900">
                            Paciente: {deletingAppointment.patient.name}
                          </p>
                          <p className="text-sm text-red-700">
                            Especialista: {deletingAppointment.specialist.name}
                          </p>
                          <p className="text-sm text-red-700">
                            Fecha: {formatYmdStatic(deletingAppointment.appointment_date)} a las {deletingAppointment.appointment_time}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500 mt-4">
                      Esta acción no se puede deshacer.
                    </p>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      onClick={() => setShowDeleteModal(false)}
                      disabled={formLoading}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center"
                      onClick={handleDeleteAppointment}
                      disabled={formLoading}
                    >
                      {formLoading && (
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      )}
                      <Trash2 className="h-4 w-4 mr-1" />
                      Eliminar
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  )
}

