'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Settings, Sparkles } from 'lucide-react'
import { supabase, AestheticService, isSupabaseConfigured } from '../lib/supabase'
import { AESTHETIC_SERVICES } from '../config/aesthetic-services'
import ServiceSelection from '../components/ServiceSelection'
import SpecialistInfo from '../components/SpecialistInfo'
import AppointmentBooking from '../components/AppointmentBooking'
import AnnouncementBanner from '../components/AnnouncementBanner'

// Datos de ejemplo para mostrar la interfaz cuando Supabase no está configurado
const mockServices: AestheticService[] = [
  {
    id: '1',
    name: 'Drenaje Linfático',
    description: 'Técnica de masaje suave que estimula el sistema linfático para eliminar toxinas y reducir la retención de líquidos.',
    duration: 45,
    category: 'corporal',
    is_active: true
  },
  {
    id: '2',
    name: 'Limpieza Facial',
    description: 'Tratamiento profundo que incluye limpieza, exfoliación y mascarilla purificante.',
    duration: 45,
    category: 'facial',
    is_active: true
  },
  {
    id: '3',
    name: 'Depilación Láser',
    description: 'Eliminación definitiva del vello no deseado mediante tecnología láser de última generación.',
    duration: 20,
    category: 'depilacion',
    is_active: true
  },
  {
    id: '4',
    name: 'Cosmiatría',
    description: 'Tratamientos faciales especializados para mejorar la textura y luminosidad de la piel.',
    duration: 45,
    category: 'facial',
    is_active: true
  },
  {
    id: '5',
    name: 'Reflexología',
    description: 'Técnica terapéutica que estimula puntos específicos en los pies para promover el bienestar.',
    duration: 45,
    category: 'terapeutico',
    is_active: true
  },
  {
    id: '6',
    name: 'Lifting Facial',
    description: 'Tratamiento no invasivo que tensiona y reafirma la piel del rostro.',
    duration: 45,
    category: 'estetico',
    is_active: true
  }
]

export default function Home() {
  const [services, setServices] = useState<AestheticService[]>([])
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [supabaseEnabled, setSupabaseEnabled] = useState(false)

  useEffect(() => {
    const configured = isSupabaseConfigured()
    setSupabaseEnabled(configured)
    
    if (configured) {
      fetchServices()
    } else {
      // Usar datos de ejemplo si Supabase no está configurado
      setServices(mockServices)
    }
  }, [])

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('aesthetic_services')
        .select('*')
        .eq('is_active', true)
        .order('category, name')
      
      if (data) setServices(data)
      if (error) {
        console.error('Error fetching services:', error)
        // Fallback a datos de ejemplo si hay error
        setServices(mockServices)
      }
    } catch (error) {
      console.error('Error connecting to Supabase:', error)
      // Usar datos de ejemplo si hay problemas de conexión
      setServices(mockServices)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-light via-white to-secondary/30">
      <header className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-secondary">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <img 
                  src="/images/logo_estetica-integral.png" 
                  alt="Estética Integral" 
                  className="h-10 w-10 object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Estética Integral
                </h1>
                <p className="text-xs text-neutral">Lorena Esquivel</p>
              </div>
            </div>
            <Link
              href="/admin"
              className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-primary to-accent text-white text-sm font-medium rounded-lg hover:from-primary/90 hover:to-accent/90 transition-all"
            >
              <Settings className="h-4 w-4 mr-1" />
              Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Banner de anuncios */}
        <div className="mb-6">
          <AnnouncementBanner />
        </div>

        {/* Mensaje de bienvenida simple */}
        {!selectedService && (
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Reservá tu turno</h2>
            <p className="text-gray-600">Elegí el servicio que necesitás y reservá en minutos</p>
          </div>
        )}

        {!selectedService ? (
          <ServiceSelection 
            services={services}
            onSelectService={setSelectedService}
          />
        ) : (
          <AppointmentBooking 
            serviceId={selectedService}
            onBack={() => setSelectedService(null)}
          />
        )}
      </main>

      {/* Footer profesional y balanceado */}
      <footer className="bg-gradient-to-r from-gray-50 to-white border-t border-gray-200 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Contenido principal en grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
            {/* Información de la clínica */}
            <div className="text-center md:text-left">
              <div className="font-bold text-gray-900 text-lg mb-2">
                Lorena Esquivel
              </div>
              <div className="text-primary font-medium mb-3">
                Estética Integral
              </div>
              <div className="text-sm text-gray-600 leading-relaxed">
                Barberis 571<br />
                Villa Ramallo, Pcia de Bs As
              </div>
            </div>

            {/* Información de contacto */}
            <div className="text-center md:text-left">
              <div className="font-semibold text-gray-900 text-sm mb-3">
                Contacto
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="font-medium">03407 - 494611</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
              <span>Lun-Vie: 09:00-18:45</span>
                </div>
              </div>
            </div>

            {/* Horarios de atención */}
            <div className="text-center md:text-left">
              <div className="font-semibold text-gray-900 text-sm mb-3">
                Horarios
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Lunes a Viernes: 09:00 - 18:45</div>
                <div>Sábados: 09:00 - 13:00</div>
                <div>Domingos: Cerrado</div>
              </div>
            </div>
          </div>

          {/* Redes sociales */}
          <div className="border-t border-gray-200 pt-6 pb-4">
            <div className="flex justify-center items-center gap-6">
              <a
                href="https://www.instagram.com/esteticaloreesquivel/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="https://api.whatsapp.com/send?phone=543407494611&text=Hola%20Lore%20!%20%F0%9F%92%97%E2%9C%A8%EF%B8%8F%20Me%20gustar%C3%ADa%20un%20turno%20para%20"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-primary transition-colors"
                aria-label="WhatsApp"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Separador y copyright */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="text-xs text-gray-500">
                © 2025 Estética Integral Villa Ramallo. Todos los derechos reservados.
              </div>
              <div className="text-xs text-gray-500">
                Desarrollado por{' '}
                <a 
                  href="https://botoncreativo.onrender.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:text-pink-700 font-medium transition-colors"
                >
                  Boton Creativo
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}