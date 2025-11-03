'use client'
import { useState, useEffect } from 'react'
import { ArrowLeft, User, Star, Phone, Mail, Award, Clock, Calendar, Sparkles, Heart, MapPin, Shield } from 'lucide-react'
import { supabase, Specialist } from '../lib/supabase'
import { AESTHETIC_SERVICES, PROFESSIONAL_INFO } from '../config/aesthetic-services'

interface SpecialistInfoProps {
  serviceId: string
  onContinue: () => void
  onBack: () => void
}

export default function SpecialistInfo({ serviceId, onContinue, onBack }: SpecialistInfoProps) {
  const [specialist, setSpecialist] = useState<Specialist | null>(null)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSpecialist()
    fetchService()
  }, [])

  const fetchSpecialist = async () => {
    try {
      const { data, error } = await supabase
        .from('specialists')
        .select('*')
        .eq('is_active', true)
        .single()
      
      if (data) {
        setSpecialist(data)
      } else {
        // Usar datos de ejemplo si no hay datos en Supabase
        setSpecialist({
          id: PROFESSIONAL_INFO.id,
          name: PROFESSIONAL_INFO.name,
          email: PROFESSIONAL_INFO.email,
          phone: PROFESSIONAL_INFO.phone,
          bio: PROFESSIONAL_INFO.bio,
          years_experience: 10,
          title: PROFESSIONAL_INFO.title,
          license: PROFESSIONAL_INFO.license,
          address: PROFESSIONAL_INFO.address,
          specialties: PROFESSIONAL_INFO.specialties,
          is_active: true
        })
      }
      if (error) console.error('Error fetching specialist:', error)
    } catch (error) {
      console.error('Error connecting to Supabase:', error)
      // Usar datos de ejemplo si hay problemas de conexión
      setSpecialist({
        id: PROFESSIONAL_INFO.id,
        name: PROFESSIONAL_INFO.name,
        email: PROFESSIONAL_INFO.email,
        phone: PROFESSIONAL_INFO.phone,
        bio: PROFESSIONAL_INFO.bio,
        years_experience: 10,
        title: PROFESSIONAL_INFO.title,
        license: PROFESSIONAL_INFO.license,
        address: PROFESSIONAL_INFO.address,
        specialties: PROFESSIONAL_INFO.specialties,
        is_active: true
      })
    }
    setLoading(false)
  }

  const fetchService = async () => {
    try {
      const { data, error } = await supabase
        .from('aesthetic_services')
        .select('*')
        .eq('id', serviceId)
        .single()
      
      if (data) {
        setSelectedService(data)
      } else {
        // Usar datos de ejemplo
        const service = AESTHETIC_SERVICES.find(s => s.id === serviceId)
        setSelectedService(service)
      }
      if (error) console.error('Error fetching service:', error)
    } catch (error) {
      console.error('Error connecting to Supabase:', error)
      const service = AESTHETIC_SERVICES.find(s => s.id === serviceId)
      setSelectedService(service)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <div className="animate-spin h-8 w-8 border-4 border-[#a6566c] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-[#605a57] font-medium">Cargando información del especialista...</p>
        </div>
      </div>
    )
  }

  if (!specialist || !selectedService) {
    return (
      <div className="text-center py-12">
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <Heart className="h-16 w-16 text-[#a6566c] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#26272b] mb-2">No se encontró información</h3>
          <p className="text-[#605a57] mb-6">
            No pudimos cargar la información del especialista o servicio.
          </p>
          <button
            onClick={onBack}
            className="bg-gradient-to-r from-[#a6566c] to-[#605a57] text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-all"
          >
            Volver
          </button>
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
          className="flex items-center text-[#a6566c] hover:text-[#605a57] transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Volver a servicios
        </button>
      </div>

      {/* Información del especialista */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-[#e5cfc2]">
        <div className="bg-gradient-to-r from-[#a6566c] to-[#605a57] p-8 text-white">
          <div className="flex items-center space-x-6">
            <div className="bg-white/20 p-4 rounded-full">
              <User className="h-12 w-12 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">{specialist.name}</h2>
              <p className="text-xl opacity-90 mb-3">{specialist.title}</p>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Award className="h-4 w-4" />
                  <span>{specialist.years_experience} años de experiencia</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4" />
                  <span>Especialista Certificada</span>
                </div>
                {specialist.license && (
                  <div className="flex items-center space-x-1">
                    <Shield className="h-4 w-4" />
                    <span>{specialist.license}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Información personal */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-[#26272b] mb-4 flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-[#a6566c]" />
                  Sobre Lorena
                </h3>
                <p className="text-[#605a57] leading-relaxed">
                  {specialist.bio}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-[#605a57]">
                  <Mail className="h-5 w-5 text-[#a6566c]" />
                  <span>{specialist.email}</span>
                </div>
                <div className="flex items-center space-x-3 text-[#605a57]">
                  <Phone className="h-5 w-5 text-[#a6566c]" />
                  <span>{specialist.phone}</span>
                </div>
                {specialist.address && (
                  <div className="flex items-start space-x-3 text-[#605a57]">
                    <MapPin className="h-5 w-5 text-[#a6566c] mt-0.5 flex-shrink-0" />
                    <span>{specialist.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Servicio seleccionado */}
            <div className="bg-gradient-to-br from-[#e5cfc2]/30 to-[#e5cfc2]/10 p-6 rounded-xl border border-[#e5cfc2]">
              <h3 className="text-xl font-semibold text-[#26272b] mb-4 flex items-center">
                <Heart className="h-5 w-5 mr-2 text-[#a6566c]" />
                Servicio Seleccionado
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-[#26272b] text-lg">{selectedService.name}</h4>
                  <p className="text-[#605a57] text-sm mt-1">{selectedService.description}</p>
                </div>
                <div className="flex items-center space-x-2 text-[#605a57]">
                  <Clock className="h-4 w-4 text-[#a6566c]" />
                  <span className="font-medium">Duración: {selectedService.duration} minutos</span>
                </div>
                <div className="pt-4 border-t border-[#e5cfc2]">
                  <p className="text-sm text-[#605a57]">
                    <span className="font-medium">Categoría:</span> {
                      selectedService.category === 'facial' ? 'Tratamientos Faciales' :
                      selectedService.category === 'corporal' ? 'Tratamientos Corporales' :
                      selectedService.category === 'depilacion' ? 'Depilación' :
                      selectedService.category === 'terapeutico' ? 'Terapias' :
                      'Estética Avanzada'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Información adicional */}
          <div className="mt-8 bg-gradient-to-r from-[#e5cfc2]/20 to-[#e5cfc2]/10 p-6 rounded-xl border border-[#e5cfc2]">
            <h3 className="text-lg font-semibold text-[#26272b] mb-4">¿Qué esperar de tu tratamiento?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-[#605a57]">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-[#a6566c] rounded-full mt-2 flex-shrink-0"></div>
                <span>Consulta inicial personalizada</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-[#a6566c] rounded-full mt-2 flex-shrink-0"></div>
                <span>Tratamiento con técnicas profesionales</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-[#a6566c] rounded-full mt-2 flex-shrink-0"></div>
                <span>Recomendaciones post-tratamiento</span>
              </div>
            </div>
          </div>

          {/* Botón de continuar */}
          <div className="mt-8 text-center">
            <button
              onClick={onContinue}
              className="bg-gradient-to-r from-[#a6566c] to-[#605a57] text-white py-4 px-8 rounded-xl font-semibold hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-[#a6566c]/20 transition-all transform hover:scale-105 shadow-lg flex items-center space-x-2 mx-auto"
            >
              <Calendar className="h-5 w-5" />
              <span>Continuar con la Reserva</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
