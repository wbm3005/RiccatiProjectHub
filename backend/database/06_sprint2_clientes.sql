-- Riccati Project Hub - Sprint 2 / M02
-- Ejecutar UNA vez antes de iniciar el backend actualizado.
-- Preserva los datos de clientes, contactos y proyectos existentes.
CREATE TABLE IF NOT EXISTS clientes_cambios_estado (
  id_cambio BIGSERIAL PRIMARY KEY,
  id_cliente INTEGER NOT NULL REFERENCES clientes(id_cliente),
  id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario),
  estado_anterior VARCHAR(20) NOT NULL,
  estado_nuevo VARCHAR(20) NOT NULL,
  justificacion TEXT,
  cambiado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_cliente_cambios_estado CHECK (
    estado_anterior IN ('ACTIVO','INACTIVO') AND estado_nuevo IN ('ACTIVO','INACTIVO')
  )
);
CREATE INDEX IF NOT EXISTS idx_clientes_cambios_cliente
  ON clientes_cambios_estado (id_cliente, cambiado_en DESC);
