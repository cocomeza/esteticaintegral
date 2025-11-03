# 🌸 Estética Integral - Lorena Esquivel
<!-- Sistema completo y funcional -->

Sistema profesional de gestión de turnos para centro de estética con todas las funcionalidades implementadas, probadas y optimizadas para producción.

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![Tests](https://img.shields.io/badge/Tests-42%20passing-brightgreen)]()
[![Status](https://img.shields.io/badge/Status-Production%20Ready-success)]()

**🔗 Demo:** [estetica-integral.vercel.app](https://estetica-integral.vercel.app)

---

## ✨ Características Principales

### 📅 Gestión de Turnos
- ✅ **Reserva online** 24/7 con validación en tiempo real
- ✅ **Comprobante PDF descargable** al confirmar el turno
- ✅ **Validación de horarios** con prevención de conflictos
- ✅ **Creación automática de pacientes** al realizar una reserva

### ⏰ Gestión Avanzada de Horarios
- ✅ **Horarios regulares** configurables por día de la semana
- ✅ **Excepciones de horario** por fecha específica (sin afectar horarios permanentes)
- ✅ **Validación de conflictos** antes de cambiar horarios
- ✅ **Cierres por vacaciones** con prevención de reservas en períodos cerrados
- ✅ **Horarios de almuerzo** configurables

### 📢 Sistema de Anuncios
- ✅ **Anuncios públicos** con diferentes tipos (info, alerta, vacaciones, etc.)
- ✅ **Bloqueo de reservas** temporal cuando es necesario
- ✅ **Anuncios con fechas** para mostrar solo en períodos específicos
- ✅ **Banner visible** en la página principal

### 🔐 Panel de Administración
- ✅ **Dashboard** con estadísticas básicas de turnos
- ✅ **Vista de calendario** personalizada para administradores
- ✅ **Gestión de turnos** (crear, editar, cancelar, completar)
- ✅ **Gestión de horarios** y excepciones
- ✅ **Gestión de anuncios** y cierres por vacaciones
- ✅ **Estadísticas básicas** de turnos (total, hoy, programados, completados)

### 🛡️ Seguridad Empresarial
- ✅ **Rate limiting** (3 reservas/hora por IP)
- ✅ **JWT con refresh tokens** (access token 1h, refresh token 7d)
- ✅ **Validaciones múltiples capas** (frontend + backend + DB)
- ✅ **Row Level Security (RLS)** en Supabase
- ✅ **Sanitización de inputs** (prevención XSS)
- ✅ **Control de concurrencia** (previene race conditions)
- ✅ **Encriptación bcrypt** para contraseñas

### 📱 Diseño y UX
- ✅ **Diseño responsive** optimizado para móviles
- ✅ **Interfaz moderna** con Tailwind CSS
- ✅ **Redes sociales** integradas en el footer
- ✅ **Experiencia de usuario** fluida y profesional

### 🌍 Configuración Regional
- ✅ **Zona horaria Argentina** configurada correctamente
- ✅ **Formato de fechas** en español argentino

---

## 🚀 Quick Start

### 1. Instalación

```bash
# Clonar e instalar dependencias
git clone https://github.com/cocomeza/estetica.integral.git
cd estetica.integral
npm install
```

### 2. Configuración de Variables de Entorno

```bash
# Copiar template
cp env-template.txt .env.local

# Editar .env.local con tus credenciales
# Ver CONFIGURAR-SUPABASE.md para obtener credenciales de Supabase
```

**Variables principales:**
```env
NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
JWT_SECRET=tu-jwt-secret
```

### 3. Configurar Base de Datos

1. Ir a **Supabase Dashboard** → **SQL Editor**
2. Ejecutar scripts en este orden:
   - `database/SCHEMA-COMPLETO-FINAL.sql` - Schema principal
   - `database/CREAR-TABLA-SCHEDULE-EXCEPTIONS.sql` - Tabla de excepciones de horario

### 4. Ejecutar el Proyecto

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

El proyecto estará disponible en `http://localhost:3000`

---

## 📚 Documentación Completa

| Archivo | Descripción |
|---------|-------------|
| **MANUAL-USUARIO.md** | 📖 Guía completa para clientes y administradores |
| **DOCUMENTACION-COMPLETA.md** | 🔧 Documentación técnica para desarrolladores |
| **GUIA-EXCEPCIONES-HORARIO.md** | ⏰ Cómo usar excepciones de horario por fecha |
| **GUIA-USO-HORARIOS-VS-EXCEPCIONES.md** | 🔄 Diferencia entre horarios y excepciones |
| **TEST-CIERRES-VACACIONES.md** | 🧪 Pruebas de funcionalidad de cierres |
| **TEST-ANUNCIOS-BLOQUEO.md** | 📢 Pruebas de sistema de anuncios |
| **CONFIGURAR-SUPABASE.md** | ⚙️ Guía para configurar credenciales de Supabase |
| **env-template.txt** | 📝 Template de variables de entorno |

---

## 🎨 Servicios Disponibles

**Faciales:** Limpieza, Cosmiatría, Lifting (45 min)  
**Corporales:** Drenaje Linfático, Sonoterapia, Fangoterapia (45 min)  
**Depilación:** Láser (20 min)  
**Terapias:** Podología, Reflexología (45 min)

---

## ⏰ Horarios de Atención

| Día | Horario | Servicios |
|-----|---------|-----------|
| **Lunes - Viernes** | 09:00 - 18:45<br>(Almuerzo: 13:00 - 14:00) | Todos |
| **Sábados** | 09:00 - 13:00 | Todos |
| **Domingos** | Cerrado | - |

> 💡 **Nota:** Los horarios pueden modificarse desde el panel de administración, y se pueden crear excepciones para días específicos.

---

## 🔐 Panel de Administración

**URL:** `/admin/login`  
**Email:** `lore.estetica76@gmail.com`  
**Password:** `admin123`

> ⚠️ **Importante:** Cambiar la contraseña en producción por seguridad

### Funcionalidades del Panel Admin

- ✅ **Gestión de Turnos:** Crear, editar, cancelar y completar turnos
- ✅ **Gestión de Horarios:** Configurar horarios regulares por día de semana
- ✅ **Excepciones de Horario:** Cambiar horarios para días específicos sin afectar horarios permanentes
- ✅ **Cierres/Vacaciones:** Definir períodos de cierre con prevención automática de reservas
- ✅ **Anuncios:** Crear anuncios públicos y bloquear reservas temporalmente
- ✅ **Estadísticas:** Ver contadores básicos de turnos (total, hoy, programados, completados)

---

## 📄 Comprobante de Turno

Al confirmar una reserva, los pacientes pueden **descargar inmediatamente un comprobante PDF** con todos los detalles del turno:
- Datos del paciente
- Información del servicio
- Fecha y hora de la cita
- Datos del especialista
- Recordatorios importantes

El comprobante se genera automáticamente y está disponible para descarga al momento de la confirmación.

---

## 🧪 Tests

```bash
# Ejecutar todos los tests
npm test

# Modo watch
npm test -- --watch

# Con cobertura
npm test -- --coverage

# Tests manuales
npm run test:manual
```

**42 tests automatizados** cubriendo:
- Validación de horarios
- Prevención de conflictos
- Gestión de turnos
- Validaciones de seguridad

---

## 🚀 Deploy en Vercel

### Pasos para Deploy

1. **Preparar repositorio**
   ```bash
   git add .
   git commit -m "Preparado para deploy"
   git push origin main
   ```

2. **Importar en Vercel**
   - Ir a [vercel.com](https://vercel.com)
   - Importar proyecto desde GitHub
   - Configurar variables de entorno desde `.env.local`

3. **Variables de entorno en Vercel**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`

4. **Deploy automático**
   - Vercel detectará cambios y desplegará automáticamente

---

## 📧 Información de Contacto

**Estética Integral - Lorena Esquivel**  
📍 Av. Corrientes 1234, CABA  
📞 +54 11 1234-5678  
📧 **lore.estetica76@gmail.com**  
🏥 **Mat. 22536** (Licencia Profesional)

### Redes Sociales
- 📱 [Instagram](https://www.instagram.com/esteticaloreesquivel/)
- 👥 [Facebook](https://www.facebook.com/esteticaloreesquivel)
- 💬 [WhatsApp](https://api.whatsapp.com/send?phone=543407494611)

---

## 🎯 Stack Tecnológico

### Frontend
- **Next.js 15** - Framework React con SSR
- **TypeScript 5.x** - Tipado estático
- **Tailwind CSS** - Estilos utilitarios
- **React Hook Form** - Manejo de formularios
- **Date-fns** - Manejo de fechas

### Backend
- **Supabase** - Base de datos PostgreSQL
- **Next.js API Routes** - Endpoints RESTful
- **JWT** - Autenticación de sesiones
- **bcrypt** - Encriptación de contraseñas

### Seguridad
- **Rate Limiting** - Prevención de abuso
- **Row Level Security (RLS)** - Seguridad a nivel de base de datos
- **Sanitización de inputs** - Prevención de XSS

### Generación de Documentos
- **jsPDF** - Generación de comprobantes PDF

---

## 📊 Estado del Proyecto

✅ **COMPLETAMENTE FUNCIONAL Y LISTO PARA PRODUCCIÓN**

### Funcionalidades Completadas
- ✅ **Gestión de turnos** - Crear, editar, cancelar, completar
- ✅ **Sistema de horarios** - Regulares y excepciones por fecha
- ✅ **Cierres por vacaciones** - Con prevención automática de reservas
- ✅ **Sistema de anuncios** - Con bloqueo de reservas temporal
- ✅ **Validación de conflictos** - Previene solapamientos de turnos
- ✅ **Panel de administración** - Dashboard con estadísticas básicas
- ✅ **Comprobante PDF** - Descarga inmediata al confirmar turno
- ✅ **Seguridad empresarial** - Múltiples capas de protección
- ✅ **42 tests automatizados** - Cobertura completa
- ✅ **Documentación completa** - Manuales técnicos y de usuario
- ✅ **Deploy exitoso** - Funcionando en Vercel
- ✅ **Base de datos optimizada** - Schema completo implementado
- ✅ **Redes sociales** - Integradas en el footer

### Mejoras Recientes (2025)
- ✅ **Excepciones de horario** - Cambiar horarios por fecha específica
- ✅ **Validación de conflictos** - Alertas antes de modificar horarios
- ✅ **Cierres por vacaciones mejorados** - Validación en todas las funciones
- ✅ **Anuncios bloqueantes** - Validación en frontend y backend
- ✅ **Horarios extendidos** - Lunes a viernes hasta 18:45
- ✅ **UI mejorada** - Mensajes claros y experiencia mejorada

---

## 🔧 Troubleshooting

### Problema de Login

Si experimentas problemas de login, ejecuta en Supabase SQL Editor:

```sql
-- Corregir contraseña del admin
UPDATE admin_users 
SET password_hash = '$2b$10$LF0DsbDqlgXtQYM.EONkReTiRlU1C6quvmLzWN6b0k4xlPL9Eydm2'
WHERE email = 'lore.estetica76@gmail.com';
```

### Verificar Variables de Entorno

```bash
node scripts/check-env.js
```

Este script verifica que todas las variables necesarias estén configuradas correctamente.

### Verificar Conexión con Supabase

Si tienes errores de conexión:
1. Verificar que las credenciales en `.env.local` sean correctas
2. Verificar que la URL de Supabase sea correcta (no debe ser un placeholder)
3. Revisar `CONFIGURAR-SUPABASE.md` para guía completa

### Scripts de Verificación Disponibles

- `scripts/check-env.js` - Verificar variables de entorno
- `scripts/verify-password.js` - Verificar contraseñas
- `scripts/manual-tests.js` - Tests manuales
- `database/fix-admin-password.sql` - Corregir contraseña en DB

---

## 📖 Guías de Uso Rápido

### Crear Excepción de Horario
1. Panel Admin → **"Excepciones"**
2. Click en **"Agregar Nueva Excepción"**
3. Seleccionar fecha y configurar horario
4. Guardar (el sistema valida conflictos automáticamente)

### Crear Cierre por Vacaciones
1. Panel Admin → **"Cierres / Vacaciones"**
2. Click en **"Agregar Nuevo Cierre"**
3. Definir fechas de inicio y fin
4. Guardar (el sistema previene reservas en ese período)

### Crear Anuncio Bloqueante
1. Panel Admin → **"Anuncios"**
2. Click en **"Crear Nuevo Anuncio"**
3. Activar **"Bloquear reservas durante este periodo"**
4. Guardar (las reservas se bloquean automáticamente)

---

## 🎉 Características Destacadas

### 🎯 Gestión Inteligente de Horarios
- **Horarios regulares** para configurar días de semana recurrentes
- **Excepciones de horario** para modificar días específicos sin afectar el horario permanente
- **Validación automática** de conflictos antes de guardar cambios
- **Prevención de errores** mostrando turnos afectados

### 📢 Sistema de Comunicación
- **Anuncios públicos** con diferentes tipos visuales
- **Bloqueo temporal** de reservas cuando es necesario
- **Banner visible** en la página principal
- **Anuncios con fechas** para mostrar solo en períodos específicos

### 🛡️ Seguridad Robusta
- **Validación en múltiples capas** (frontend + backend + base de datos)
- **Prevención de race conditions** con sistema de locks
- **Rate limiting** para prevenir abuso

---

## 📞 Soporte

Para soporte técnico o preguntas:
- 📧 Email: `lore.estetica76@gmail.com`
- 📱 WhatsApp: [+54 340 749 4611](https://api.whatsapp.com/send?phone=543407494611)

---

**Desarrollado con ❤️ para Centro de Estética Integral**

📖 Ver **MANUAL-USUARIO.md** para guía de uso completa  
🔧 Ver **DOCUMENTACION-COMPLETA.md** para detalles técnicos  
🚨 Ver **SOLUCION-LOGIN.md** para troubleshooting específico
⏰ Ver **GUIA-EXCEPCIONES-HORARIO.md** para gestión de horarios
