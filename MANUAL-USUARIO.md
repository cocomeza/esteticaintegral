# 📖 MANUAL DE USUARIO - ESTÉTICA INTEGRAL
**Sistema de Reserva de Turnos Online**  
**Versión:** 2.0.0

---

## 📋 ÍNDICE

1. [Para Clientes - Cómo Reservar Turno](#para-clientes)
2. [Para Administradores - Panel de Control](#para-administradores)
3. [Preguntas Frecuentes](#preguntas-frecuentes)

---

## 👥 PARA CLIENTES

### Cómo Reservar un Turno

#### Paso 1: Ingresar al Sitio Web
- Abrir https://estetica-integral.vercel.app
- Click en "Reservar Turno" o navegar por los servicios

#### Paso 2: Seleccionar Servicio
Elige entre las categorías disponibles:

**Tratamientos Faciales:**
- Limpieza Facial (45 min)
- Cosmiatría (45 min)
- Lifting Facial (45 min)

**Tratamientos Corporales:**
- Drenaje Linfático (45 min)
- Sonoterapia (45 min)
- Fangoterapia (45 min)
- Tratamientos Corporales (45 min)

**Depilación:**
- Depilación Láser (20 min)

**Terapias:**
- Podología (45 min)
- Reflexología (45 min)

#### Paso 3: Elegir Fecha y Hora
1. Selecciona una fecha en el calendario
   - Solo se pueden seleccionar fechas futuras
   - Las fechas cerradas no están disponibles
2. Los horarios disponibles aparecerán automáticamente
3. Selecciona el horario que prefieras

**Horarios de Atención:**
- **Lunes a Viernes:** 9:00 AM - 6:00 PM (almuerzo 1:00-2:00 PM)
- **Sábados:** 9:00 AM - 1:00 PM (solo Depilación Láser)
- **Domingos:** Cerrado

#### Paso 4: Completar Datos Personales
Ingresa tu información:
- **Nombre completo** (obligatorio)
- **Email** (obligatorio - para confirmación)
- **Teléfono** (opcional - formato: +54 11 1234-5678)

#### Paso 5: Confirmar Reserva
1. Revisa toda la información en el resumen
2. Click en "Confirmar Reserva"
3. ✅ ¡Listo! Tu turno está reservado

#### Paso 6: Confirmación
Después de reservar:
- ✅ Verás un mensaje de confirmación
- 📧 Recibirás un email con los detalles
- 📄 Puedes descargar el comprobante en PDF
- 🔔 Recibirás un recordatorio 24h antes (si configurado)

### Importante para el Día de tu Cita

**Recuerda:**
- 🕐 Llegar **15 minutos antes** de tu turno
- 🆔 Traer tu **documento de identidad**
- 🏥 Traer tu **obra social** (si tienes)
- 📱 Si necesitas cancelar, contacta con anticipación

### Si Necesitas Reprogramar o Cancelar

**Contacto:**
- 📞 Teléfono: +54 11 1234-5678
- 📧 Email: lorena@esteticaintegral.com.ar
- 📍 Dirección: Av. Corrientes 1234, CABA

**Horarios de Atención:**
- Lunes a Viernes: 9:00 - 18:00 (almuerzo 13:00-14:00)
- Sábados: 9:00 - 13:00 (todos los servicios)
- Domingos: Cerrado

---

## 💼 PARA ADMINISTRADORES

### Acceder al Panel de Administración

#### Login
1. Ir a https://estetica-integral.vercel.app/admin/login
2. Ingresar credenciales:
   - **Email:** admin@esteticaintegral.com.ar
   - **Password:** (tu contraseña configurada)
3. Click en "Iniciar Sesión"

**Seguridad:**
- Máximo 5 intentos cada 15 minutos
- Sesión expira después de 1 hora de inactividad
- Token se renueva automáticamente

---

### 📅 GESTIÓN DE TURNOS

#### Ver Turnos

**Vista Lista (por defecto):**
- Tabla completa con todas las citas
- Información del paciente, especialista y servicio
- Estado de cada cita (Programada/Completada/Cancelada)

**Vista Calendario:**
1. Click en "Vista Calendario" (arriba a la derecha)
2. Navega por meses con las flechas
3. Citas codificadas por color:
   - 🟣 Rosa = Programada
   - 🟢 Verde = Completada
   - 🔴 Rojo = Cancelada
4. Click en cualquier día para ver detalles

#### Filtros Disponibles

**Búsqueda Rápida:**
- Busca por nombre del paciente, email o teléfono
- Busca por nombre del servicio
- Resultados instantáneos

**Filtros:**
- **Estado:** Todos / Programadas / Completadas / Canceladas
- **Especialista:** Filtrar por profesional
- **Vista:** Activas (3 meses) / Historial / Todas
- **Período:** Hoy / Semana / Mes / Trimestre / Personalizado

#### Crear Nueva Cita

1. Click en "Crear Nueva Cita" (botón verde)
2. Seleccionar **especialista**
3. Seleccionar **servicio**
4. Elegir **paciente existente** o crear nuevo:
   - Si creas nuevo: ingresar nombre, email y teléfono
5. Seleccionar **fecha** (no puede ser pasada)
6. Seleccionar **hora** (solo muestra horarios disponibles)
7. Agregar **notas** (opcional)
8. Click en "Crear Cita"

**Validaciones automáticas:**
- ✅ Fecha no puede estar cerrada (vacaciones)
- ✅ Hora debe estar disponible
- ✅ Servicio debe estar permitido ese día
- ✅ No puede haber overlap con otras citas

#### Editar Cita Existente

1. Buscar la cita en la lista o calendario
2. Click en "Editar"
3. Modificar los campos necesarios
4. Click en "Guardar Cambios"

**Nota:** Al cambiar fecha u hora, el horario anterior queda disponible automáticamente.

#### Cambiar Estado de Cita

**Opciones:**
- **Completar:** Marca como completada cuando el paciente asistió
- **Cancelar:** Marca como cancelada si no asistió o canceló
- **Reactivar:** Vuelve a programar una cita cancelada

**Acciones rápidas en cada fila de la tabla.**

#### Eliminar Cita

1. Click en "Eliminar" (icono de basura)
2. Confirmar la eliminación
3. ⚠️ Esta acción no se puede deshacer

---

### 🕐 GESTIÓN DE HORARIOS

#### Configurar Horarios de Trabajo

1. Ir a pestaña "Horarios"
2. Seleccionar día de la semana
3. Configurar:
   - Hora de inicio
   - Hora de fin
   - Horario de almuerzo (opcional)
   - Servicios permitidos ese día (opcional)
4. Guardar cambios

**Ejemplo:**
- **Lunes a Viernes:** 9:00 - 18:00 (almuerzo 13:00-14:00)
- **Sábados:** 9:00 - 13:00 (solo Depilación Láser)
- **Domingos:** Sin horario (cerrado)

#### Servicios Permitidos por Día

**Uso:**
- Si no seleccionas ninguno = TODOS los servicios permitidos
- Si seleccionas específicos = SOLO esos servicios

**Ejemplo real:**
- Sábados: Solo "Depilación Láser"
- Resultado: Clientes solo pueden reservar depilación los sábados

---

### 🏖️ GESTIÓN DE CIERRES Y VACACIONES

#### Crear Cierre

1. Ir a pestaña "Cierres / Vacaciones"
2. Click en "Crear Nuevo Cierre"
3. Completar:
   - **Tipo:** Vacaciones / Feriado / Personal / Mantenimiento
   - **Fecha desde**
   - **Fecha hasta**
   - **Motivo:** Descripción visible para clientes
4. Guardar

**Efecto:**
- Esas fechas NO aparecerán disponibles para reservas
- Sistema muestra mensaje: "No hay atención disponible: [motivo]"

#### Editar o Desactivar Cierre

- **Editar:** Click en el cierre y modificar
- **Desactivar:** Toggle "Activo" para habilitar/deshabilitar

---

### 📢 GESTIÓN DE ANUNCIOS

#### Crear Anuncio

1. Ir a pestaña "Anuncios"
2. Click en "Crear Nuevo Anuncio"
3. Completar:
   - **Mensaje:** Texto del anuncio
   - **Tipo:** Info / Advertencia / Error
   - **Bloquear reservas:** ✅ Si quieres suspender reservas temporalmente
   - **Activo:** ✅ Para mostrar
4. Guardar

**Tipos de anuncios:**
- **Info** (azul): Mensajes informativos generales
- **Advertencia** (amarillo): Avisos importantes
- **Error** (rojo): Urgente o crítico

**Bloquear reservas:**
- ✅ Activado = Los clientes NO pueden reservar
- Útil para: mantenimiento, emergencias, etc.

---

### 📊 ESTADÍSTICAS Y REPORTES

#### Dashboard Principal

**Métricas en tiempo real:**
- **Total de Citas:** Todas las citas históricas
- **Hoy:** Citas agendadas para hoy
- **Programadas:** Citas futuras confirmadas
- **Completadas:** Citas ya realizadas
- **Esta Semana:** Últimos 7 días
- **Este Mes:** Mes actual
- **Promedio/Día:** Promedio de citas diarias
- **Ocupación:** % de horarios ocupados

**Top Servicios:**
- Lista de los 5 servicios más solicitados del mes
- Con cantidad de citas por servicio

#### Exportar Datos

**Desde la vista de lista:**
1. Aplicar filtros deseados
2. Los datos visibles pueden copiarse
3. (Funcionalidad de exportación a Excel: en desarrollo)

---

### 👥 GESTIÓN DE PACIENTES

#### Ver Pacientes

- Acceso desde API `/api/admin/patients`
- Lista completa de pacientes registrados
- Información: Nombre, Email, Teléfono

#### Buscar Paciente

- Buscar por nombre, email o teléfono
- Resultados instantáneos

#### Crear Paciente

- Se crea automáticamente al hacer primera reserva
- O se puede crear manualmente desde el formulario de cita

#### Actualizar Datos de Paciente

- Si el paciente reserva nuevamente con mismo email
- Sus datos se actualizan automáticamente

---

### ⚙️ CONFIGURACIÓN DEL SISTEMA

#### Cambiar Contraseña de Admin

**Opción 1: Desde Supabase SQL Editor**
```sql
-- Usar script de generación de hash
-- Ver scripts/generate-password-hash.js

UPDATE admin_users 
SET password_hash = '$2b$10$nuevo_hash'
WHERE email = 'admin@esteticaintegral.com.ar';
```

**Opción 2: Desde Terminal**
```bash
cd scripts
node generate-password-hash.js tu_nueva_contraseña
# Copiar el hash generado y ejecutar UPDATE SQL
```

#### Agregar Nuevo Servicio

**Desde Supabase:**
```sql
INSERT INTO aesthetic_services (name, description, duration, category)
VALUES (
  'Nuevo Tratamiento',
  'Descripción detallada',
  45,  -- duración en minutos
  'facial'  -- facial, corporal, depilacion, terapeutico, estetico
);
```

---

## ❓ PREGUNTAS FRECUENTES

### Clientes

#### ¿Puedo reservar más de un turno a la vez?
Sí, pero hay un límite de 3 reservas por hora por seguridad.

#### ¿Cómo sé que mi reserva fue exitosa?
- Verás un mensaje de confirmación en pantalla
- Recibirás un email con los detalles
- Puedes descargar el comprobante en PDF

#### ¿Recibiré recordatorios?
Sí, recibirás un email recordatorio 24 horas antes de tu cita.

#### ¿Puedo cancelar o reprogramar?
Sí, contacta al centro:
- 📞 +54 11 1234-5678
- 📧 lorena@esteticaintegral.com.ar

#### No recibí el email de confirmación
Revisa tu carpeta de spam. Si no está, contacta al centro.

#### ¿Qué pasa si llego tarde?
Por favor llega 15 minutos antes. Si llegas tarde, tu turno puede ser reprogramado.

---

### Administradores

#### ¿Cómo accedo al panel admin?
- URL: https://estetica-integral.vercel.app/admin/login
- Usa tus credenciales de administrador

#### ¿Cuánto dura la sesión?
- 1 hora de actividad
- Se renueva automáticamente si sigues usando el panel
- Después de 7 días debes hacer login nuevamente

#### ¿Puedo crear citas en fechas pasadas?
No, el sistema solo permite fechas futuras o del día actual.

#### ¿Puedo crear citas en días cerrados?
No, el sistema valida automáticamente y muestra error si la fecha está cerrada.

#### ¿Qué pasa si intento reservar un horario ocupado?
El sistema verifica disponibilidad y muestra error: "Horario ocupado".

#### ¿Cómo bloqueo las reservas temporalmente?
1. Ir a pestaña "Anuncios"
2. Crear anuncio con "Bloquear reservas" activado
3. Los clientes verán el mensaje y no podrán reservar

#### ¿Cómo configuro vacaciones?
1. Ir a "Cierres / Vacaciones"
2. Crear cierre con fechas desde/hasta
3. Tipo: "Vacaciones"
4. Motivo: "Vacaciones de verano" (por ejemplo)

#### ¿Los emails se envían automáticamente?
Sí, si configuraste SMTP:
- Email de confirmación: Inmediato
- Email de recordatorio: 24h antes (a las 10 AM)

#### ¿Puedo ver las estadísticas?
Sí, el dashboard muestra:
- Citas de hoy, esta semana, este mes
- Total de citas
- Tasa de ocupación
- Servicios más solicitados

#### ¿Cómo uso la vista de calendario?
1. En pestaña "Turnos"
2. Click en "Vista Calendario" (arriba a la derecha)
3. Navega por meses con las flechas
4. Click en cualquier cita para ver detalles

---

## 📱 INSTALAR COMO APP EN TU MÓVIL

### iPhone (iOS)

1. Abrir el sitio en **Safari**
2. Tap en el icono de **Compartir** (cuadrado con flecha)
3. Scroll y tap en **"Agregar a pantalla de inicio"**
4. Confirmar
5. ✅ La app aparecerá en tu pantalla de inicio

### Android

1. Abrir el sitio en **Chrome**
2. Tap en el **menú** (tres puntos)
3. Tap en **"Instalar app"** o **"Agregar a pantalla de inicio"**
4. Confirmar
5. ✅ La app aparecerá en tu pantalla de inicio

### Computadora (Chrome)

1. Abrir el sitio en **Chrome**
2. Buscar el **icono de instalación** en la barra de dirección
3. Click en **"Instalar"**
4. ✅ La app se abrirá en su propia ventana

**Beneficios:**
- Acceso rápido desde tu pantalla de inicio
- Funciona como app nativa
- Puede funcionar sin internet (caché)

---

## 🔔 NOTIFICACIONES

### Emails que Recibirás

#### 1. Confirmación de Turno (Inmediato)
**Cuándo:** Al completar una reserva  
**Contiene:**
- Fecha y hora del turno
- Servicio reservado
- Especialista asignada
- Duración del tratamiento
- Número de turno
- Recordatorios importantes

#### 2. Recordatorio (24h Antes)
**Cuándo:** Un día antes de tu cita, a las 10 AM  
**Contiene:**
- Recordatorio de tu cita de mañana
- Fecha y hora
- Recomendaciones
- Opción de contacto para reprogramar

---

## 🛡️ SEGURIDAD Y PRIVACIDAD

### Protección de Datos

- ✅ Todos tus datos están **encriptados** en la base de datos
- ✅ Solo el personal autorizado puede acceder
- ✅ No compartimos información con terceros
- ✅ Cumplimos con normativas de privacidad

### Protección Anti-Spam

- Sistema verifica que seas una persona real (no un bot)
- Límite de reservas para prevenir abuso
- Todas las reservas son verificadas

---

## 💡 CONSEJOS Y BUENAS PRÁCTICAS

### Para Clientes

1. **Reserva con anticipación** - Los horarios populares se llenan rápido
2. **Revisa tu email** - Toda la información está en la confirmación
3. **Guarda el comprobante** - Descárgalo por si acaso
4. **Llega temprano** - 15 minutos antes es ideal
5. **Avisa si no puedes asistir** - Así otro paciente puede tomar ese horario

### Para Administradores

1. **Revisa el dashboard diariamente** - Conoce las citas del día
2. **Usa la vista de calendario** - Más fácil ver huecos libres
3. **Configura cierres con anticipación** - Para vacaciones o feriados
4. **Revisa las estadísticas** - Identifica servicios populares
5. **Guarda cambios frecuentemente** - El sistema te advertirá si olvidas
6. **Usa filtros inteligentes** - Vista "Activas" para ver solo citas recientes

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### No puedo reservar un turno

**Posibles causas:**
1. **Fecha seleccionada está cerrada** → Elige otra fecha
2. **No hay horarios disponibles** → Prueba otro día
3. **Excediste el límite de reservas** → Espera 1 hora
4. **Email inválido** → Verifica el formato
5. **Problemas de conexión** → Recarga la página

### El sistema dice "horario ocupado"

- Otra persona reservó ese horario justo antes que tú
- **Solución:** Elige otro horario disponible

### No recibo emails

**Verificar:**
1. Revisa carpeta de **spam**
2. Verifica que el email ingresado sea correcto
3. Contacta al centro si el problema persiste

### Olvidé mi contraseña de admin

**Solución:**
1. Acceder a Supabase directamente
2. Ejecutar script de reseteo de password
3. O contactar al desarrollador del sistema

### La vista de calendario no carga

**Soluciones:**
1. Recarga la página (Ctrl + F5)
2. Limpia caché del navegador
3. Prueba con la "Vista Lista"

---

## 📞 CONTACTO Y SOPORTE

### Centro de Estética Integral

**Dirección:**  
Av. Corrientes 1234, CABA, Argentina

**Teléfono:**  
📞 +54 11 1234-5678

**Email:**  
📧 lorena@esteticaintegral.com.ar

**Horarios de Atención:**
- Lunes a Viernes: 9:00 - 18:00
- Sábados: 9:00 - 13:00
- Domingos: Cerrado

### Soporte Técnico

Para problemas técnicos del sistema:
- 🐛 **Reportar bug:** GitHub Issues
- 💬 **Consultas:** Email del centro

---

## 📱 ACCESIBILIDAD

### Navegación por Teclado

- **Tab:** Navegar entre campos
- **Enter:** Confirmar/Enviar
- **Esc:** Cerrar modales
- **Flechas:** Navegar calendario

### Lectores de Pantalla

El sistema está optimizado para:
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (iOS/Mac)
- TalkBack (Android)

---

## 🎓 CHANGELOG

### Versión 2.0.0 (Octubre 2025)

**🆕 Nuevas Características:**
- ✅ Sistema de emails automáticos
- ✅ Vista de calendario en admin
- ✅ Protección anti-spam (rate limiting)
- ✅ Protección anti-bots (reCAPTCHA)
- ✅ PWA instalable en móviles
- ✅ Dashboard con estadísticas avanzadas
- ✅ Búsqueda en múltiples campos
- ✅ Recordatorios automáticos 24h antes

**🐛 Bugs Corregidos:**
- ✅ Race condition en reservas concurrentes
- ✅ Validación de overlap de horarios
- ✅ Reservas en fechas cerradas
- ✅ Horario de almuerzo no respetado
- ✅ Intervalos fijos de 30 min
- ✅ Servicios permitidos por día

**🔒 Seguridad Mejorada:**
- ✅ Tokens con rotación (1h + 7d)
- ✅ Validaciones más estrictas
- ✅ Advertencia de cambios sin guardar

### Versión 1.0.0 (Septiembre 2025)
- Release inicial del sistema

---

## 📚 GLOSARIO

**Términos técnicos:**

- **PWA:** Progressive Web App (app instalable en móviles)
- **CAPTCHA:** Prueba para verificar que eres humano
- **Rate Limiting:** Límite de requests para prevenir abuso
- **Overlap:** Superposición de horarios
- **Cron Job:** Tarea automática programada
- **JWT:** Token de autenticación
- **RLS:** Seguridad a nivel de filas en la BD

---

**Última actualización:** 20 de Octubre, 2025  
**Versión del manual:** 2.0  
**Para:** Clientes y Administradores

