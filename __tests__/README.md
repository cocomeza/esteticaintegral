# 🧪 Tests del Sistema de Turnos

Este directorio contiene tests automatizados para las funciones críticas del sistema.

## 📋 Tests Implementados

### ✅ `appointment-overlap.test.ts`
Tests para la validación de overlap de horarios (Bug #3).

**Cubre:**
- Overlap cuando propuesta empieza durante ocupado
- Overlap cuando propuesta termina durante ocupado
- Overlap cuando propuesta contiene ocupado
- Overlap cuando ocupado contiene propuesta
- No overlap cuando propuesta es antes/después
- Múltiples citas ocupadas
- Horario de almuerzo

**Casos de prueba:** 12 tests

---

### ✅ `date-utils.test.ts`
Tests para utilidades de manejo de fechas.

**Cubre:**
- `getTodayString()`: Fecha actual en formato YYYY-MM-DD
- `formatDateForAPI()`: Formateo de Date a string
- `parseLocalDate()`: Parseo sin timezone issues
- `getDayOfWeek()`: Día de la semana correcto
- `isValidDateString()`: Validación de formato
- `fixDateFromDatabase()`: Corrección de timestamps

**Casos de prueba:** 15 tests

---

## 🚀 Cómo Ejecutar los Tests

### Instalación de dependencias
```bash
npm install --save-dev jest @types/jest ts-jest
```

### Configuración de Jest
Crear `jest.config.js`:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}
```

### Ejecutar tests
```bash
# Todos los tests
npm test

# Tests específicos
npm test appointment-overlap

# Con coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

---

## 📊 Coverage Esperado

| Archivo | Cobertura Esperada |
|---------|-------------------|
| `date-utils.ts` | > 90% |
| Lógica de overlap | 100% |

---

## 🧪 Tests Pendientes (Alta Prioridad)

### 1. Tests de Integración
- [ ] Test de reserva concurrente (race condition)
- [ ] Test de creación de cita completa (E2E)
- [ ] Test de validación de cierres

### 2. Tests de API
- [ ] POST `/api/appointments` - reserva pública
- [ ] POST `/api/admin/appointments` - reserva admin
- [ ] GET `/api/admin/available-times` - horarios disponibles

### 3. Tests de Componentes
- [ ] `AppointmentBooking.tsx` - flujo completo
- [ ] `AdminDashboard.tsx` - CRUD de citas
- [ ] Validaciones de formulario

---

## 📝 Notas

- Los tests actuales son **unit tests** que validan lógica de negocio crítica
- Para tests de integración, se necesita configurar un ambiente de testing con Supabase
- Considerar usar **Playwright** o **Cypress** para tests E2E del flujo completo

---

## 🔧 Troubleshooting

### Error: Cannot find module
Asegúrate de que `tsconfig.json` incluya:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### Error: Date timezone issues
Los tests de fechas usan la zona horaria local del sistema. En CI/CD, configurar:
```bash
TZ=America/Argentina/Buenos_Aires npm test
```

---

**Última actualización:** 20 de Octubre, 2025  
**Total de tests:** 27  
**Estado:** ✅ Tests básicos implementados

