'use client'
import { useState } from 'react'
import { Search, Stethoscope, Heart, Brain, Users, Eye, Scissors, Baby } from 'lucide-react'
import { Combobox } from '@headlessui/react'
import { Specialty } from '../lib/supabase'

interface SpecialtySearchProps {
  specialties: Specialty[]
  onSelectSpecialty: (specialtyId: string) => void
}

// Mapeo de iconos médicos específicos
const getSpecialtyIcon = (specialtyName: string) => {
  const name = specialtyName.toLowerCase()
  if (name.includes('cardio')) return Heart
  if (name.includes('neuro')) return Brain
  if (name.includes('pediatr')) return Baby
  if (name.includes('oftalm') || name.includes('ojo')) return Eye
  if (name.includes('ciruj') || name.includes('traumat')) return Scissors
  if (name.includes('gineco') || name.includes('urologo')) return Users
  return Stethoscope
}

export default function SpecialtySearch({ specialties, onSelectSpecialty }: SpecialtySearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null)

  const filteredSpecialties = searchTerm === '' 
    ? specialties 
    : specialties.filter(specialty =>
        specialty.name.toLowerCase().includes(searchTerm.toLowerCase())
      )

  return (
    <div className="space-y-8">
      {/* Header mejorado con gradiente médico */}
      <div className="text-center bg-gradient-to-r from-blue-50 to-teal-50 p-8 rounded-2xl border border-blue-100">
        <div className="flex justify-center mb-4">
          <div className="bg-white p-4 rounded-full shadow-lg">
            <Stethoscope className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Encuentra tu Especialista Médico
        </h2>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Conectamos con los mejores profesionales de la salud para brindarte la atención que necesitas
        </p>
        
        {/* Combobox de Headless UI */}
        <div className="relative max-w-lg mx-auto">
          <Combobox value={selectedSpecialty} onChange={(specialty) => {
            if (specialty) {
              setSelectedSpecialty(specialty)
              setSearchTerm('')
              onSelectSpecialty(specialty.id)
            }
          }}>
            <div className="relative">
              <Combobox.Input
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-sm text-gray-700 placeholder-gray-500"
                displayValue={(specialty: Specialty) => specialty?.name || ''}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por especialidad médica..."
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
            </div>

            <Combobox.Options className="absolute z-50 mt-2 w-full bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-60 overflow-auto">
              {filteredSpecialties.length === 0 && searchTerm !== '' ? (
                <div className="relative cursor-default select-none py-4 px-4 text-gray-700">
                  <div className="text-center">
                    <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-medium">No encontramos especialidades</p>
                    <p className="text-xs text-gray-500">Intenta con otros términos</p>
                  </div>
                </div>
              ) : (
                filteredSpecialties.map((specialty) => {
                  const SpecialtyIcon = getSpecialtyIcon(specialty.name)
                  return (
                    <Combobox.Option
                      key={specialty.id}
                      className={({ active }) =>
                        `relative cursor-pointer select-none py-3 pl-4 pr-4 ${
                          active ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                        }`
                      }
                      value={specialty}
                    >
                      {({ selected, active }) => (
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${
                            active ? 'bg-blue-200' : 'bg-blue-100'
                          }`}>
                            <SpecialtyIcon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className={`block truncate font-medium ${
                              selected ? 'font-semibold text-blue-700' : ''
                            }`}>
                              {specialty.name}
                            </span>
                            <span className="block text-xs text-gray-500 truncate">
                              {specialty.description}
                            </span>
                          </div>
                          {selected && (
                            <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      )}
                    </Combobox.Option>
                  )
                })
              )}
            </Combobox.Options>
          </Combobox>
        </div>
      </div>

      {/* Instrucciones para el usuario */}
      <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-center mb-4">
          <div className="bg-gradient-to-r from-blue-100 to-teal-100 p-3 rounded-full">
            <Search className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Cómo usar el buscador
        </h3>
        <div className="space-y-2 text-sm text-gray-600 max-w-md mx-auto">
          <p>• <span className="font-medium">Escribe</span> el nombre de la especialidad que buscas</p>
          <p>• <span className="font-medium">Selecciona</span> de la lista desplegable que aparece</p>
          <p>• <span className="font-medium">Navega</span> con las teclas ↑ ↓ para mayor comodidad</p>
        </div>
      </div>
    </div>
  )
}