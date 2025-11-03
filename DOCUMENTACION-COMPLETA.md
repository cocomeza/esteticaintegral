# 📚 DOCUMENTACIÓN COMPLETA - ESTÉTICA INTEGRAL
**Sistema de Gestión de Turnos**  
**Versión:** 2.0.0 | **Fecha:** Octubre 2025

---

## 📋 ÍNDICE

1. [Arquitectura Técnica](#arquitectura-técnica)
2. [Configuración y Deployment](#configuración-y-deployment)
3. [Testing y Calidad](#testing-y-calidad)
4. [Bugs Corregidos](#bugs-corregidos)
5. [Mejoras Implementadas](#mejoras-implementadas)
6. [API Reference](#api-reference)
7. [Troubleshooting](#troubleshooting)

---

## 🏗️ ARQUITECTURA TÉCNICA

### Stack Tecnológico

**Frontend:**
- Next.js 15.5 (App Router)
- TypeScript 5.x
- Tailwind CSS 3.4
- React 19
- Headless UI (modales y componentes)

**Backend:**
- Supabase (PostgreSQL + Auth)
- Next.js API Routes
- Nodemailer (emails)
- JWT (jose) para autenticación

**Seguridad:**
- express-rate-limit (anti-spam)
- Google reCAPTCHA v3 (anti-bot)
- bcryptjs (hash de passwords)
- RLS (Row Level Security)

### Estructura de Carpetas

```
estetica.integral/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/              # Panel administrativo
│   │   │   ├── components/     # Componentes admin
│   │   │   ├── login/          # Login page
│   │   │   └── page.tsx        # Dashboard
│   │   ├── layout.tsx          # Layout raíz
│   │   ├── page.tsx            # Home pública
│   │   └── globals.css         # Estilos globales
│   ├── components/             # Componentes compartidos
│   │   ├── AppointmentBooking.tsx
│   │   ├── RecaptchaProvider.tsx
│   │   └── ServiceSelection.tsx
│   └── lib/                    # Utilidades
│       ├── supabase.ts         # Cliente público
│       ├── supabase-admin.ts   # Cliente admin
│       ├── date-utils.ts       # Manejo de fechas
│       ├── email.ts            # Sistema de emails
│       ├── recaptcha.ts        # Verificación CAPTCHA
│       ├── rate-limit.ts       # Rate limiting
│       ├── admin-auth.ts       # Autenticación admin
│       ├── logger.ts           # Logger condicional
│       └── pdf-generator.ts    # Generación de PDFs
├── pages/api/                  # API Routes
│   ├── appointments.ts         # API pública
│   ├── admin/                  # APIs protegidas
│   │   ├── appointments.ts
│   │   ├── patients.ts
│   │   ├── services.ts
│   │   ├── schedules.ts
│   │   ├── closures.ts
│   │   ├── announcements.ts
│   │   ├── stats.ts
│   │   ├── login.ts
│   │   ├── logout.ts
│   │   └── refresh-token.ts
│   └── cron/                   # Cron jobs
│       └── send-reminders.ts
├── database/                   # Scripts SQL
│   └── supabase-schema.sql
├── __tests__/                  # Tests automatizados
│   ├── appointment-overlap.test.ts
│   └── date-utils.test.ts
├── public/                     # Assets estáticos
│   ├── manifest.json           # PWA manifest
│   └── images/
├── middleware.ts               # Middleware de auth
├── next.config.js              # Configuración Next.js + PWA
├── vercel.json                 # Cron jobs config
└── package.json                # Dependencias
```

---

## ⚙️ CONFIGURACIÓN Y DEPLOYMENT

### Paso 1: Clonar Repositorio

```bash
git clone https://github.com/cocomeza/estetica.integral.git
cd estetica.integral
npm install
```

### Paso 2: Configurar Variables de Entorno

Crear archivo `.env.local`:

```env
# ========================================
# BÁSICO (REQUERIDO)
# ========================================

NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
JWT_SECRET=tu_secret_minimo_32_caracteres

# ========================================
# SEGURIDAD (RECOMENDADO)
# ========================================

# Google reCAPTCHA v3
# Obtener en: https://www.google.com/recaptcha/admin
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=tu_site_key
RECAPTCHA_SECRET_KEY=tu_secret_key

# ========================================
# EMAILS (OPCIONAL)
# ========================================

# Gmail SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu_app_password
SMTP_FROM_NAME=Estética Integral
SMTP_FROM_EMAIL=noreply@esteticaintegral.com.ar

# Cron Job Secret
CRON_SECRET=tu_cron_secret
```

### Paso 3: Configurar Supabase

1. Crear proyecto en [Supabase](https://supabase.com)
2. Ir a SQL Editor
3. Ejecutar `database/supabase-schema.sql`
4. Copiar las credenciales a `.env.local`

### Paso 4: Deployment en Vercel

```bash
# 1. Push a GitHub (si no está)
git add -A
git commit -m "Initial deployment"
git push origin main

# 2. Importar en Vercel
# - Ir a vercel.com
# - Import repository
# - Configurar variables de entorno
# - Deploy

# 3. Configurar Cron Job
# - Agregar CRON_SECRET en Vercel
# - El archivo vercel.json ya está configurado
```

### Obtener Google reCAPTCHA

1. Ir a https://www.google.com/recaptcha/admin
2. Click en "+" para nuevo sitio
3. Tipo: **reCAPTCHA v3**
4. Dominios: `localhost` (dev) + `tu-dominio.vercel.app` (prod)
5. Copiar keys a `.env.local`

### Configurar Gmail SMTP

1. Ir a https://myaccount.google.com/security
2. Activar "2-Step Verification"
3. Ir a "App Passwords"
4. Generar password para "Mail"
5. Copiar a `SMTP_PASS` en `.env.local`

---

## 🧪 TESTING Y CALIDAD

### Tests Automatizados

**Ejecutar tests:**
```bash
npm test                  # Todos los tests
npm test -- --watch       # Mode watch
npm test -- --coverage    # Con coverage
```

**Tests incluidos:**
- `appointment-overlap.test.ts` - 27 casos de overlap de horarios
- `date-utils.test.ts` - 15 casos de manejo de fechas

### Bugs Críticos Corregidos

#### ✅ Bug #1: Race Condition en Reservas
**Problema:** Dos usuarios podían reservar el mismo horario.  
**Solución:** Constraint UNIQUE en BD + manejo de error 23505.

#### ✅ Bug #3: Overlap de Horarios
**Problema:** No validaba superposición de servicios con duración.  
**Solución:** Cálculo de intervalos ocupados considerando duración completa.

```typescript
// Verificar que no haya overlap
if (
  (proposedStart >= occupied.start && proposedStart < occupied.end) ||
  (proposedEnd > occupied.start && proposedEnd <= occupied.end) ||
  (proposedStart <= occupied.start && proposedEnd >= occupied.end)
) {
  hasOverlap = true
}
```

#### ✅ Bug #5: Reservas en Fechas Cerradas
**Problema:** Se podían crear citas en vacaciones/feriados.  
**Solución:** Verificación de tabla `closures` antes de crear/editar.

#### ✅ Bug #6: Horario de Almuerzo
**Problema:** Horarios de almuerzo aparecían como disponibles.  
**Solución:** Exclusión de `lunch_start` a `lunch_end` en cálculos.

#### ✅ Bug #8: Intervalos Fijos de 30 min
**Problema:** Siempre intervalos de 30 min sin importar duración.  
**Solución:** Intervalos dinámicos según duración del servicio.

#### ✅ Bug #9: Servicios Permitidos por Día
**Problema:** No validaba `allowed_services` de horarios.  
**Solución:** Verificación antes de mostrar horarios disponibles.

---

## 🚀 MEJORAS IMPLEMENTADAS

### 🔴 Seguridad (Prioridad Alta)

#### 1. Rate Limiting
- 3 reservas por hora por IP
- 5 intentos de login cada 15 min
- Middleware en endpoints críticos

**Archivo:** `src/lib/rate-limit.ts`

#### 2. Google reCAPTCHA v3
- Verificación invisible
- Score mínimo 0.5
- Integrado en reservas

**Archivos:** `src/lib/recaptcha.ts`, `src/components/RecaptchaProvider.tsx`

#### 3. Notificaciones Email
- Confirmación automática
- Recordatorio 24h antes
- Plantillas HTML profesionales

**Archivos:** `src/lib/email.ts`, `pages/api/cron/send-reminders.ts`

### 🟡 UX y Validaciones

#### 4. Validación Mejorada
- Email: Regex estricta con TLD
- Teléfono: Formato argentino validado

#### 5. Vista de Calendario
- Calendario mensual personalizado
- Click en días para ver citas
- Toggle lista/calendario

**Archivo:** `src/app/admin/components/CalendarView.tsx`

#### 6. Cambios Sin Guardar
- Advertencia antes de salir
- Tracking de modificaciones

#### 7. Rotación de Tokens
- Access token: 1 hora
- Refresh token: 7 días

**Archivo:** `pages/api/admin/refresh-token.ts`

### 🟢 Optimizaciones

#### 8. Dashboard Mejorado
- 12 métricas (antes: 4)
- Top 5 servicios
- Tasa de ocupación

#### 9. Búsqueda Avanzada
- Busca en pacientes, servicios y especialistas
- Resultados combinados

#### 10. PWA
- Instalable en móviles
- Funciona offline
- Service worker automático

**Archivos:** `next.config.js`, `public/manifest.json`

---

## 📡 API REFERENCE

### Endpoints Públicos

#### POST `/api/appointments`
Crear nueva reserva (con rate limiting y CAPTCHA).

**Request:**
```json
{
  "specialistId": "uuid",
  "serviceId": "uuid",
  "appointmentDate": "2025-10-25",
  "appointmentTime": "10:00",
  "duration": 45,
  "patientInfo": {
    "name": "Juan Pérez",
    "email": "juan@email.com",
    "phone": "+54 11 1234-5678"
  },
  "recaptchaToken": "token_from_frontend"
}
```

**Response 201:**
```json
{
  "success": true,
  "appointment": {
    "id": "uuid",
    "appointment_date": "2025-10-25",
    "appointment_time": "10:00",
    ...
  }
}
```

**Errors:**
- `400` - Datos faltantes o inválidos
- `429` - Rate limit excedido
- `500` - Error del servidor

---

### Endpoints Admin (Requieren autenticación)

#### GET `/api/admin/appointments`
Obtener lista de citas con filtros.

**Query params:**
- `page` - Número de página (default: 1)
- `limit` - Items por página (default: 10)
- `search` - Búsqueda en múltiples campos
- `status` - all | scheduled | completed | cancelled
- `specialistId` - Filtrar por especialista
- `startDate` - Fecha desde (YYYY-MM-DD)
- `endDate` - Fecha hasta (YYYY-MM-DD)

#### POST `/api/admin/appointments`
Crear cita desde admin.

#### PUT `/api/admin/appointments`
Actualizar cita existente.

#### DELETE `/api/admin/appointments`
Eliminar cita.

#### POST `/api/admin/login`
Login de administrador (con rate limiting).

#### POST `/api/admin/refresh-token`
Renovar access token usando refresh token.

#### GET `/api/admin/stats`
Obtener estadísticas del dashboard.

---

### Cron Jobs

#### POST `/api/cron/send-reminders`
Envía recordatorios 24h antes (ejecuta diariamente a las 10 AM).

**Headers requeridos:**
```
Authorization: Bearer {CRON_SECRET}
```

---

## 🔒 SEGURIDAD

### Múltiples Capas de Protección

**Capa 1: Frontend**
- Validación de inputs
- reCAPTCHA invisible
- Formularios controlados
- Sanitización de datos

**Capa 2: API Routes**
- Rate limiting
- Verificación de CAPTCHA
- Validación de datos
- Middleware de autenticación

**Capa 3: Backend (Supabase)**
- Row Level Security (RLS)
- Constraints UNIQUE
- Foreign keys
- Triggers de validación

**Capa 4: Base de Datos**
- Constraint: `UNIQUE(specialist_id, appointment_date, appointment_time)`
- Check constraints en estados
- Validación de fechas

### Autenticación Admin

**Flujo de Login:**
1. POST `/api/admin/login` con email y password
2. Verificación contra `admin_users` table
3. Genera access token (1h) + refresh token (7d)
4. Cookies httpOnly, secure, sameSite: strict

**Flujo de Refresh:**
1. Access token expira después de 1h
2. POST `/api/admin/refresh-token` con refresh token
3. Genera nuevo access token
4. Refresh token válido por 7 días

### Rate Limiting

**Endpoints protegidos:**
- `/api/appointments` - 3 requests/hora
- `/api/admin/login` - 5 intentos/15min
- Otros endpoints - 100 requests/15min

**Bypass en desarrollo:**
```typescript
skip: (req) => process.env.NODE_ENV === 'development'
```

---

## 🎨 PALETA DE COLORES

```css
:root {
  --bone: #e5cfc2;      /* Fondo suave */
  --shark: #26272b;     /* Texto principal */
  --chicago: #605a57;   /* Texto secundario */
  --tapestry: #a6566c;  /* Primary/acento */
}
```

**Uso en Tailwind:**
```javascript
// tailwind.config.js
colors: {
  'bone': '#e5cfc2',
  'shark': '#26272b',
  'chicago': '#605a57',
  'tapestry': '#a6566c',
  'primary': '#a6566c',
  'secondary': '#605a57',
  'neutral': '#26272b',
  'light': '#e5cfc2',
}
```

---

## 📧 SISTEMA DE EMAILS

### Configuración SMTP

**Gmail:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=app_password_de_16_digitos
```

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=tu_sendgrid_api_key
```

### Templates de Email

**Confirmación de Reserva:**
- Header con colores de marca
- Detalles completos de la cita
- Recordatorios importantes
- Información de contacto

**Recordatorio 24h Antes:**
- Alert de cita próxima
- Fecha y hora destacadas
- Opción de reprogramar

**Funciones:**
```typescript
// Enviar confirmación
await sendAppointmentConfirmation(appointment)

// Enviar recordatorio
await sendAppointmentReminder(appointment)

// Verificar configuración
await testEmailConfiguration()
```

---

## 🔄 MANEJO DE FECHAS

### Funciones Centralizadas

Todas en `src/lib/date-utils.ts`:

```typescript
// Obtener hoy en formato YYYY-MM-DD
const today = getTodayString()

// Formatear para mostrar al usuario
const display = formatDateForDisplay('2025-10-20')
// Resultado: "lun, 20 oct 2025"

// Formatear Date para API
const apiDate = formatDateForAPI(new Date())
// Resultado: "2025-10-20"

// Parsear sin timezone issues
const date = parseLocalDate('2025-10-20')

// Obtener día de la semana (0-6)
const dayOfWeek = getDayOfWeek('2025-10-20')
```

**Importante:** Usar siempre estas funciones para evitar problemas de zona horaria.

---

## 🗄️ BASE DE DATOS

### Diagrama de Relaciones

```
specialists (1) ──< (N) appointments (N) >── (1) patients
                           │
                           └── (1) aesthetic_services

specialists (1) ──< (N) work_schedules
specialists (1) ──< (N) closures
```

### Tablas Principales

#### `aesthetic_services`
Catálogo de servicios con categorías y duraciones.

```sql
CREATE TABLE aesthetic_services (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL DEFAULT 45,
  category VARCHAR(20),
  is_active BOOLEAN DEFAULT true
);
```

#### `appointments`
Turnos agendados con constraint UNIQUE.

```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY,
  specialist_id UUID REFERENCES specialists(id),
  patient_id UUID REFERENCES patients(id),
  service_id UUID REFERENCES aesthetic_services(id),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled',
  notes TEXT,
  UNIQUE(specialist_id, appointment_date, appointment_time)
);
```

#### `work_schedules`
Horarios de trabajo con servicios permitidos.

```sql
CREATE TABLE work_schedules (
  id UUID PRIMARY KEY,
  specialist_id UUID,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  lunch_start TIME,
  lunch_end TIME,
  allowed_services UUID[],
  UNIQUE(specialist_id, day_of_week)
);
```

#### `closures`
Cierres, vacaciones y feriados.

```sql
CREATE TABLE closures (
  id UUID PRIMARY KEY,
  specialist_id UUID,
  closure_type VARCHAR(20),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  is_active BOOLEAN DEFAULT true,
  CHECK (end_date >= start_date)
);
```

### Políticas RLS

```sql
-- Servicios visibles públicamente
CREATE POLICY "Services viewable by everyone" 
  ON aesthetic_services FOR SELECT USING (true);

-- Solo admins pueden editar
CREATE POLICY "Services editable by admins only" 
  ON aesthetic_services FOR ALL 
  USING (auth.role() = 'service_role');
```

---

## 🛠️ TROUBLESHOOTING

### Error: Email no se envía

**Síntoma:** Reserva se crea pero no llega email.

**Soluciones:**
1. Verificar variables SMTP en Vercel
2. Para Gmail, generar App Password correctamente
3. Verificar logs: `console.log` en `src/lib/email.ts`
4. Probar configuración: `await testEmailConfiguration()`

### Error: CAPTCHA fallido

**Síntoma:** "Verificación de seguridad fallida"

**Soluciones:**
1. Verificar que dominio esté registrado en Google reCAPTCHA
2. Revisar que las keys sean correctas
3. En desarrollo, CAPTCHA se bypasea automáticamente
4. Verificar en Network tab que se envía `recaptchaToken`

### Error: Rate limit en desarrollo

**Síntoma:** "Demasiadas solicitudes"

**Solución:**
Rate limiting está deshabilitado en desarrollo automáticamente:
```typescript
skip: (req) => process.env.NODE_ENV === 'development'
```

### Error: Overlap de horarios

**Síntoma:** Horarios ocupados aparecen como disponibles.

**Verificar:**
1. Que la cita tenga campo `duration` correcto
2. Logs en `fetchAvailableTimes`
3. Query incluye `duration` en select

### Error: Fechas con un día de diferencia

**Síntoma:** Fecha guardada es diferente a la mostrada.

**Solución:**
Usar funciones de `date-utils.ts`:
```typescript
// ❌ NO hacer
const date = new Date(dateString).toISOString().split('T')[0]

// ✅ Hacer
const date = formatDateForAPI(dateObject)
```

### Error: Build falla en Vercel

**Síntomas comunes:**

1. **Missing environment variables**
   - Agregar todas las vars en Vercel Settings

2. **Module not found**
   - Verificar imports relativos
   - Ejecutar `npm install` localmente

3. **TypeScript errors**
   - Configurado para ignorar en build (temporal)
   - Corregir en desarrollo

---

## 📊 ESQUEMA DE VALIDACIONES

### Reserva de Turno (Cliente)

```
1. Seleccionar servicio
   ↓
2. Seleccionar fecha
   ├─ Verificar si es pasada ❌
   ├─ Verificar si está cerrada ❌
   └─ Continuar ✅
   ↓
3. Seleccionar hora
   ├─ Obtener horarios del especialista
   ├─ Excluir horario de almuerzo
   ├─ Obtener citas existentes con duración
   ├─ Calcular intervalos ocupados
   ├─ Verificar overlap
   ├─ Verificar servicios permitidos ese día
   └─ Mostrar solo horarios disponibles
   ↓
4. Ingresar datos del paciente
   ├─ Validar nombre (min 2 caracteres)
   ├─ Validar email (regex estricta)
   └─ Validar teléfono (formato argentino)
   ↓
5. Confirmar reserva
   ├─ Obtener token reCAPTCHA
   ├─ Enviar a API
   ├─ Rate limiting (3/hora)
   ├─ Verificar CAPTCHA (score > 0.5)
   ├─ Verificar especialista activo
   ├─ Verificar servicio activo
   ├─ Verificar fecha no cerrada
   ├─ Verificar horario disponible
   ├─ Buscar/crear paciente
   ├─ Crear cita (constraint UNIQUE)
   ├─ Enviar email de confirmación
   └─ Mostrar comprobante descargable
```

### Reserva desde Admin

```
Similar al flujo público pero:
- Sin rate limiting (admin autenticado)
- Sin CAPTCHA (admin autenticado)
- Puede crear nuevo paciente inline
- Puede seleccionar cualquier horario
- Validaciones de overlap y cierres igualmente aplicadas
```

---

## 🔧 FUNCIONES CLAVE

### Validación de Horarios Disponibles

**Archivo:** `src/lib/supabase-admin.ts`

```typescript
export async function getAvailableTimesForAdmin(
  specialistId: string, 
  date: string, 
  serviceId?: string
) {
  // 1. Obtener horario del día
  const schedule = await getWorkSchedule(specialistId, date)
  
  // 2. Verificar servicios permitidos
  if (serviceId && !isServiceAllowed(schedule, serviceId)) {
    return []
  }
  
  // 3. Obtener duración del servicio
  const duration = await getServiceDuration(serviceId)
  
  // 4. Obtener citas existentes con duración
  const existingAppointments = await getExistingAppointments(specialistId, date)
  
  // 5. Crear intervalos ocupados
  const occupiedIntervals = calculateOccupiedIntervals(
    existingAppointments,
    schedule.lunch_start,
    schedule.lunch_end
  )
  
  // 6. Generar horarios disponibles
  return generateAvailableSlots(
    schedule.start_time,
    schedule.end_time,
    duration,
    occupiedIntervals
  )
}
```

### Envío de Emails

**Archivo:** `src/lib/email.ts`

```typescript
// Confirmación inmediata
export async function sendAppointmentConfirmation(appointment) {
  const mailOptions = {
    from: '"Estética Integral" <noreply@esteticaintegral.com.ar>',
    to: appointment.patient.email,
    subject: '✅ Confirmación de Turno',
    html: createConfirmationTemplate(appointment)
  }
  
  await transporter.sendMail(mailOptions)
}

// Recordatorio 24h antes
export async function sendAppointmentReminder(appointment) {
  // Similar pero con template de recordatorio
}
```

---

## 📱 PWA - PROGRESSIVE WEB APP

### Configuración

**next.config.js:**
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
})

module.exports = withPWA(nextConfig)
```

**public/manifest.json:**
```json
{
  "name": "Estética Integral",
  "short_name": "Estética",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#a6566c"
}
```

### Instalación

**iOS (Safari):**
1. Abrir sitio en Safari
2. Tap en icono de compartir
3. "Agregar a pantalla de inicio"

**Android (Chrome):**
1. Abrir sitio en Chrome
2. Menú > "Instalar app"
3. Confirmar

**Desktop (Chrome):**
1. Icono de instalación en barra de dirección
2. Click "Instalar"

---

## 🔐 CREDENCIALES POR DEFECTO

### Admin User
- **Email:** admin@esteticaintegral.com.ar
- **Password:** admin123
- **⚠️ CAMBIAR EN PRODUCCIÓN**

### Cambiar Password Admin

```sql
-- Generar hash con bcrypt
-- Usar scripts/generate-password-hash.js

UPDATE admin_users 
SET password_hash = '$2b$10$nuevo_hash_aqui'
WHERE email = 'admin@esteticaintegral.com.ar';
```

---

## 📊 MÉTRICAS Y ANALYTICS

### Dashboard Stats

**Métricas disponibles:**
- Total de citas
- Citas hoy
- Citas programadas
- Citas completadas
- Citas canceladas
- Esta semana
- Este mes
- Promedio por día
- Tasa de ocupación (%)
- Top 5 servicios más solicitados

### Cálculo de Ocupación

```typescript
// Asume 8 horas/día, slots según duración de servicios
const daysInMonth = 30
const availableSlots = daysInMonth * 8
const occupancyRate = (appointmentsThisMonth / availableSlots) * 100
```

---

## 🧩 INTEGRACIONES

### Supabase

**Configuración:**
- Project URL
- Anon key (cliente público)
- Service role key (operaciones admin)

**Clientes:**
```typescript
// Cliente público (frontend)
import { supabase } from '@/lib/supabase'

// Cliente admin (backend only)
import { supabaseAdmin } from '@/lib/supabase-admin'
```

### Google reCAPTCHA

**Configuración:**
1. Crear sitio en https://www.google.com/recaptcha/admin
2. Tipo: reCAPTCHA v3
3. Dominios: localhost + tu-dominio.vercel.app
4. Copiar Site Key → frontend
5. Copiar Secret Key → backend

### Vercel Cron

**Archivo:** `vercel.json`
```json
{
  "crons": [{
    "path": "/api/cron/send-reminders",
    "schedule": "0 10 * * *"
  }]
}
```

**Formato schedule:** Cron expression (minuto hora día mes díaSemana)
- `0 10 * * *` = Todos los días a las 10:00 AM
- `0 */2 * * *` = Cada 2 horas
- `0 9 * * 1` = Lunes a las 9 AM

---

## 🎯 FLUJO DE DATOS

### Creación de Reserva Pública

```
Usuario → Frontend (AppointmentBooking)
    ├─ Validar datos localmente
    ├─ Obtener token reCAPTCHA
    └─ POST /api/appointments
        ├─ Rate limiting (3/hora)
        ├─ Verificar reCAPTCHA
        └─ supabase-admin.createPublicAppointment()
            ├─ Verificar especialista activo
            ├─ Verificar servicio activo
            ├─ Verificar fecha no cerrada
            ├─ Verificar horario disponible
            ├─ Buscar/crear paciente
            ├─ INSERT appointment (constraint UNIQUE)
            ├─ Enviar email confirmación
            └─ Retornar cita creada
```

### Reserva desde Admin

```
Admin → AdminDashboard
    ├─ Verificar autenticación (middleware)
    └─ POST /api/admin/appointments
        └─ supabase-admin.createAppointmentForAdmin()
            ├─ Verificar fecha no cerrada
            ├─ Verificar horario disponible
            ├─ INSERT appointment
            └─ Retornar cita creada
```

---

## 📝 NOTAS TÉCNICAS

### TypeScript

**Tipos principales:**
```typescript
interface AppointmentData {
  id: string
  appointment_date: string  // YYYY-MM-DD
  appointment_time: string  // HH:mm
  duration: number          // minutos
  status: 'scheduled' | 'completed' | 'cancelled'
  specialist: Specialist
  service: AestheticService
  patient: Patient
}
```

### Logging

**Uso del logger:**
```typescript
import { logger } from '@/lib/logger'

logger.log('Mensaje de debug')      // Solo en dev
logger.warn('Advertencia')           // Solo en dev
logger.error('Error')                // Siempre
```

---

## 🚦 CHECKLIST DE PRODUCCIÓN

### Antes de Deploy

- [ ] Variables de entorno configuradas en Vercel
- [ ] reCAPTCHA configurado con dominio correcto
- [ ] SMTP configurado si quieres emails
- [ ] Password de admin cambiado
- [ ] JWT_SECRET generado seguro (32+ chars)
- [ ] CRON_SECRET generado si usas recordatorios

### Después de Deploy

- [ ] Probar reserva pública funciona
- [ ] Probar login admin funciona
- [ ] Verificar que lleguen emails
- [ ] Probar rate limiting (3 reservas seguidas)
- [ ] Instalar PWA en móvil
- [ ] Verificar vista de calendario

---

## 📞 SOPORTE

**Repositorio:** https://github.com/cocomeza/estetica.integral  
**Issues:** https://github.com/cocomeza/estetica.integral/issues  
**Demo:** https://estetica-integral.vercel.app

---

**Última actualización:** 20 de Octubre, 2025  
**Versión:** 2.0.0  
**Estado:** ✅ Producción

