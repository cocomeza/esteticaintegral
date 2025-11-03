import nodemailer from 'nodemailer'
import { supabaseAdmin } from './supabase-admin'

export interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
  from: {
    name: string
    email: string
  }
}

export interface EmailResult {
  success: boolean
  method: 'email' | 'database' | 'queue'
  messageId?: string
  error?: string
  fallbackUsed?: boolean
}

export interface EmailQueueItem {
  id: string
  to: string
  subject: string
  html: string
  text: string
  priority: 'high' | 'normal' | 'low'
  attempts: number
  maxAttempts: number
  createdAt: Date
  scheduledFor?: Date
  lastAttempt?: Date
  status: 'pending' | 'sent' | 'failed' | 'retrying'
}

/**
 * 📧 CRÍTICO: Sistema de fallback para emails
 * 
 * Problema: Los emails pueden fallar por múltiples razones
 * Solución: Sistema de fallback con cola de reintentos y almacenamiento en BD
 */

class EmailService {
  private transporter: nodemailer.Transporter | null = null
  private config: EmailConfig | null = null
  private isInitialized = false

  constructor() {
    this.initialize()
  }

  private async initialize() {
    try {
      this.config = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || ''
        },
        from: {
          name: process.env.SMTP_FROM_NAME || 'Estética Integral',
          email: process.env.SMTP_FROM_EMAIL || ''
        }
      }

      if (!this.config.auth.user || !this.config.auth.pass) {
        console.warn('⚠️ Configuración de email incompleta, usando modo fallback')
        this.isInitialized = false
        return
      }

      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: this.config.auth,
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 20000,
        rateLimit: 5
      })

      // Verificar conexión
      await this.transporter.verify()
      this.isInitialized = true
      console.log('✅ Servicio de email inicializado correctamente')

    } catch (error) {
      console.error('❌ Error inicializando servicio de email:', error)
      this.isInitialized = false
    }
  }

  /**
   * Envía email con sistema de fallback
   */
  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<EmailResult> {
    
    console.log(`📧 Enviando email a: ${to}`)
    
    // 1. Intentar envío directo
    if (this.isInitialized && this.transporter) {
      try {
        const result = await this.sendDirectEmail(to, subject, html, text)
        if (result.success) {
          console.log(`✅ Email enviado directamente: ${result.messageId}`)
          return result
        }
      } catch (error) {
        console.error('❌ Error en envío directo:', error)
      }
    }

    // 2. Fallback: Guardar en cola de emails
    console.log('🔄 Usando fallback: guardando en cola de emails')
    return await this.queueEmail(to, subject, html, text || '', priority)
  }

  /**
   * Envío directo de email
   */
  private async sendDirectEmail(
    to: string,
    subject: string,
    html: string,
    text?: string
  ): Promise<EmailResult> {
    
    if (!this.transporter || !this.config) {
      throw new Error('Servicio de email no inicializado')
    }

    const mailOptions = {
      from: `"${this.config.from.name}" <${this.config.from.email}>`,
      to,
      subject,
      html,
      text: text || this.stripHtml(html),
      headers: {
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal'
      }
    }

    const info = await this.transporter.sendMail(mailOptions)
    
    return {
      success: true,
      method: 'email',
      messageId: info.messageId
    }
  }

  /**
   * Guarda email en cola para reintento
   */
  private async queueEmail(
    to: string,
    subject: string,
    html: string,
    text: string,
    priority: 'high' | 'normal' | 'low'
  ): Promise<EmailResult> {
    
    try {
      const queueId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const queueItem: EmailQueueItem = {
        id: queueId,
        to,
        subject,
        html,
        text,
        priority,
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date(),
        status: 'pending'
      }

      // Guardar en base de datos
      const { error } = await supabaseAdmin
        .from('email_queue')
        .insert([{
          id: queueItem.id,
          to_email: queueItem.to,
          subject: queueItem.subject,
          html_content: queueItem.html,
          text_content: queueItem.text,
          priority: queueItem.priority,
          attempts: queueItem.attempts,
          max_attempts: queueItem.maxAttempts,
          status: queueItem.status,
          created_at: queueItem.createdAt.toISOString()
        }])

      if (error) {
        console.error('Error guardando email en cola:', error)
        return {
          success: false,
          method: 'database',
          error: 'Error guardando email en cola'
        }
      }

      console.log(`📬 Email guardado en cola: ${queueId}`)
      
      return {
        success: true,
        method: 'queue',
        fallbackUsed: true
      }

    } catch (error) {
      console.error('Error en queueEmail:', error)
      return {
        success: false,
        method: 'database',
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  }

  /**
   * Procesa cola de emails pendientes
   */
  async processEmailQueue(): Promise<{ processed: number; failed: number; errors: string[] }> {
    console.log('🔄 Procesando cola de emails...')
    
    let processed = 0
    let failed = 0
    const errors: string[] = []

    try {
      // Obtener emails pendientes
      const { data: pendingEmails } = await supabaseAdmin
        .from('email_queue')
        .select('*')
        .eq('status', 'pending')
        .lt('attempts', 'max_attempts')
        .order('priority', { ascending: false }) // high primero
        .order('created_at', { ascending: true }) // más antiguos primero
        .limit(10) // Procesar máximo 10 por vez

      if (!pendingEmails || pendingEmails.length === 0) {
        console.log('📭 No hay emails pendientes en la cola')
        return { processed: 0, failed: 0, errors: [] }
      }

      console.log(`📬 Procesando ${pendingEmails.length} emails pendientes`)

      for (const email of pendingEmails) {
        try {
          // Intentar enviar
          const result = await this.sendDirectEmail(
            email.to_email,
            email.subject,
            email.html_content,
            email.text_content
          )

          if (result.success) {
            // Marcar como enviado
            await supabaseAdmin
              .from('email_queue')
              .update({
                status: 'sent',
                sent_at: new Date().toISOString(),
                message_id: result.messageId
              })
              .eq('id', email.id)

            processed++
            console.log(`✅ Email enviado desde cola: ${email.id}`)
          } else {
            throw new Error(result.error || 'Error enviando email')
          }

        } catch (error) {
          // Incrementar intentos
          const newAttempts = email.attempts + 1
          const status = newAttempts >= email.max_attempts ? 'failed' : 'retrying'
          
          await supabaseAdmin
            .from('email_queue')
            .update({
              attempts: newAttempts,
              status,
              last_attempt: new Date().toISOString(),
              error_message: error instanceof Error ? error.message : 'Error desconocido'
            })
            .eq('id', email.id)

          failed++
          const errorMsg = `Error procesando email ${email.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`
          errors.push(errorMsg)
          console.error(`❌ ${errorMsg}`)
        }
      }

    } catch (error) {
      const errorMsg = `Error procesando cola de emails: ${error instanceof Error ? error.message : 'Error desconocido'}`
      errors.push(errorMsg)
      console.error(`❌ ${errorMsg}`)
    }

    console.log(`📊 Cola procesada: ${processed} enviados, ${failed} fallidos`)
    return { processed, failed, errors }
  }

  /**
   * Obtiene estadísticas de la cola de emails
   */
  async getEmailQueueStats(): Promise<{
    pending: number
    sent: number
    failed: number
    retrying: number
    total: number
  }> {
    try {
      const { data: stats } = await supabaseAdmin
        .from('email_queue')
        .select('status')
        .not('status', 'is', null)

      const counts = {
        pending: 0,
        sent: 0,
        failed: 0,
        retrying: 0,
        total: 0
      }

      stats?.forEach((item: any) => {
        counts[item.status as keyof typeof counts]++
        counts.total++
      })

      return counts
    } catch (error) {
      console.error('Error obteniendo estadísticas de cola:', error)
      return { pending: 0, sent: 0, failed: 0, retrying: 0, total: 0 }
    }
  }

  /**
   * Limpia emails antiguos de la cola
   */
  async cleanupOldEmails(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const { data: deletedEmails } = await supabaseAdmin
        .from('email_queue')
        .delete()
        .in('status', ['sent', 'failed'])
        .lt('created_at', cutoffDate.toISOString())
        .select('id')

      const deletedCount = deletedEmails?.length || 0
      if (deletedCount > 0) {
        console.log(`🧹 Limpiados ${deletedCount} emails antiguos`)
      }

      return deletedCount
    } catch (error) {
      console.error('Error limpiando emails antiguos:', error)
      return 0
    }
  }

  /**
   * Convierte HTML a texto plano
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * Verifica estado del servicio de email
   */
  async getServiceStatus(): Promise<{
    isInitialized: boolean
    hasConfig: boolean
    queueStats: any
    lastError?: string
  }> {
    const queueStats = await this.getEmailQueueStats()
    
    return {
      isInitialized: this.isInitialized,
      hasConfig: !!this.config,
      queueStats
    }
  }
}

