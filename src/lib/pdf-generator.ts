import jsPDF from 'jspdf'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface AppointmentData {
  id: string
  patientName: string
  patientEmail: string
  patientPhone?: string
  specialistName: string
  specialistTitle: string
  serviceName: string
  serviceDuration: number
  date: Date
  time: string
  createdAt: Date
}

export const generateAppointmentReceipt = (appointment: AppointmentData) => {
  const doc = new jsPDF()
  
  // Configurar fuente
  doc.setFont('helvetica')
  
  // Header con colores del centro de estética
  doc.setFillColor(166, 86, 108) // #a6566c - Tapestry
  doc.rect(0, 0, 210, 25, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.text('CENTRO DE ESTÉTICA INTEGRAL', 105, 10, { align: 'center' })
  doc.setFontSize(14)
  doc.text('Comprobante de Turno', 105, 18, { align: 'center' })
  
  // Reset color
  doc.setTextColor(0, 0, 0)
  
  // Información del comprobante
  doc.setFontSize(10)
  doc.setTextColor(96, 90, 87) // #605a57 - Chicago
  doc.text(`Comprobante N°: ${appointment.id.slice(-8).toUpperCase()}`, 20, 35)
  doc.text(`Fecha de emisión: ${format(appointment.createdAt, 'dd/MM/yyyy HH:mm', { locale: es })}`, 20, 40)
  
  // Título principal
  doc.setTextColor(38, 39, 43) // #26272b - Shark
  doc.setFontSize(16)
  doc.text('DETALLES DEL TURNO ESTÉTICO', 20, 55)
  
  // Línea separadora
  doc.setLineWidth(0.5)
  doc.setDrawColor(166, 86, 108) // #a6566c
  doc.line(20, 60, 190, 60)
  
  // Información de la cita
  doc.setFontSize(12)
  
  // Datos del cliente
  doc.setFont('helvetica', 'bold')
  doc.text('DATOS DEL CLIENTE:', 20, 75)
  doc.setFont('helvetica', 'normal')
  doc.text(`Nombre: ${appointment.patientName}`, 25, 85)
  doc.text(`Email: ${appointment.patientEmail}`, 25, 92)
  if (appointment.patientPhone) {
    doc.text(`Teléfono: ${appointment.patientPhone}`, 25, 99)
  }
  
  // Datos del especialista
  doc.setFont('helvetica', 'bold')
  doc.text('DATOS DEL ESPECIALISTA:', 20, 115)
  doc.setFont('helvetica', 'normal')
  doc.text(`${appointment.specialistName}`, 25, 125)
  doc.text(`${appointment.specialistTitle}`, 25, 132)
  doc.text(`Mat. Profesional`, 25, 139)
  
  // Datos del servicio
  doc.setFont('helvetica', 'bold')
  doc.text('SERVICIO SOLICITADO:', 20, 155)
  doc.setFont('helvetica', 'normal')
  doc.text(`Tratamiento: ${appointment.serviceName}`, 25, 165)
  doc.text(`Duración: ${appointment.serviceDuration} minutos`, 25, 172)
  
  // Datos de la cita
  doc.setFont('helvetica', 'bold')
  doc.text('INFORMACIÓN DEL TURNO:', 20, 188)
  doc.setFont('helvetica', 'normal')
  doc.text(`Fecha: ${format(appointment.date, 'EEEE, dd MMMM yyyy', { locale: es })}`, 25, 198)
  doc.text(`Hora: ${appointment.time}`, 25, 205)
  
  // Box destacado con recordatorio
  doc.setFillColor(229, 207, 194, 0.3) // #e5cfc2 - Bone con transparencia
  doc.rect(20, 220, 170, 50, 'F')
  doc.setFillColor(166, 86, 108) // #a6566c
  doc.rect(20, 220, 170, 3, 'F')
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('RECORDATORIO IMPORTANTE:', 25, 230)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('• Llegar 5 minutos antes de la sesión', 25, 237)
  doc.text('• Si cancelas el turno 2 horas antes de la sesión', 25, 243)
  doc.text('  se te cobra el 50% de la sesión', 25, 249)
  doc.text('• Si no asistis se te cobra el 50% también', 25, 255)
  
  // Información de contacto del centro
  doc.setFontSize(9)
  doc.setTextColor(96, 90, 87) // #605a57
  doc.text('Estética Integral - Barberis 571 - Villa Ramallo, Pcia de Bs As', 25, 268)
  doc.text('Tel: 03407 - 494611 | Email: lorena@esteticaintegral.com.ar', 25, 273)
  
  // Footer
  doc.setFillColor(248, 249, 250)
  doc.rect(0, 278, 210, 27, 'F')
  doc.setTextColor(107, 114, 128)
  doc.setFontSize(8)
  doc.text('Este comprobante es válido únicamente para la fecha y hora especificadas.', 105, 288, { align: 'center' })
  doc.text('Conserve este documento hasta la realización de su turno estético.', 105, 293, { align: 'center' })
  doc.text('Desarrollado por Botón Creativo', 105, 300, { align: 'center' })
  
  return doc
}

export const downloadAppointmentReceipt = (appointment: AppointmentData) => {
  const doc = generateAppointmentReceipt(appointment)
  const fileName = `comprobante-turno-${format(appointment.date, 'yyyy-MM-dd')}-${appointment.time.replace(':', '')}.pdf`
  doc.save(fileName)
}