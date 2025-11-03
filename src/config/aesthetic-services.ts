// Configuración de servicios para Centro de Estética Lorena Esquivel

export interface AestheticService {
  id: string
  name: string
  description: string
  duration: number // en minutos
  category: 'facial' | 'corporal' | 'depilacion' | 'terapeutico' | 'estetico'
  isActive: boolean
}

export const AESTHETIC_SERVICES: AestheticService[] = [
  {
    id: 'drenaje-linfatico',
    name: 'Drenaje Linfático',
    description: 'Técnica de masaje suave que estimula el sistema linfático para eliminar toxinas, reducir la retención de líquidos y mejorar la circulación. Ideal para combatir la celulitis y mejorar el contorno corporal.',
    duration: 45,
    category: 'corporal',
    isActive: true
  },
  {
    id: 'limpieza-facial',
    name: 'Limpieza Facial',
    description: 'Tratamiento profundo que incluye limpieza, exfoliación, extracción de puntos negros, mascarilla purificante y humectación. Deja la piel renovada, suave y con aspecto saludable.',
    duration: 45,
    category: 'facial',
    isActive: true
  },
  {
    id: 'depilacion-laser',
    name: 'Depilación Láser',
    description: 'Eliminación definitiva del vello no deseado mediante tecnología láser de última generación. Tratamiento seguro, efectivo y duradero para rostro y cuerpo.',
    duration: 20,
    category: 'depilacion',
    isActive: true
  },
  {
    id: 'podologia',
    name: 'Podología',
    description: 'Cuidado integral de los pies incluyendo corte de uñas, tratamiento de callosidades, durezas y uñas encarnadas. Mejora la salud y estética de tus pies.',
    duration: 45,
    category: 'terapeutico',
    isActive: true
  },
  {
    id: 'sonoterapia',
    name: 'Sonoterapia',
    description: 'Terapia con ultrasonido que utiliza ondas sonoras para mejorar la circulación, reducir inflamación y acelerar la regeneración celular. Efectiva para celulitis y flacidez.',
    duration: 45,
    category: 'corporal',
    isActive: true
  },
  {
    id: 'cosmiatria',
    name: 'Cosmiatría',
    description: 'Tratamientos faciales especializados para mejorar la textura, luminosidad y juventud de la piel. Incluye peelings, mesoterapia y tratamientos anti-edad personalizados.',
    duration: 45,
    category: 'facial',
    isActive: true
  },
  {
    id: 'fangoterapia',
    name: 'Fangoterapia',
    description: 'Aplicación de barros terapéuticos ricos en minerales que desintoxican, nutren y revitalizan la piel. Ideal para problemas circulatorios y relajación muscular.',
    duration: 45,
    category: 'corporal',
    isActive: true
  },
  {
    id: 'reflexologia',
    name: 'Reflexología',
    description: 'Técnica terapéutica que estimula puntos específicos en los pies para promover el equilibrio y bienestar general del cuerpo. Alivia tensiones y mejora la circulación.',
    duration: 45,
    category: 'terapeutico',
    isActive: true
  },
  {
    id: 'tratamientos-corporales',
    name: 'Tratamientos Corporales',
    description: 'Variedad de tratamientos para moldear, tonificar y mejorar el aspecto de la piel corporal. Incluye radiofrecuencia, cavitación y tratamientos reductivos.',
    duration: 45,
    category: 'corporal',
    isActive: true
  },
  {
    id: 'lifting',
    name: 'Lifting Facial',
    description: 'Tratamiento no invasivo que tensiona y reafirma la piel del rostro mediante técnicas avanzadas como radiofrecuencia y masajes especializados. Resultados visibles inmediatos.',
    duration: 45,
    category: 'estetico',
    isActive: true
  }
]

// Configuración del profesional
export const PROFESSIONAL_INFO = {
  id: 'lorena-esquivel',
  name: 'Lorena Esquivel',
  title: 'Esteticista Profesional',
  license: 'Mat. 12345', // Matrícula profesional
  bio: 'Especialista en tratamientos estéticos integrales con años de experiencia en el cuidado de la piel y bienestar corporal. Certificada en las últimas técnicas de estética y medicina estética.',
  email: 'lorena@esteticaintegral.com.ar',
  phone: '+54 11 1234-5678',
  address: 'Av. Corrientes 1234, CABA, Argentina',
  profileImage: '/images/lorena-esquivel.jpg',
  specialties: AESTHETIC_SERVICES.map((service: any) => service.id),
  isActive: true
}

// Horarios de trabajo
export const WORK_SCHEDULE = {
  // Lunes a Viernes: Horario completo
  weekdays: [1, 2, 3, 4, 5], // 1=Lunes, 2=Martes, etc.
  weekdayHours: {
    start: '09:00',
    end: '18:45',
    lunchBreak: {
      start: '13:30',
      end: '14:30'
    }
  },
  // Sábados: Solo depilación
  saturday: {
    day: 6, // 6=Sábado
    hours: {
      start: '09:00',
      end: '13:00'
    },
    allowedServices: ['depilacion-laser'] // Solo depilación los sábados
  },
  // Domingo cerrado
  closedDays: [0] // 0=Domingo
}

// Función helper para obtener servicios por categoría
export const getServicesByCategory = (category: AestheticService['category']) => {
  return AESTHETIC_SERVICES.filter((service: any) => service.category === category && service.isActive)
}

// Función helper para obtener servicio por ID
export const getServiceById = (id: string) => {
  return AESTHETIC_SERVICES.find(service => service.id === id)
}

// Función helper para verificar si un servicio está disponible en un día específico
export const isServiceAvailableOnDay = (serviceId: string, dayOfWeek: number): boolean => {
  // Todos los días de lunes a viernes
  if (WORK_SCHEDULE.weekdays.includes(dayOfWeek)) {
    return true
  }
  
  // Sábados solo depilación
  if (dayOfWeek === WORK_SCHEDULE.saturday.day) {
    return WORK_SCHEDULE.saturday.allowedServices.includes(serviceId)
  }
  
  // Domingos cerrado
  return false
}
