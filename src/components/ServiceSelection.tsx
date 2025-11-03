'use client'
import { useState } from 'react'
import { Search, Clock, Sparkles, Heart, Zap, Star, Users } from 'lucide-react'
import { AestheticService } from '../lib/supabase'

interface ServiceSelectionProps {
  services: AestheticService[]
  onSelectService: (serviceId: string) => void
}

const categoryIcons = {
  facial: Heart,
  corporal: Users,
  depilacion: Zap,
  terapeutico: Star,
  estetico: Sparkles
}

const categoryNames = {
  facial: 'Tratamientos Faciales',
  corporal: 'Tratamientos Corporales',
  depilacion: 'Depilación',
  terapeutico: 'Terapias',
  estetico: 'Estética Avanzada'
}

const categoryColors = {
  facial: 'from-pink-600 to-pink-500',
  corporal: 'from-primary to-pink-500',
  depilacion: 'from-pink-700 to-primary',
  terapeutico: 'from-accent to-pink-600',
  estetico: 'from-pink-500 to-primary'
}

export default function ServiceSelection({ services, onSelectService }: ServiceSelectionProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Filtrar servicios por búsqueda y categoría
  const filteredServices = services.filter((service: any) => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || service.category === selectedCategory
    return matchesSearch && matchesCategory && service.is_active
  })

  // Agrupar servicios por categoría
  const servicesByCategory = filteredServices.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = []
    }
    acc[service.category].push(service)
    return acc
  }, {} as Record<string, AestheticService[]>)

  // Obtener categorías únicas
  const categories = Array.from(new Set(services.map((s: any) => s.category)))

  return (
    <div className="space-y-6">
      {/* Barra de búsqueda simple */}
      <div className="max-w-lg mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Buscar servicios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-white border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-dark placeholder-gray-400"
          />
        </div>
      </div>

      {/* Filtros por categoría compactos */}
      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            !selectedCategory
              ? 'bg-gradient-to-r from-primary to-accent text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Todos
        </button>
        {categories.map((category) => {
          const Icon = categoryIcons[category as keyof typeof categoryIcons]
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center space-x-1.5 ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-primary to-accent text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{categoryNames[category as keyof typeof categoryNames]}</span>
            </button>
          )
        })}
      </div>

      {/* Servicios agrupados por categoría - simplificado */}
      <div className="space-y-8">
        {Object.entries(servicesByCategory).map(([category, categoryServices]) => {
          const Icon = categoryIcons[category as keyof typeof categoryIcons]
          const gradientColor = categoryColors[category as keyof typeof categoryColors]
          
          return (
            <div key={category} className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className={`p-1.5 rounded-lg bg-gradient-to-r ${gradientColor}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  {categoryNames[category as keyof typeof categoryNames]}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryServices.map((service) => (
                  <div
                    key={service.id}
                    className="group bg-white rounded-lg shadow hover:shadow-lg transition-all border border-gray-200 hover:border-primary"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-base font-semibold text-gray-900">
                          {service.name}
                        </h4>
                        <div className="flex items-center space-x-1 text-gray-500 text-xs">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{service.duration}'</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => onSelectService(service.id)}
                        className={`w-full bg-gradient-to-r ${gradientColor} text-white py-2 px-3 rounded-lg text-sm font-medium hover:opacity-90 transition-all mt-3`}
                      >
                        Seleccionar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Mensaje cuando no hay resultados */}
      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 mb-3">No se encontraron servicios</p>
          <button
            onClick={() => {
              setSearchTerm('')
              setSelectedCategory(null)
            }}
            className="text-primary text-sm font-medium hover:underline"
          >
            Ver todos los servicios
          </button>
        </div>
      )}
    </div>
  )
}
