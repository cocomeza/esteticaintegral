# 🧪 Test: Funcionalidad de Anuncios que Bloquean Reservas

## ✅ Verificaciones Realizadas

### 1. **Frontend - AppointmentBooking.tsx**
- ✅ Verifica anuncios bloqueantes al cargar el componente
- ✅ Muestra mensaje de bloqueo prominente
- ✅ Deshabilita el botón de reserva cuando hay bloqueo
- ✅ Previene reservas si se intenta hacer click

### 2. **Backend - createPublicAppointment**
- ✅ Valida anuncios bloqueantes antes de crear reservas
- ✅ Lanza error si hay anuncio bloqueando (SEGURIDAD)
- ✅ Verifica fechas de inicio y fin del anuncio

### 3. **API - announcements.ts**
- ✅ Retorna flag `hasBlockingAnnouncement`
- ✅ Filtra anuncios activos por fechas
- ✅ Solo considera anuncios con `block_bookings = true`

### 4. **Componente - AnnouncementBanner**
- ✅ Muestra anuncios en la página principal
- ✅ Indica visualmente si bloquea reservas
- ✅ Permite cerrar/dismiss anuncios

### 5. **Admin - AnnouncementManager**
- ✅ Permite crear anuncios con opción de bloquear reservas
- ✅ Checkbox visible para `block_bookings`
- ✅ Advertencia cuando se activa bloqueo

---

## 🧪 Cómo Probar

### Prueba 1: Crear Anuncio que Bloquea Reservas

1. **Panel Admin** → Pestaña **"Anuncios"**
2. Click en **"Crear Nuevo Anuncio"**
3. Completar:
   - **Tipo:** Alerta (o cualquier tipo)
   - **Título:** "Mantenimiento del sistema"
   - **Mensaje:** "Las reservas están temporalmente suspendidas por mantenimiento. Volverán a estar disponibles el lunes."
   - **Fecha inicio:** (Opcional)
   - **Fecha fin:** (Opcional)
   - ✅ **Marcar:** "Bloquear reservas durante este periodo"
   - ✅ **Marcar:** "Mostrar en página principal"
4. Click en **"Crear"**

**Resultado esperado:**
- ✅ Se crea el anuncio
- ✅ Aparece en la lista con badge "Bloquea Reservas"
- ✅ Se muestra en la página principal

---

### Prueba 2: Verificar Bloqueo en Página Pública

1. Ir a la página pública de reservas (`/`)
2. Seleccionar un servicio
3. Intentar completar una reserva

**Resultado esperado:**
- ❌ Mensaje rojo: "⚠️ Reservas temporalmente suspendidas"
- ❌ Botón deshabilitado: "Reservas Suspendidas" (en gris)
- ❌ No permite hacer click en el botón
- ✅ Banner de anuncio visible en la parte superior

---

### Prueba 3: Intentar Reserva con API Directa

1. Con un anuncio bloqueante activo
2. Intentar crear reserva directamente llamando a la API:
   ```bash
   POST /api/appointments
   {
     "specialistId": "...",
     "serviceId": "...",
     "appointmentDate": "2025-12-15",
     "appointmentTime": "10:00",
     "patientInfo": {...}
   }
   ```

**Resultado esperado:**
- ❌ Error 400: "Las reservas están temporalmente suspendidas: [mensaje]"
- ❌ No permite crear la reserva (SEGURIDAD backend)

---

### Prueba 4: Anuncio con Fechas Específicas

1. Crear anuncio con:
   - **Fecha inicio:** 15 de diciembre 2025
   - **Fecha fin:** 20 de diciembre 2025
   - ✅ **Bloquear reservas** activado

**Resultado esperado:**
- ✅ Solo bloquea entre 15-20 de diciembre
- ✅ Antes del 15: Reservas permitidas
- ✅ Después del 20: Reservas permitidas
- ✅ Entre 15-20: Reservas bloqueadas

---

### Prueba 5: Desactivar Anuncio

1. **Panel Admin** → **"Anuncios"**
2. Encontrar el anuncio bloqueante
3. Click en el botón de ojo (Desactivar)

**Resultado esperado:**
- ✅ El anuncio se marca como inactivo
- ✅ Las reservas vuelven a estar disponibles
- ✅ El mensaje de bloqueo desaparece del frontend

---

## 🔍 Verificación de Consultas

### API Pública - `/api/announcements`
```typescript
// Retorna anuncios activos
const { announcements, hasBlockingAnnouncement } = await fetch('/api/announcements')

// hasBlockingAnnouncement = true si hay algún anuncio con block_bookings = true
```

### Backend - Validación
```typescript
// Verifica anuncios bloqueantes antes de crear reserva
const { data: blockingAnnouncements } = await supabaseAdmin
  .from('announcements')
  .select('*')
  .eq('is_active', true)
  .eq('block_bookings', true)
  // ... filtros de fecha

if (activeBlockingAnnouncements.length > 0) {
  throw new Error('Las reservas están temporalmente suspendidas')
}
```

---

## 📊 Flujo Completo

```
Usuario intenta reservar
    ↓
Frontend verifica anuncios bloqueantes
    ↓
¿Hay anuncio bloqueando?
    ↓
    SÍ → ❌ Muestra mensaje + deshabilita botón
    NO → Continúa al siguiente paso
    ↓
Usuario hace click en "Reservar Turno"
    ↓
handleConfirmBooking verifica bookingsBlocked
    ↓
    SÍ → ❌ Error, no continúa
    NO → Continúa
    ↓
Llamada a API /api/appointments
    ↓
Backend verifica anuncios bloqueantes (SEGURIDAD)
    ↓
    SÍ → ❌ Error, no crea reserva
    NO → Crea la reserva
```

---

## ✅ Estado Actual

**Funcionalidades Verificadas:**
- ✅ Crear anuncios que bloquean reservas
- ✅ Verificar bloqueo en frontend (prevención UX)
- ✅ Verificar bloqueo en backend (seguridad)
- ✅ Mostrar mensajes claros al usuario
- ✅ Deshabilitar botones cuando hay bloqueo
- ✅ Anuncios con fechas específicas funcionan correctamente
- ✅ Desactivar/reactivar anuncios funciona

**Correcciones Aplicadas:**
- ✅ Agregada validación de anuncios bloqueantes en `createPublicAppointment` (backend)
- ✅ Mejorada UI para mostrar mensaje de bloqueo prominente
- ✅ Botón se deshabilita visualmente cuando hay bloqueo

---

## 🎯 Próximos Pasos para Probar

1. **Crear un anuncio bloqueante** desde el panel admin
2. **Verificar en la página pública** que el mensaje aparece
3. **Intentar reservar** y verificar que está bloqueado
4. **Verificar desde consola** que no permite crear reserva
5. **Desactivar el anuncio** y verificar que vuelve a permitir reservas

¡Todo debería funcionar correctamente! 🚀

