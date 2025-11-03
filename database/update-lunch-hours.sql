-- =====================================================
-- ACTUALIZAR HORARIO DE ALMUERZO A 13:30 - 14:30
-- Actualiza todos los horarios regulares existentes
-- =====================================================

-- Actualizar horarios regulares de trabajo
UPDATE work_schedules
SET 
  lunch_start = '13:30:00',
  lunch_end = '14:30:00',
  updated_at = NOW()
WHERE 
  lunch_start = '13:00:00' 
  AND lunch_end = '14:00:00'
  AND is_active = true;

-- Mostrar resultado
SELECT 
  day_of_week,
  CASE day_of_week
    WHEN 0 THEN 'Domingo'
    WHEN 1 THEN 'Lunes'
    WHEN 2 THEN 'Martes'
    WHEN 3 THEN 'Miércoles'
    WHEN 4 THEN 'Jueves'
    WHEN 5 THEN 'Viernes'
    WHEN 6 THEN 'Sábado'
  END as dia,
  start_time,
  end_time,
  lunch_start,
  lunch_end,
  is_active
FROM work_schedules
ORDER BY day_of_week;

-- Verificar cuántos horarios se actualizaron
SELECT 
  COUNT(*) as horarios_actualizados
FROM work_schedules
WHERE 
  lunch_start = '13:30:00' 
  AND lunch_end = '14:30:00'
  AND is_active = true;

