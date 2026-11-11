-- =====================================================
-- SPRINT 3 · M06 CONTROL FINANCIERO BÁSICO (captura)
-- HU-M06-01 Registrar monto acordado
-- HU-M06-02 Registrar pagos recibidos (RN-013, RN-014)
-- HU-M06-03 Corregir pagos registrados (RN-015)
-- Migración incremental: ejecutar después de 09. No modifica tablas existentes.
-- Las consultas de saldo, historial y cartera son del Sprint 4 (HU-M06-04 a 06).
-- =====================================================

BEGIN;

-- Referencia financiera del proyecto (HU-M06-01). Un registro por proyecto.
-- Cada proyecto define su moneda (colones o dólares) y sus pagos usan la misma.
CREATE TABLE IF NOT EXISTS finanzas_proyecto (
  id_proyecto INTEGER PRIMARY KEY REFERENCES proyectos(id_proyecto) ON DELETE RESTRICT,
  moneda CHAR(3) NOT NULL,
  monto_acordado NUMERIC(14,2) NOT NULL,
  id_usuario_registra INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
  registrado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_usuario_actualiza INTEGER REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
  actualizado_en TIMESTAMPTZ,
  CONSTRAINT chk_finanzas_moneda CHECK (moneda IN ('CRC', 'USD')),
  CONSTRAINT chk_finanzas_monto CHECK (monto_acordado > 0)
);

-- Historial de cambios del monto acordado: valor anterior, nuevo, autor y motivo.
CREATE TABLE IF NOT EXISTS finanzas_monto_cambios (
  id_cambio BIGSERIAL PRIMARY KEY,
  id_proyecto INTEGER NOT NULL REFERENCES finanzas_proyecto(id_proyecto) ON DELETE RESTRICT,
  moneda_anterior CHAR(3) NOT NULL,
  monto_anterior NUMERIC(14,2) NOT NULL,
  moneda_nueva CHAR(3) NOT NULL,
  monto_nuevo NUMERIC(14,2) NOT NULL,
  justificacion TEXT NOT NULL,
  id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
  cambiado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_monto_cambio_justificacion CHECK (length(btrim(justificacion)) >= 10)
);
CREATE INDEX IF NOT EXISTS idx_monto_cambios_proyecto ON finanzas_monto_cambios (id_proyecto, cambiado_en DESC);

-- Pagos recibidos (HU-M06-02). Nunca se borran: se corrigen o se anulan (RN-015).
CREATE TABLE IF NOT EXISTS pagos_proyecto (
  id_pago BIGSERIAL PRIMARY KEY,
  id_proyecto INTEGER NOT NULL REFERENCES finanzas_proyecto(id_proyecto) ON DELETE RESTRICT,
  fecha_pago DATE NOT NULL,
  monto NUMERIC(14,2) NOT NULL,
  referencia VARCHAR(80),
  observacion TEXT,
  estado VARCHAR(10) NOT NULL DEFAULT 'VIGENTE',
  id_usuario_registra INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
  registrado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMPTZ,
  CONSTRAINT chk_pago_monto CHECK (monto > 0),
  CONSTRAINT chk_pago_estado CHECK (estado IN ('VIGENTE', 'ANULADO')),
  CONSTRAINT chk_pago_observacion CHECK (observacion IS NULL OR length(observacion) <= 1000)
);
CREATE INDEX IF NOT EXISTS idx_pagos_proyecto_fecha ON pagos_proyecto (id_proyecto, fecha_pago DESC, id_pago DESC);

-- Trazabilidad de correcciones y anulaciones (HU-M06-03, RN-015).
CREATE TABLE IF NOT EXISTS pagos_correcciones (
  id_correccion BIGSERIAL PRIMARY KEY,
  id_pago BIGINT NOT NULL REFERENCES pagos_proyecto(id_pago) ON DELETE RESTRICT,
  tipo VARCHAR(10) NOT NULL,
  anterior JSONB NOT NULL,
  nuevo JSONB NOT NULL,
  justificacion TEXT NOT NULL,
  id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
  corregido_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_correccion_tipo CHECK (tipo IN ('CORRECCION', 'ANULACION')),
  CONSTRAINT chk_correccion_justificacion CHECK (length(btrim(justificacion)) >= 10),
  CONSTRAINT chk_correccion_distinta CHECK (anterior <> nuevo)
);
CREATE INDEX IF NOT EXISTS idx_pagos_correcciones_pago ON pagos_correcciones (id_pago, corregido_en DESC);

COMMIT;
