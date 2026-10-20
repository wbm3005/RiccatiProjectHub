-- =====================================================
-- RICCATI PROJECT HUB
-- SPRINT 1
-- M02 - CLIENTES Y CONTACTOS
-- =====================================================


-- =========================
-- TABLA CLIENTES
-- =========================

CREATE TABLE IF NOT EXISTS clientes (
    id_cliente SERIAL PRIMARY KEY,

    nombre_razon_social VARCHAR(160) NOT NULL,

    identificacion VARCHAR(30) UNIQUE,

    correo_general VARCHAR(150),

    telefono_general VARCHAR(30),

    direccion TEXT,

    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',

    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_cliente_estado
        CHECK (
            estado IN (
                'ACTIVO',
                'INACTIVO'
            )
        )
);


-- =========================
-- TABLA CONTACTOS CLIENTE
-- =========================

CREATE TABLE IF NOT EXISTS contactos_cliente (
    id_contacto SERIAL PRIMARY KEY,

    id_cliente INTEGER NOT NULL,

    nombre VARCHAR(100) NOT NULL,

    puesto VARCHAR(100),

    correo VARCHAR(150),

    telefono VARCHAR(30),

    es_principal BOOLEAN NOT NULL DEFAULT FALSE,

    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',

    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_contacto_cliente
        FOREIGN KEY (id_cliente)
        REFERENCES clientes(id_cliente),

    CONSTRAINT chk_contacto_estado
        CHECK (
            estado IN (
                'ACTIVO',
                'INACTIVO'
            )
        )
);