import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer, { SentMessageInfo } from "nodemailer";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Interfaz para los datos del turno
interface AppointmentData {
  doctorName: string;
  specialtyName: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  appointmentDate: string;
  appointmentTime: string;
}

// Respuesta de la API
interface EmailResponse {
  success: boolean;
  message: string;
  details?: {
    patientEmail?: string | null;
    officeEmail?: string | null;
    errors?: string[];
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EmailResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Método no permitido. Use POST.",
      error: "Método no permitido. Use POST.",
    });
  }

  try {
    const appointmentData: AppointmentData = req.body;

    const {
      doctorName,
      specialtyName,
      patientName,
      patientEmail,
      patientPhone,
      appointmentDate,
      appointmentTime,
    } = appointmentData;

    if (
      !doctorName ||
      !patientName ||
      !patientEmail ||
      !appointmentDate ||
      !appointmentTime
    ) {
      return res.status(400).json({
        success: false,
        message: "Faltan datos requeridos para enviar el email",
        error: "Faltan datos requeridos para enviar el email",
      });
    }

    // Configurar transporte
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    try {
      await transporter.verify();
    } catch (error) {
      console.error("Error verificando conexión SMTP:", error);
      return res.status(500).json({
        success: false,
        message: "Error de configuración del servidor de correo",
        error: "Error de configuración del servidor de correo",
      });
    }

    // Evitar desfase por UTC al formatear una fecha YYYY-MM-DD
    const [yStr, mStr, dStr] = appointmentDate.split("-")
    const localDate = new Date(parseInt(yStr, 10), parseInt(mStr, 10) - 1, parseInt(dStr, 10))
    const formattedDate = format(localDate, "EEEE, d MMMM yyyy", { locale: es })

    // Email para el paciente
    const patientEmailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Confirmación de Turno Médico</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">✅ Turno Confirmado</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #2c3e50;">Hola ${patientName},</h2>
            <p style="font-size: 16px;">Tu turno médico ha sido confirmado exitosamente.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="color: #2c3e50; margin-top: 0;">📋 Detalles de tu cita:</h3>
              <p><strong>👨‍⚕️ Médico:</strong> Dr. ${doctorName}</p>
              <p><strong>🏥 Especialidad:</strong> ${specialtyName}</p>
              <p><strong>📅 Fecha:</strong> ${formattedDate}</p>
              <p><strong>🕐 Hora:</strong> ${appointmentTime}</p>
            </div>
            
            <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #27ae60; margin-top: 0;">💡 Recordatorios importantes:</h3>
              <ul style="margin: 10px 0;">
                <li>Llega 15 minutos antes de tu cita</li>
                <li>Trae tu documento de identidad</li>
                <li>Trae tu obra social (si tienes)</li>
                <li>Si tienes estudios previos, tráelos</li>
              </ul>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Si necesitas cancelar o reprogramar tu cita, por favor contáctanos con anticipación.
            </p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #888; font-size: 12px;">Sistema de Turnos Médicos</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const patientTextContent = `
      CONFIRMACIÓN DE TURNO MÉDICO
      
      Hola ${patientName},
      
      Tu turno médico ha sido confirmado:
      
      Médico: Dr. ${doctorName}
      Especialidad: ${specialtyName}
      Fecha: ${formattedDate}
      Hora: ${appointmentTime}
      
      RECORDATORIOS:
      - Llega 15 minutos antes
      - Trae tu documento de identidad
      - Trae tu obra social (si tienes)
      - Si tienes estudios previos, tráelos
      
      Sistema de Turnos Médicos
    `;

    // Email para el consultorio
    const officeEmailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Nuevo Turno Reservado</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">🏥 Nuevo Turno Reservado</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #2c3e50;">Detalles de la Reserva</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f093fb;">
              <h3 style="color: #2c3e50; margin-top: 0;">👨‍⚕️ Información del Médico:</h3>
              <p><strong>Médico:</strong> Dr. ${doctorName}</p>
              <p><strong>Especialidad:</strong> ${specialtyName}</p>
              <p><strong>Fecha:</strong> ${formattedDate}</p>
              <p><strong>Hora:</strong> ${appointmentTime}</p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
              <h3 style="color: #2c3e50; margin-top: 0;">👤 Información del Paciente:</h3>
              <p><strong>Nombre:</strong> ${patientName}</p>
              <p><strong>Email:</strong> ${patientEmail}</p>
              <p><strong>Teléfono:</strong> ${patientPhone}</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #888; font-size: 12px;">Sistema de Turnos Médicos - Notificación Automática</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const officeTextContent = `
      NUEVO TURNO RESERVADO
      
      MÉDICO:
      Dr. ${doctorName}
      Especialidad: ${specialtyName}
      Fecha: ${formattedDate}
      Hora: ${appointmentTime}
      
      PACIENTE:
      Nombre: ${patientName}
      Email: ${patientEmail}
      Teléfono: ${patientPhone}
      
      Sistema de Turnos Médicos
    `;

    const patientMailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "Sistema de Turnos"}" <${
        process.env.GMAIL_USER
      }>`,
      to: patientEmail,
      replyTo: patientEmail,
      subject: `✅ Turno Confirmado - Dr. ${doctorName} - ${formattedDate} a las ${appointmentTime}`,
      html: patientEmailContent,
      text: patientTextContent,
    };

    const officeMailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "Sistema de Turnos"}" <${
        process.env.GMAIL_USER
      }>`,
      to: process.env.OFFICE_EMAIL || "mezacoco13@gmail.com",
      replyTo: patientEmail,
      subject: `🏥 Nuevo Turno - Dr. ${doctorName} - ${patientName} - ${formattedDate} ${appointmentTime}`,
      html: officeEmailContent,
      text: officeTextContent,
    };

    // Tipamos la promesa para evitar any
    const [patientResult, officeResult] = await Promise.allSettled<
      SentMessageInfo
    >([
      transporter.sendMail(patientMailOptions),
      transporter.sendMail(officeMailOptions),
    ]);

    const patientSuccess = patientResult.status === "fulfilled";
    const officeSuccess = officeResult.status === "fulfilled";

    if (patientSuccess && officeSuccess) {
      return res.status(200).json({
        success: true,
        message: "Emails enviados correctamente a paciente y consultorio",
        details: {
          patientEmail: patientResult.value.messageId,
          officeEmail: officeResult.value.messageId,
        },
      });
    } else {
      const errors: string[] = [];
      if (!patientSuccess) {
        errors.push(
          `Paciente: ${
            patientResult.status === "rejected"
              ? patientResult.reason?.message || "Error desconocido"
              : "Error desconocido"
          }`
        );
      }
      if (!officeSuccess) {
        errors.push(
          `Consultorio: ${
            officeResult.status === "rejected"
              ? officeResult.reason?.message || "Error desconocido"
              : "Error desconocido"
          }`
        );
      }

      return res.status(207).json({
        success: patientSuccess || officeSuccess,
        message: `Emails enviados parcialmente. Errores: ${errors.join(", ")}`,
        details: {
          patientEmail: patientSuccess ? patientResult.value.messageId : null,
          officeEmail: officeSuccess ? officeResult.value.messageId : null,
          errors,
        },
      });
    }
  } catch (error) {
    console.error("Error enviando emails:", error);
    return res.status(500).json({
      success: false,
      error: "Error interno del servidor al enviar emails",
      message:
        error instanceof Error ? error.message : "Error desconocido",
    });
  }
}