// Instancia singleton
export const emailService = new EmailService()

// Funciones de conveniencia
export async function sendAppointmentConfirmationWithFallback(
  to: string,
  patientName: string,
  appointmentDate: string,
  appointmentTime: string,
  serviceName: string,
  specialistName: string,
  customMessage?: string
): Promise<EmailResult> {
  
  const subject = `Confirmación de Cita - ${serviceName}`
  const html = customMessage || `
    <h2>Confirmación de Cita</h2>
    <p>Estimado/a ${patientName},</p>
    <p>Su cita ha sido confirmada:</p>
    <ul>
      <li><strong>Fecha:</strong> ${appointmentDate}</li>
      <li><strong>Hora:</strong> ${appointmentTime}</li>
      <li><strong>Servicio:</strong> ${serviceName}</li>
      <li><strong>Especialista:</strong> ${specialistName}</li>
    </ul>
    <p>Saludos cordiales,<br>${specialistName}</p>
  `

  return await emailService.sendEmail(to, subject, html, undefined, 'high')
}

export async function sendReminderWithFallback(
  to: string,
  patientName: string,
  appointmentDate: string,
  appointmentTime: string,
  serviceName: string
): Promise<EmailResult> {
  
  const subject = `Recordatorio de Cita - ${serviceName}`
  const html = `
    <h2>Recordatorio de Cita</h2>
    <p>Estimado/a ${patientName},</p>
    <p>Le recordamos que tiene una cita programada:</p>
    <ul>
      <li><strong>Fecha:</strong> ${appointmentDate}</li>
      <li><strong>Hora:</strong> ${appointmentTime}</li>
      <li><strong>Servicio:</strong> ${serviceName}</li>
    </ul>
    <p>Por favor confirme su asistencia.</p>
    <p>Saludos cordiales,<br>Estética Integral</p>
  `

  return await emailService.sendEmail(to, subject, html, undefined, 'normal')
}
