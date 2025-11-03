-- ACTUALIZAR HORARIO DE LUNES A VIERNES: 18:00 a 18:45
-- Este script extiende el horario de atencion de lunes a viernes hasta las 18:45
-- para permitir un turno adicional disponible.
-- IMPORTANTE: Ejecutar este script en el SQL Editor de Supabase

-- Actualizar horarios de lunes (1) a viernes (5)
UPDATE work_schedules 
SET 
  end_time = '18:45'::time,
  updated_at = NOW()
WHERE 
  specialist_id = (SELECT id FROM specialists WHERE name = 'Lorena Esquivel')
  AND day_of_week IN (1, 2, 3, 4, 5)
  AND end_time = '18:00'::time;

-- Verificar que la actualizacion se realizo correctamente
SELECT 
  CASE day_of_week
    WHEN 0 THEN 'Domingo'
    WHEN 1 THEN 'Lunes'
    WHEN 2 THEN 'Martes'
    WHEN 3 THEN 'Miercoles'
    WHEN 4 THEN 'Jueves'
    WHEN 5 THEN 'Viernes'
    WHEN 6 THEN 'Sabado'
  END as dia,
  start_time as inicio,
  end_time as fin,
  lunch_start as almuerzo_inicio,
  lunch_end as almuerzo_fin,
  CASE 
    WHEN allowed_services IS NULL THEN 'Todos los servicios'
    ELSE 'Servicios restringidos'
  END as servicios
FROM work_schedules
WHERE specialist_id = (SELECT id FROM specialists WHERE name = 'Lorena Esquivel')
  AND day_of_week IN (1, 2, 3, 4, 5)
ORDER BY day_of_week;
