# 🧪 GUÍA DE PRUEBAS FUNCIONALES PASO A PASO
**Para verificar que TODO funciona correctamente**

---

## 📋 ÍNDICE DE PRUEBAS

1. [Prueba: Configurar Vacaciones](#prueba-1-configurar-vacaciones)
2. [Prueba: Cambiar Horario de Almuerzo](#prueba-2-cambiar-horario-de-almuerzo)
3. [Prueba: Crear Anuncio que Bloquea Reservas](#prueba-3-crear-anuncio-que-bloquea-reservas)
4. [Prueba: Overlap entre Servicios Diferentes](#prueba-4-overlap-entre-servicios-diferentes)
5. [Verificación Completa del Sistema](#verificacion-completa)

---

## 🧪 PRUEBA #1: Configurar Vacaciones

### Objetivo
Verificar que cuando Lorena configura vacaciones, los clientes NO pueden sacar turnos en esas fechas.

### Paso a Paso

#### 1. Login como Admin
- Ir a `/admin/login`
- Email: `admin@esteticaintegral.com.ar`
- Password: tu contraseña
- Click "Iniciar Sesión"

#### 2. Ir a Pestaña "Cierres / Vacaciones"
- Click en la pestaña "Cierres / Vacaciones"

#### 3. Crear un Cierre
En el formulario:
- **Tipo de cierre:** Vacaciones
- **Fecha inicio:** Elige una fecha futura (ej: 25/10/2025)
- **Fecha fin:** 2-3 días después (ej: 27/10/2025)
- **Motivo:** "Vacaciones de prueba"
- Click en **"Crear"**

#### 4. Verificar que se Creó
- Deberías ver el cierre en la lista
- Con badge azul "Vacaciones"
- Fechas correctas

#### 5. Probar como Cliente
- **Cerrar sesión** del admin
- Ir a la página principal `/`
- Click en cualquier servicio (ej: Limpieza Facial)
- Click en "Reservar Turno"
- **Seleccionar una de las fechas de vacaciones** (25, 26 o 27 de octubre)

**✅ RESULTADO ESPERADO:**
- NO debe mostrar horarios disponibles
- Debe mostrar mensaje: **"No hay atención disponible: Vacaciones de prueba"**

**❌ SI NO FUNCIONA:**
- Verifica que el cierre esté marcado como "Activo"
- Verifica las fechas seleccionadas

#### 6. Desactivar el Cierre
- Volver al admin
- En la lista de cierres, click en **"Desactivar"**

#### 7. Verificar que Ahora SÍ Aparecen Horarios
- Como cliente, recargar la página
- Seleccionar la misma fecha
- **Ahora SÍ deben aparecer horarios disponibles** ✅

---

## 🧪 PRUEBA #2: Cambiar Horario de Almuerzo

### Objetivo
Verificar que al cambiar el horario de almuerzo, los clientes NO pueden reservar en ese horario.

### Paso a Paso

#### 1. Ir a Pestaña "Horarios"
- Login como admin
- Click en "Horarios"

#### 2. Editar Horario de un Día
- Buscar "Lunes" en la lista
- Click en **"Editar"** (icono de lápiz)

#### 3. Cambiar Horario de Almuerzo
- **Almuerzo inicio:** Cambia de `13:00` a `14:00`
- **Almuerzo fin:** Cambia de `14:00` a `15:00`
- Click en **"Actualizar"**

#### 4. Verificar como Cliente
- Cerrar sesión
- Ir a reservar turno
- Seleccionar **próximo lunes**
- Seleccionar un servicio de 45 minutos

**✅ RESULTADO ESPERADO:**
- Horarios disponibles: 9:00, 9:45, 10:30, 11:15, 12:00, 12:45, 13:00, 13:15
- **NO debe aparecer:** 14:00, 14:15, 14:30, 14:45 (horario de almuerzo)
- Horarios después del almuerzo: 15:00, 15:45, 16:30, 17:15

#### 5. Volver a Configuración Original
- Editar nuevamente
- Almuerzo inicio: `13:00`
- Almuerzo fin: `14:00`
- Actualizar

---

## 🧪 PRUEBA #3: Crear Anuncio que Bloquea Reservas

### Objetivo
Verificar que los anuncios con "Bloquear reservas" impiden que los clientes reserven.

### Paso a Paso

#### 1. Ir a Pestaña "Anuncios"
- Login como admin
- Click en "Anuncios"

#### 2. Crear Anuncio
- **Tipo:** Alerta
- **Título:** "Mantenimiento del Sistema"
- **Mensaje:** "Estamos realizando mantenimiento. Las reservas online estarán suspendidas temporalmente."
- ✅ **Mostrar en página principal:** Activado
- ✅ **Bloquear reservas:** Activado
- Click en **"Crear"**

#### 3. Verificar en Home
- Ir a la página principal `/`
- **Deberías ver un banner rojo** en la parte superior con el mensaje

#### 4. Intentar Reservar
- Click en cualquier servicio
- Click en "Reservar Turno"

**✅ RESULTADO ESPERADO:**
- Debe mostrar mensaje de error
- **NO debe permitir seleccionar fecha/hora**
- Botón "Reservar Turno" debe estar deshabilitado

#### 5. Desactivar el Anuncio
- Volver al admin
- En la lista de anuncios, click en **icono de ojo** (Desactivar)

#### 6. Verificar que Ahora SÍ Funciona
- Como cliente, recargar
- **Ahora SÍ debe permitir reservar** ✅

---

## 🧪 PRUEBA #4: Overlap entre Servicios Diferentes

### Objetivo
Verificar que Lorena NO puede tener 2 pacientes al mismo tiempo, incluso con servicios diferentes.

### Paso a Paso

#### 1. Reservar Primera Cita (Depilación Láser)
- Como cliente, seleccionar **"Depilación Láser"** (20 min)
- Seleccionar fecha: **mañana**
- Seleccionar hora: **15:00**
- Completar datos y confirmar

**Cita creada:** 15:00 - 15:20 (Depilación Láser)

#### 2. Abrir en OTRO Navegador
- Abrir Firefox/Edge (diferente al que usaste)
- Ir a la página principal

#### 3. Intentar Reservar Otra Cita (Sonoterapia)
- Seleccionar **"Sonoterapia"** (45 min)
- Seleccionar la **misma fecha** (mañana)
- Ver los horarios disponibles

**✅ RESULTADO ESPERADO:**
```
Horarios que NO deben aparecer:
❌ 14:20 (terminaría a las 15:05 - overlap con depilación)
❌ 14:35 (terminaría a las 15:20 - overlap)
❌ 14:50 (terminaría a las 15:35 - overlap)
❌ 15:00 (empezaría cuando ya hay cita - overlap)

Horarios que SÍ deben aparecer:
✅ 14:00 (termina 14:45 - antes de la depilación)
✅ 15:20 (empieza después de la depilación)
✅ 16:00, 16:45, etc.
```

**Esto confirma:** Lorena NO puede tener 2 pacientes al mismo tiempo ✅

#### 4. Limpiar Prueba
- Como admin, cancelar o eliminar la cita de prueba

---

## 🧪 PRUEBA #5: Cierres con Turnos Programados

### Objetivo
Verificar que el sistema AVISA si hay turnos programados antes de crear un cierre.

### Paso a Paso

#### 1. Crear una Cita Futura
- Como admin, crear cita para el **30/10/2025** a las **10:00**
- Puede ser cualquier servicio

#### 2. Intentar Crear Cierre para Esa Fecha
- Ir a "Cierres / Vacaciones"
- Fecha inicio: **29/10/2025**
- Fecha fin: **31/10/2025**
- Click en "Crear"

**✅ RESULTADO ESPERADO:**
- **Error en rojo**
- Mensaje: "Hay 1 turno(s) programado(s) en este periodo"
- **Lista de turnos en conflicto:**
  - 30/10/2025 a las 10:00 - [Nombre del paciente]
- **NO debe crear el cierre**

#### 3. Cancelar el Turno
- Ir a "Turnos"
- Buscar el turno del 30/10
- Marcarlo como "Cancelado"

#### 4. Intentar Crear Cierre Nuevamente
- Mismas fechas
- Click en "Crear"

**✅ RESULTADO ESPERADO:**
- **Ahora SÍ debe crear el cierre** ✅
- Sin errores

---

## 🧪 PRUEBA #6: Modificar Horario de Almuerzo Afecta Disponibilidad

### Escenario Completo

#### Configuración Inicial
- Lunes: 9:00 - 18:00, Almuerzo: 13:00 - 14:00

#### Prueba 1: Horarios Disponibles Actuales
- Como cliente, reservar para próximo lunes
- Servicio de 45 min
- **Verificar que NO aparezca:** 13:00, 13:15, 13:30, 13:45

#### Prueba 2: Cambiar Almuerzo
- Como admin, editar horario de lunes
- Almuerzo: 12:00 - 13:00 (cambiar)
- Guardar

#### Prueba 3: Verificar Cambio
- Como cliente, recargar
- Seleccionar próximo lunes
- **Ahora NO debe aparecer:** 12:00, 12:15, 12:30, 12:45
- **Ahora SÍ debe aparecer:** 13:00, 13:45, 14:30

**✅ Esto confirma:** Los cambios de horario se aplican inmediatamente

---

## ✅ VERIFICACIÓN COMPLETA DEL SISTEMA

### Checklist Final

Ejecuta todas estas pruebas y marca las que funcionen:

#### Gestión de Cierres/Vacaciones
- [ ] Puedes crear un cierre
- [ ] Los clientes NO pueden reservar en fechas cerradas
- [ ] Aparece mensaje con el motivo del cierre
- [ ] Sistema avisa si hay turnos programados
- [ ] Puedes activar/desactivar cierres
- [ ] Puedes editar cierres existentes
- [ ] Puedes eliminar cierres

#### Gestión de Horarios
- [ ] Puedes cambiar horario de inicio/fin
- [ ] Puedes cambiar horario de almuerzo
- [ ] Los cambios se reflejan inmediatamente en disponibilidad
- [ ] Horarios de almuerzo NO aparecen disponibles
- [ ] Puedes activar/desactivar días
- [ ] Puedes editar horarios existentes

#### Gestión de Anuncios
- [ ] Puedes crear un anuncio
- [ ] El anuncio aparece en la home
- [ ] Opción "Bloquear reservas" funciona
- [ ] Cuando está bloqueado, NO se puede reservar
- [ ] Puedes activar/desactivar anuncios
- [ ] Puedes editar anuncios
- [ ] Puedes eliminar anuncios

#### Validación de Overlap
- [ ] NO se puede reservar mismo horario para 2 servicios diferentes
- [ ] Sistema considera la duración completa del servicio
- [ ] Funciona tanto en reserva pública como en admin
- [ ] Mensaje de error es claro

---

## 🔧 SI ALGO NO FUNCIONA

### Problema: Cierre no bloquea reservas

**Verificar:**
1. El cierre está marcado como "Activo" (toggle verde)
2. Las fechas están correctas
3. Recargar la página del cliente (F5)

### Problema: Horario de almuerzo aparece disponible

**Verificar:**
1. El horario tiene lunch_start y lunch_end configurados
2. El horario está marcado como "Activo"
3. Las horas no tienen formato incorrecto

### Problema: Anuncio no bloquea reservas

**Verificar:**
1. Checkbox "Bloquear reservas" está activado
2. El anuncio está marcado como "Activo"
3. En el código de AppointmentBooking.tsx hay verificación

### Problema: Se pueden reservar 2 servicios al mismo tiempo

**Esto sería un bug serio. Verificar:**
1. Query obtiene TODAS las citas del día (sin filtrar por servicio)
2. Cálculo de overlap está correcto
3. Logs en consola del navegador (F12)

---

## 📊 TABLA DE RESULTADOS

Completa esta tabla después de hacer las pruebas:

| Prueba | Resultado | Notas |
|--------|-----------|-------|
| Crear cierre de vacaciones | ⬜ Funciona / ⬜ Falla | |
| Clientes no pueden reservar en fechas cerradas | ⬜ Funciona / ⬜ Falla | |
| Sistema avisa de turnos programados | ⬜ Funciona / ⬜ Falla | |
| Cambiar horario de almuerzo | ⬜ Funciona / ⬜ Falla | |
| Almuerzo no aparece disponible | ⬜ Funciona / ⬜ Falla | |
| Crear anuncio que bloquea | ⬜ Funciona / ⬜ Falla | |
| Anuncio impide reservas | ⬜ Funciona / ⬜ Falla | |
| Overlap entre servicios diferentes | ⬜ Funciona / ⬜ Falla | |

---

## 🎯 ESCENARIOS CRÍTICOS A PROBAR

### Escenario Real #1: Vacaciones de Verano

**Situación:**
- Lorena se va de vacaciones del 20/12 al 05/01
- Ya hay 3 turnos programados para el 22/12

**Prueba:**
1. Intentar crear cierre 20/12 - 05/01
2. **Debe mostrar error** con los 3 turnos
3. Cancelar los 3 turnos
4. Intentar crear cierre nuevamente
5. **Ahora debe funcionar** ✅
6. Cliente intenta reservar para 25/12
7. **Debe mostrar:** "No hay atención disponible: Vacaciones de verano"

---

### Escenario Real #2: Cambio de Horario de Almuerzo

**Situación:**
- Lorena decide almorzar más tarde: 14:00-15:00 en lugar de 13:00-14:00

**Prueba:**
1. Admin edita horario de Lunes a Viernes
2. Almuerzo: 14:00 - 15:00
3. Guardar
4. Cliente reserva para el martes
5. **Debe ver disponible:** 13:00, 13:45 (antes no estaban)
6. **NO debe ver:** 14:00, 14:45 (ahora es almuerzo)

---

### Escenario Real #3: Mantenimiento de Emergencia

**Situación:**
- Se rompió un equipo, necesita cerrar 2 días

**Prueba:**
1. Admin crea anuncio:
   - Tipo: Alerta
   - Título: "Mantenimiento de Emergencia"
   - Mensaje: "Equipo en reparación. Volvemos el viernes."
   - ✅ Bloquear reservas
   - Fechas: Hoy - Pasado mañana
2. **Clientes ven el mensaje** en home
3. **NO pueden hacer nuevas reservas**
4. Admin puede seguir viendo/editando turnos existentes
5. Cuando termina el mantenimiento → Desactivar anuncio
6. **Reservas vuelven a funcionar** ✅

---

### Escenario Real #4: Día Completo

**Situación:**
- Lorena tiene agenda llena el miércoles
- Quiere ver que NO haya más reservas

**Prueba:**
1. Admin crea 10 citas para el miércoles
2. Llenar horarios de 9:00 a 17:00
3. Cliente intenta reservar para ese miércoles
4. **Debe mostrar:** "No hay horarios disponibles"
5. Admin cancela 1 cita de las 11:00
6. Cliente recarga
7. **Ahora debe aparecer:** 11:00 disponible ✅

---

## 🔍 PUNTOS CRÍTICOS A VERIFICAR

### 1. Validación en Múltiples Capas

**Frontend (Cliente):**
- Fechas cerradas no muestran horarios
- Horarios ocupados no aparecen
- Mensajes claros de error

**Backend (API):**
- Verifica disponibilidad antes de crear
- Verifica cierres antes de crear
- Constraint UNIQUE en BD previene duplicados

**Base de Datos:**
- UNIQUE constraint activo
- Triggers funcionando
- Policies RLS correctas

### 2. Mensajes al Usuario

**Cuando hay cierre:**
```
"No hay atención disponible: [motivo del cierre]"
```

**Cuando hay overlap:**
```
"El horario seleccionado ya no está disponible"
```

**Cuando hay anuncio bloqueando:**
```
"Las reservas están temporalmente suspendidas"
```

---

## 📋 RESULTADO ESPERADO FINAL

Si **TODAS** las pruebas pasan:

✅ Sistema de cierres funciona perfectamente  
✅ Cambios de horario se aplican inmediatamente  
✅ Anuncios con bloqueo funcionan  
✅ Overlap previene citas simultáneas  
✅ **Tu sistema está 100% funcional para entregar** 🎉

---

## 🐛 Reportar Problemas

Si algo **NO funciona**:

1. Anota qué prueba falló
2. Toma screenshot del error
3. Revisa console del navegador (F12 > Console)
4. Revisa logs en terminal donde corre `npm run dev`

---

**🧪 Recomendación:** Ejecuta todas estas pruebas antes de entregar a Lorena para estar 100% seguro de que todo funciona.

**Tiempo estimado:** 20-30 minutos para todas las pruebas

---

**Última actualización:** 20 de Octubre, 2025  
**Versión:** 1.0

