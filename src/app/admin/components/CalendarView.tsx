'use client'

/**
 * Vista de Calendario Simplificada para Panel Admin
 * 📅 MEJORA #6: Visualización de citas en formato calendario
 * Versión simplificada sin dependencias externas pesadas
 */

import { useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { Calendar, Clock, User, Sparkles, X, ChevronLeft, ChevronRight } from 'lucide-react'

interface AppointmentData {
  id: string
  appointment_date: string
  appointment_time: string
  status: 'scheduled' | 'completed' | 'cancelled'
  notes?: string
  created_at?: string  // ✅ Agregar campo opcional para compatibilidad
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

interface CalendarViewProps {
  appointments: AppointmentData[]
  onEditAppointment?: (appointment: AppointmentData) => void
  onRefresh?: () => void
}

export default function CalendarView({ 
  appointments, 
  onEditAppointment,
  onRefresh 
}: CalendarViewProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentData | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Obtener primer y último día del mes
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
  
  // Obtener día de la semana del primer día (0 = Domingo)
  const firstDayOfWeek = firstDay.getDay()
  
  // Generar array de días del mes
  const daysInMonth = lastDay.getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // Navegar entre meses
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
  }

  // Obtener citas para un día específico
  const getAppointmentsForDay = (day: number) => {
    const dateString = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return appointments.filter((appointment: any) => appointment.appointment_date === dateString)
  }

  // Verificar si es hoy
  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    )
  }

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: 'bg-pink-500',
      completed: 'bg-green-500',
      cancelled: 'bg-red-500'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-500'
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      scheduled: 'Programada',
      completed: 'Completada',
      cancelled: 'Cancelada'
    }
    return labels[status as keyof typeof labels] || status
  }

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      scheduled: 'bg-pink-100 text-pink-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm p-6">
        {/* Header del Calendario */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-900">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Hoy
            </button>
            <button
              onClick={goToPreviousMonth}
              className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-pink-700 transition-colors"
              >
                Actualizar
              </button>
            )}
          </div>
        </div>

        {/* Grilla del Calendario */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Nombres de los días */}
          <div className="grid grid-cols-7 bg-gray-50">
            {dayNames.map((day: any) => (
              <div key={day} className="p-3 text-center text-sm font-semibold text-gray-700 border-b border-gray-200">
                {day}
              </div>
            ))}
          </div>

          {/* Días del mes */}
          <div className="grid grid-cols-7">
            {/* Espacios vacíos antes del primer día */}
            {Array.from({ length: firstDayOfWeek }, (_, i) => (
              <div key={`empty-${i}`} className="min-h-[120px] bg-gray-50 border-b border-r border-gray-200"></div>
            ))}

            {/* Días del mes */}
            {days.map((day: any) => {
              const dayAppointments = getAppointmentsForDay(day)
              const today = isToday(day)

              return (
                <div
                  key={day}
                  className={`min-h-[120px] p-2 border-b border-r border-gray-200 ${
                    today ? 'bg-blue-50' : 'bg-white'
                  } hover:bg-gray-50 transition-colors`}
                >
                  <div className={`text-sm font-semibold mb-2 ${
                    today ? 'text-blue-600' : 'text-gray-700'
                  }`}>
                    {day}
                    {today && <span className="ml-1 text-xs">(Hoy)</span>}
                  </div>

                  {/* Citas del día */}
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 3).map((apt: any) => (
                      <button
                        key={apt.id}
                        onClick={() => {
                          setSelectedAppointment(apt)
                          setShowDetailModal(true)
                        }}
                        className={`w-full text-left px-2 py-1 rounded text-xs ${getStatusColor(apt.status)} text-white hover:opacity-90 transition-opacity`}
                      >
                        <div className="font-medium truncate">{apt.appointment_time}</div>
                        <div className="truncate opacity-90">{apt.patient.name}</div>
                      </button>
                    ))}
                    {dayAppointments.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayAppointments.length - 3} más
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Leyenda */}
        <div className="mt-6 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-pink-500 mr-2"></div>
            <span className="text-gray-700">Programada</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-green-500 mr-2"></div>
            <span className="text-gray-700">Completada</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-red-500 mr-2"></div>
            <span className="text-gray-700">Cancelada</span>
          </div>
        </div>
      </div>

      {/* Modal de Detalles de Cita */}
      <Transition appear show={showDetailModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowDetailModal(false)}>
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
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={() => setShowDetailModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <Dialog.Title as="h3" className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <Sparkles className="h-6 w-6 mr-2 text-primary" />
                    Detalles de la Cita
                  </Dialog.Title>

                  {selectedAppointment && (
                    <div className="space-y-4">
                      {/* Estado */}
                      <div className="flex justify-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(selectedAppointment.status)}`}>
                          {getStatusLabel(selectedAppointment.status)}
                        </span>
                      </div>

                      {/* Información del Paciente */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <User className="h-4 w-4 mr-2 text-gray-600" />
                          <h4 className="text-sm font-semibold text-gray-700">Paciente</h4>
                        </div>
                        <p className="text-gray-900 font-medium">{selectedAppointment.patient.name}</p>
                        <p className="text-sm text-gray-600">{selectedAppointment.patient.email}</p>
                        <p className="text-sm text-gray-600">{selectedAppointment.patient.phone}</p>
                      </div>

                      {/* Información del Servicio */}
                      <div className="bg-pink-50 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <Sparkles className="h-4 w-4 mr-2 text-primary" />
                          <h4 className="text-sm font-semibold text-gray-700">Servicio</h4>
                        </div>
                        <p className="text-gray-900 font-medium">{selectedAppointment.service.name}</p>
                        <p className="text-sm text-gray-600">Duración: {selectedAppointment.service.duration} minutos</p>
                      </div>

                      {/* Fecha y Hora */}
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <Clock className="h-4 w-4 mr-2 text-blue-600" />
                          <h4 className="text-sm font-semibold text-gray-700">Fecha y Hora</h4>
                        </div>
                        <p className="text-gray-900 font-medium">
                          {new Date(selectedAppointment.appointment_date + 'T12:00:00').toLocaleDateString('es-AR', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                        <p className="text-sm text-gray-600">{selectedAppointment.appointment_time}</p>
                      </div>

                      {/* Notas */}
                      {selectedAppointment.notes && (
                        <div className="bg-yellow-50 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-1">Notas</h4>
                          <p className="text-sm text-gray-900">{selectedAppointment.notes}</p>
                        </div>
                      )}

                      {/* Botón de Editar */}
                      {onEditAppointment && (
                        <button
                          onClick={() => {
                            setShowDetailModal(false)
                            onEditAppointment(selectedAppointment)
                          }}
                          className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors font-medium"
                        >
                          Editar Cita
                        </button>
                      )}
                    </div>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}
