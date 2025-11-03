-- Script para corregir la contraseña del admin
-- Ejecutar este script en Supabase SQL Editor

-- Actualizar la contraseña del admin (nueva contraseña: admin123)
UPDATE admin_users 
SET password_hash = '$2b$10$LF0DsbDqlgXtQYM.EONkReTiRlU1C6quvmLzWN6b0k4xlPL9Eydm2'
WHERE email = 'lore.estetica76@gmail.com';

-- Verificar que se actualizó correctamente
SELECT email, password_hash, is_active 
FROM admin_users 
WHERE email = 'lore.estetica76@gmail.com';
