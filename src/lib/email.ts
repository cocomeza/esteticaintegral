/**
 * Sistema de Notificaciones por Email
 * 📧 MEJORA #3: Confirmación automática de reservas
 */

import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { formatDateForDisplay } from './date-utils'

// Configuración del transporter de Nodemailer
let transporter: Transporter | null = null

function getTransporter(): Transporter {
  if (transporter) {
    return transporter
  }

  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || '587')
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    throw new Error('Configuración SMTP incompleta. Revisa las variables de entorno.')
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  })

  return transporter
}

interface AppointmentEmailData {
  id: string
  patient: {
    name: string
    email: string
    phone?: string
  }
  specialist: {
    name: string
    title: string
  }
  service: {
    name: string
    duration: number
  }
  appointment_date: string
  appointment_time: string
}

/**
 * Envía email de confirmación cuando se crea una reserva
 */
export async function sendAppointmentConfirmation(
  appointment: AppointmentEmailData
): Promise<boolean> {
  try {
    const transporter = getTransporter()

    const fromName = process.env.SMTP_FROM_NAME || 'Estética Integral'
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER

    const formattedDate = formatDateForDisplay(appointment.appointment_date)
    
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: appointment.patient.email,
      subject: '✅ Confirmación de Turno - Estética Integral',
      html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #a6566c 0%, #605a57 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              background: #fff;
              padding: 30px;
              border: 1px solid #e5cfc2;
              border-top: none;
            }
            .info-box {
              background: #f8f5f2;
              border-left: 4px solid #a6566c;
              padding: 15px;
              margin: 20px 0;
            }
            .info-box strong {
              color: #a6566c;
              display: block;
              margin-bottom: 5px;
            }
            .reminder-box {
              background: #fff5f5;
              border: 1px solid #a6566c;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .reminder-box h3 {
              color: #a6566c;
              margin-top: 0;
            }
            .reminder-box ul {
              margin: 10px 0;
              padding-left: 20px;
            }
            .reminder-box li {
              margin: 8px 0;
            }
            .footer {
              background: #26272b;
              color: #e5cfc2;
              padding: 20px;
              text-align: center;
              border-radius: 0 0 10px 10px;
              font-size: 12px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #a6566c;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 15px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>✅ ¡Tu Turno está Confirmado!</h1>
          </div>
          
          <div class="content">
            <p>Hola <strong>${appointment.patient.name}</strong>,</p>
            
            <p>Tu turno ha sido confirmado exitosamente en <strong>Estética Integral - Lorena Esquivel</strong>.</p>
            
            <div class="info-box">
              <strong>📅 Fecha:</strong>
              ${formattedDate}
              
              <strong>🕐 Hora:</strong>
              ${appointment.appointment_time}
              
              <strong>💆 Servicio:</strong>
              ${appointment.service.name}
              
              <strong>⏱️ Duración:</strong>
              ${appointment.service.duration} minutos
              
              <strong>👩‍⚕️ Especialista:</strong>
              ${appointment.specialist.name} - ${appointment.specialist.title}
              
              <strong>📝 Número de Turno:</strong>
              #${appointment.id.substring(0, 8).toUpperCase()}
            </div>
            
            <div class="reminder-box">
              <h3>📌 Recordatorios Importantes</h3>
              <ul>
                <li>✅ Llega <strong>15 minutos antes</strong> de tu cita</li>
                <li>🆔 Trae tu <strong>documento de identidad</strong></li>
                <li>🏥 Trae tu <strong>obra social</strong> (si tienes)</li>
                <li>📱 Si necesitas cancelar o reprogramar, contáctanos con anticipación</li>
              </ul>
            </div>
            
            <p style="text-align: center;">
              <strong>¿Necesitas ayuda?</strong><br>
              📞 Teléfono: +54 11 1234-5678<br>
              📧 Email: lorena@esteticaintegral.com.ar
            </p>
          </div>
          
          <div class="footer">
            <p><strong>Estética Integral - Lorena Esquivel</strong></p>
            <p>Av. Corrientes 1234, CABA, Argentina</p>
            <p style="margin-top: 15px; font-size: 11px;">
              Este es un email automático. Por favor no respondas a este mensaje.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
Hola ${appointment.patient.name},

¡Tu turno está confirmado!

DETALLES DE LA CITA:
- Fecha: ${formattedDate}
- Hora: ${appointment.appointment_time}
- Servicio: ${appointment.service.name}
- Duración: ${appointment.service.duration} minutos
- Especialista: ${appointment.specialist.name}
- Número de turno: #${appointment.id.substring(0, 8).toUpperCase()}

RECORDATORIOS IMPORTANTES:
✅ Llega 15 minutos antes de tu cita
🆔 Trae tu documento de identidad
🏥 Trae tu obra social (si tienes)
📱 Si necesitas cancelar o reprogramar, contáctanos con anticipación

CONTACTO:
Teléfono: +54 11 1234-5678
Email: lorena@esteticaintegral.com.ar

Estética Integral - Lorena Esquivel
Av. Corrientes 1234, CABA, Argentina
      `.trim(),
    }

    const info = await transporter.sendMail(mailOptions)
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Email enviado:', info.messageId)
      console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info))
    }

    return true
  } catch (error) {
    console.error('❌ Error enviando email de confirmación:', error)
    return false
  }
}

/**
 * Envía email de recordatorio 24h antes de la cita
 */
export async function sendAppointmentReminder(
  appointment: AppointmentEmailData
): Promise<boolean> {
  try {
    const transporter = getTransporter()

    const fromName = process.env.SMTP_FROM_NAME || 'Estética Integral'
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER

    const formattedDate = formatDateForDisplay(appointment.appointment_date)
    
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: appointment.patient.email,
      subject: '🔔 Recordatorio: Tu Turno es Mañana - Estética Integral',
      html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #a6566c 0%, #605a57 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #fff;
              padding: 30px;
              border: 1px solid #e5cfc2;
              border-top: none;
            }
            .alert-box {
              background: #fff9e6;
              border-left: 4px solid #ffa500;
              padding: 15px;
              margin: 20px 0;
            }
            .footer {
              background: #26272b;
              color: #e5cfc2;
              padding: 20px;
              text-align: center;
              border-radius: 0 0 10px 10px;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔔 Recordatorio de Turno</h1>
          </div>
          
          <div class="content">
            <p>Hola <strong>${appointment.patient.name}</strong>,</p>
            
            <p>Te recordamos que <strong>mañana tienes tu turno</strong> en Estética Integral:</p>
            
            <div class="alert-box">
              <p style="margin: 0;"><strong>📅 ${formattedDate}</strong></p>
              <p style="margin: 5px 0 0 0;"><strong>🕐 ${appointment.appointment_time}</strong></p>
              <p style="margin: 5px 0 0 0;">💆 ${appointment.service.name}</p>
            </div>
            
            <p><strong>Recuerda:</strong></p>
            <ul>
              <li>Llegar 15 minutos antes</li>
              <li>Traer documento de identidad</li>
              <li>Traer obra social (si tienes)</li>
            </ul>
            
            <p>Si necesitas reprogramar, por favor contáctanos lo antes posible:</p>
            <p style="text-align: center;">
              📞 +54 11 1234-5678
            </p>
            
            <p>¡Te esperamos!</p>
          </div>
          
          <div class="footer">
            <p><strong>Estética Integral - Lorena Esquivel</strong></p>
            <p>Av. Corrientes 1234, CABA, Argentina</p>
          </div>
        </body>
        </html>
      `,
    }

    await transporter.sendMail(mailOptions)
    console.log('✅ Email de recordatorio enviado a:', appointment.patient.email)
    
    return true
  } catch (error) {
    console.error('❌ Error enviando email de recordatorio:', error)
    return false
  }
}

/**
 * Verifica que la configuración de email esté correcta
 */
export async function testEmailConfiguration(): Promise<boolean> {
  try {
    const transporter = getTransporter()
    await transporter.verify()
    console.log('✅ Configuración de email verificada')
    return true
  } catch (error) {
    console.error('❌ Error en configuración de email:', error)
    return false
  }
}

