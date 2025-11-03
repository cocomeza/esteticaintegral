# 🔧 Fix: Problema de Login de Administrador

## Problema Identificado

El login estaba fallando porque `setAdminSession()` estaba diseñado para App Router (usa `cookies()` de `next/headers`), pero la API route `/api/admin/login` está en Pages Router, donde necesitamos usar `res.setHeader('Set-Cookie', ...)` directamente.

## Solución Aplicada

✅ **Corregido** `pages/api/admin/login.ts` para crear las cookies manualmente en Pages Router API routes.

## Credenciales por Defecto

Según el esquema de la base de datos:
- **Email:** `lore.estetica76@gmail.com`
- **Password:** `admin123`

## Verificar Usuario en Base de Datos

### 1. Verificar que el usuario existe:

```sql
SELECT email, is_active, role 
FROM admin_users 
WHERE email = 'lore.estetica76@gmail.com';
```

### 2. Si el usuario no existe, crearlo:

```sql
-- Generar hash primero (ejecutar en terminal):
-- node scripts/generate-password-hash.js admin123

-- Luego insertar:
INSERT INTO admin_users (email, password_hash, full_name, role, is_active)
VALUES (
  'lore.estetica76@gmail.com',
  '$2b$10$tu_hash_generado_aqui',
  'Lorena Esquivel',
  'super_admin',
  true
);
```

### 3. Si necesitas cambiar la contraseña:

```sql
-- Generar nuevo hash:
-- node scripts/generate-password-hash.js nueva_password

-- Actualizar:
UPDATE admin_users 
SET password_hash = '$2b$10$nuevo_hash_aqui'
WHERE email = 'lore.estetica76@gmail.com';
```

## Probar el Login

### Opción 1: Script de Prueba

```bash
node scripts/test-login.js
```

### Opción 2: Desde el navegador

1. Ve a `/admin/login`
2. Ingresa:
   - Email: `lore.estetica76@gmail.com`
   - Password: `admin123`

### Opción 3: Con curl (terminal)

```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"lore.estetica76@gmail.com","password":"admin123"}' \
  -v
```

## Verificar Variables de Entorno

Asegúrate de tener configurado en `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
JWT_SECRET=tu_jwt_secret_minimo_32_caracteres_muy_seguro
```

## Verificar Logs

Si el login falla, revisa los logs del servidor. Deberías ver:

```
🔵 Login API called: POST /api/admin/login
📧 Login attempt for: lore.estetica76@gmail.com
🔑 JWT_SECRET exists: true
🔍 Querying database for user...
✅ User found, verifying password...
✅ Password valid, creating session...
✅ Login successful
```

## Problemas Comunes

### Error: "Credenciales inválidas"
- Verificar que el usuario existe en `admin_users`
- Verificar que `is_active = true`
- Verificar que el password_hash es correcto usando `bcrypt.compare`

### Error: "Error al crear sesión"
- Verificar que `JWT_SECRET` está configurado
- Verificar que `JWT_SECRET` tiene al menos 32 caracteres

### No se reciben cookies
- Verificar que no hay errores en la consola del servidor
- Verificar que las cookies se están seteando correctamente en `res.setHeader`

