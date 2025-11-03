-- =====================================================
-- SCRIPT PARA ELIMINAR TODAS LAS TABLAS EXISTENTES
-- Ejecutar ANTES de SCHEMA-COMPLETO-FINAL.sql
-- =====================================================

-- ⚠️ ADVERTENCIA: Este script eliminará TODOS los datos existentes
-- Asegúrate de hacer un backup antes de ejecutar

-- Deshabilitar triggers temporalmente
SET session_replication_role = replica;

-- Eliminar vistas primero (dependen de las tablas)
DROP VIEW IF EXISTS available_times CASCADE;
DROP VIEW IF EXISTS active_services CASCADE;

-- Eliminar funciones que dependen de las tablas
DROP FUNCTION IF EXISTS get_available_slots(UUID, DATE, UUID) CASCADE;
DROP FUNCTION IF EXISTS is_date_closed(UUID, DATE) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_appointment_version() CASCADE;
DROP FUNCTION IF EXISTS auto_log_appointment_changes() CASCADE;

-- Eliminar funciones de las mejoras implementadas
DROP FUNCTION IF EXISTS cleanup_expired_locks() CASCADE;
DROP FUNCTION IF EXISTS is_appointment_locked(UUID, DATE, TIME) CASCADE;
DROP FUNCTION IF EXISTS get_active_locks() CASCADE;
DROP FUNCTION IF EXISTS get_pending_emails(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS mark_email_sent(VARCHAR(50), VARCHAR(255)) CASCADE;
DROP FUNCTION IF EXISTS mark_email_failed(VARCHAR(50), TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_email_queue_stats() CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_emails(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_next_appointment_version(UUID) CASCADE;
DROP FUNCTION IF EXISTS log_appointment_change(UUID, INTEGER, JSONB, VARCHAR(255), TEXT) CASCADE;
DROP FUNCTION IF EXISTS detect_version_conflict(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_concurrency_stats() CASCADE;
DROP FUNCTION IF EXISTS cleanup_resolved_conflicts(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS find_duplicate_appointments() CASCADE;
DROP FUNCTION IF EXISTS find_orphaned_appointments_by_specialist() CASCADE;
DROP FUNCTION IF EXISTS find_orphaned_appointments_by_service() CASCADE;
DROP FUNCTION IF EXISTS find_inconsistent_schedules() CASCADE;
DROP FUNCTION IF EXISTS find_missing_critical_data() CASCADE;
DROP FUNCTION IF EXISTS find_invalid_dates() CASCADE;
DROP FUNCTION IF EXISTS get_data_integrity_summary() CASCADE;
DROP FUNCTION IF EXISTS auto_cleanup_data_integrity() CASCADE;
DROP FUNCTION IF EXISTS get_recent_metrics(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_active_alerts() CASCADE;
DROP FUNCTION IF EXISTS get_system_stats() CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_metrics(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS cleanup_resolved_alerts(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS create_alert_rule(VARCHAR(50), VARCHAR(255), VARCHAR(255), VARCHAR(10), DECIMAL(10,4), VARCHAR(20), INTEGER) CASCADE;
DROP FUNCTION IF EXISTS resolve_alert(VARCHAR(50), VARCHAR(255)) CASCADE;

-- Eliminar tablas en orden inverso (las que tienen foreign keys primero)
-- Tablas de las mejoras implementadas
DROP TABLE IF EXISTS system_alerts CASCADE;
DROP TABLE IF EXISTS alert_rules CASCADE;
DROP TABLE IF EXISTS system_metrics CASCADE;
DROP TABLE IF EXISTS concurrency_conflicts CASCADE;
DROP TABLE IF EXISTS appointment_changes CASCADE;
DROP TABLE IF EXISTS email_queue CASCADE;
DROP TABLE IF EXISTS appointment_locks CASCADE;

-- Tablas principales (en orden de dependencias)
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS closures CASCADE;
DROP TABLE IF EXISTS work_schedules CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS specialists CASCADE;
DROP TABLE IF EXISTS aesthetic_services CASCADE;

-- Eliminar extensiones si no se necesitan
-- DROP EXTENSION IF EXISTS "uuid-ossp"; -- Comentado porque lo necesitamos

-- Restaurar configuración de triggers
SET session_replication_role = DEFAULT;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Todas las tablas han sido eliminadas exitosamente';
    RAISE NOTICE '📋 Ahora puedes ejecutar SCHEMA-COMPLETO-FINAL.sql';
    RAISE NOTICE '⚠️  Recuerda que todos los datos anteriores se han perdido';
END $$;
