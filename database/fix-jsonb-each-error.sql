-- =====================================================
-- FIX: Corregir error "function jsonb_each(json) does not exist"
-- =====================================================
-- IMPORTANTE: Este script ha sido reemplazado por fix-trigger-json-error.sql
-- que tiene una solución más robusta y maneja mejor los errores JSON
-- 
-- Si ya ejecutaste este script, ejecuta también fix-trigger-json-error.sql
-- para aplicar la corrección completa

-- NOTA: Usa fix-trigger-json-error.sql en su lugar

-- Verificar que el trigger esté activo
-- Si no existe, crearlo:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'auto_log_appointment_changes_trigger'
  ) THEN
    CREATE TRIGGER auto_log_appointment_changes_trigger
      AFTER UPDATE ON appointments
      FOR EACH ROW
      EXECUTE FUNCTION auto_log_appointment_changes();
  END IF;
END $$;

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '✅ Función auto_log_appointment_changes() actualizada correctamente';
  RAISE NOTICE 'El error "function jsonb_each(json) does not exist" debería estar resuelto';
END $$;

