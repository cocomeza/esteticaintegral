-- =====================================================
-- ACTUALIZACIÓN DE HORARIO DE ALMUERZO
-- Cambiar de 13:30-14:30 a 12:45-14:15
-- =====================================================

-- Actualizar todos los horarios activos que tengan el almuerzo anterior
UPDATE work_schedules
SET
  lunch_start = '12:45:00',
  lunch_end = '14:15:00',
  updated_at = NOW()
WHERE
  lunch_start IN ('13:30:00', '13:30', '13:00:00', '13:00')
  AND lunch_end IN ('14:30:00', '14:30', '14:00:00', '14:00')
  AND is_active = true;

-- Mostrar los horarios actualizados
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
  is_active,
  updated_at
FROM work_schedules
ORDER BY day_of_week;

-- Contar cuántos horarios fueron actualizados
SELECT
  COUNT(*) as horarios_actualizados
FROM work_schedules
WHERE
  lunch_start = '12:45:00'
  AND lunch_end = '14:15:00'
  AND is_active = true;

