-- =====================================================
-- RICCATI PROJECT HUB
-- SPRINT 1
-- AJUSTES M03 - PROYECTOS
-- =====================================================


-- =====================================================
-- CAMPOS ADICIONALES
-- =====================================================

ALTER TABLE proyectos
ADD COLUMN IF NOT EXISTS contrato VARCHAR(150);

ALTER TABLE proyectos
ADD COLUMN IF NOT EXISTS observaciones TEXT;


-- =====================================================
-- SECUENCIA PARA PROJECT ID
-- =====================================================

CREATE SEQUENCE IF NOT EXISTS proyecto_codigo_seq
START WITH 1
INCREMENT BY 1;


-- =====================================================
-- VALIDACIÓN DE FECHA DE CIERRE
-- =====================================================

DO $$
BEGIN

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_proyecto_fecha_finalizacion'
    ) THEN

        ALTER TABLE proyectos
        ADD CONSTRAINT chk_proyecto_fecha_finalizacion
        CHECK (
            fecha_finalizacion IS NULL
            OR fecha_inicio IS NULL
            OR fecha_finalizacion >= fecha_inicio
        );

    END IF;

END $$;