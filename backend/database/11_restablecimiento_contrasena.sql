-- =====================================================
-- MEJORA M01 · RESTABLECIMIENTO ASISTIDO DE CONTRASEÑA
-- El administrador genera una contraseña temporal; el usuario debe
-- reemplazarla por una propia en su siguiente inicio de sesión.
-- Migración incremental: ejecutar después de 10. No modifica datos existentes.
-- =====================================================

BEGIN;

-- TRUE mientras el usuario tenga una contraseña temporal pendiente de cambiar.
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS debe_cambiar_password BOOLEAN NOT NULL DEFAULT FALSE;

-- Registro de quién restableció la contraseña de quién y cuándo.
-- Nunca se guarda la contraseña temporal, ni siquiera cifrada.
CREATE TABLE IF NOT EXISTS usuarios_restablecimientos (
  id_restablecimiento BIGSERIAL PRIMARY KEY,
  id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
  id_administrador INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
  restablecido_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_restablecimientos_usuario
  ON usuarios_restablecimientos (id_usuario, restablecido_en DESC);

COMMIT;
