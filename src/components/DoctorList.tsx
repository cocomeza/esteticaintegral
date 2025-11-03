'use client'
import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, User, Star, Phone, Mail, Award, Clock, Calendar } from 'lucide-react'
import { supabase, Doctor } from '../lib/supabase'

interface DoctorListProps {
  specialtyId: string
  onSelectDoctor: (doctorId: string) => void
  onBack: () => void
}

export default function DoctorList({ specialtyId, onSelectDoctor, onBack }: DoctorListProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDoctors = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('doctors')
      .select(`
        *,
        specialty:specialties(name)
      `)
      .eq('specialty_id', specialtyId)
      .eq('is_active', true)
    
    if (data) setDoctors(data)
    if (error) console.error('Error fetching doctors:', error)
    setLoading(false)
  }, [specialtyId])

  useEffect(() => {
    fetchDoctors()
  }, [fetchDoctors])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Buscando los mejores especialistas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Botón para volver */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Volver a especialidades
        </button>
      </div>

      {/* Lista de doctores */}
      {doctors.length === 0 ? (
        <div className="text-center py-12">
          <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay médicos disponibles</h3>
          <p className="text-gray-600">
            No encontramos médicos para esta especialidad en este momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <div
              key={doctor.id}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
            >
              <div className="p-6">
                {/* Avatar y header */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-full">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Dr. {doctor.name}
                    </h3>
                    <p className="text-blue-600 text-sm font-medium">
                      {doctor.specialty?.name}
                    </p>
                  </div>
                </div>

                {/* Información del doctor */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <Award className="h-4 w-4 mr-2 text-yellow-500" />
                    <span>{doctor.years_experience} años de experiencia</span>
                  </div>
                  
                  {doctor.bio && (
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {doctor.bio}
                    </p>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="truncate">{doctor.email}</span>
                  </div>
                  
                  {doctor.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2 text-green-500" />
                      <span>{doctor.phone}</span>
                    </div>
                  )}
                </div>

                {/* Botón de selección */}
                <button
                  onClick={() => onSelectDoctor(doctor.id)}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 shadow-md"
                >
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Reservar Turno
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
