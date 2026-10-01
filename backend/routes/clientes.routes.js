const express = require("express");

const pool = require("../db");

const {
  autenticarToken,
} = require("../middleware/auth.middleware");

const router = express.Router();


// =====================================================
// TODAS LAS RUTAS REQUIEREN SESIÓN
// =====================================================

router.use(autenticarToken);


// =====================================================
// GET /api/clientes
// LISTAR CLIENTES
// HU-M02-02
// =====================================================

router.get("/", async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        c.id_cliente,
        c.nombre_razon_social,
        c.identificacion,
        c.correo_general,
        c.telefono_general,
        c.direccion,
        c.observaciones,
        c.estado,
        c.creado_en,

        COUNT(
          cc.id_contacto
        )::INTEGER AS cantidad_contactos

      FROM clientes c

      LEFT JOIN contactos_cliente cc
        ON c.id_cliente = cc.id_cliente

      GROUP BY
        c.id_cliente

      ORDER BY
        c.nombre_razon_social
    `);

    return res.json(
      resultado.rows
    );

  } catch (error) {
    console.error(
      "Error al obtener clientes:",
      error
    );

    return res.status(500).json({
      mensaje:
        "No fue posible obtener los clientes.",
    });
  }
});


// =====================================================
// GET /api/clientes/:id
// FICHA COMPLETA DEL CLIENTE
// HU-M02-02
// =====================================================

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const clienteResultado =
      await pool.query(
        `
        SELECT
          id_cliente,
          nombre_razon_social,
          identificacion,
          correo_general,
          telefono_general,
          direccion,
          observaciones,
          estado,
          creado_en,
          actualizado_en

        FROM clientes

        WHERE id_cliente = $1
        `,
        [id]
      );

    if (
      clienteResultado.rows.length === 0
    ) {
      return res.status(404).json({
        mensaje:
          "Cliente no encontrado.",
      });
    }

    const contactosResultado =
      await pool.query(
        `
        SELECT
          id_contacto,
          nombre,
          puesto,
          correo,
          telefono,
          es_principal,
          estado,
          creado_en

        FROM contactos_cliente

        WHERE id_cliente = $1

        ORDER BY
          es_principal DESC,
          nombre
        `,
        [id]
      );

    return res.json({
      cliente:
        clienteResultado.rows[0],

      contactos:
        contactosResultado.rows,
    });

  } catch (error) {
    console.error(
      "Error al obtener ficha:",
      error
    );

    return res.status(500).json({
      mensaje:
        "No fue posible obtener la ficha del cliente.",
    });
  }
});


// =====================================================
// POST /api/clientes
// CREAR CLIENTE
// HU-M02-01
// =====================================================

router.post("/", async (req, res) => {
  const conexion =
    await pool.connect();

  try {
    const {
      nombre_razon_social,
      identificacion,
      correo_general,
      telefono_general,
      direccion,
      observaciones,
      estado = "ACTIVO",

      contactoPrincipal,
    } = req.body;


    // ===============================================
    // VALIDACIÓN
    // ===============================================

    if (!nombre_razon_social) {
      return res.status(400).json({
        mensaje:
          "El nombre o razón social es obligatorio.",
      });
    }

    const estadosPermitidos = [
      "ACTIVO",
      "INACTIVO",
    ];

    if (
      !estadosPermitidos.includes(
        estado
      )
    ) {
      return res.status(400).json({
        mensaje:
          "El estado del cliente no es válido.",
      });
    }


    // ===============================================
    // VALIDAR IDENTIFICACIÓN
    // ===============================================

    if (identificacion) {
      const existe =
        await pool.query(
          `
          SELECT id_cliente
          FROM clientes
          WHERE identificacion = $1
          `,
          [identificacion]
        );

      if (existe.rows.length > 0) {
        return res.status(409).json({
          mensaje:
            "Ya existe un cliente con esa identificación.",
        });
      }
    }


    // ===============================================
    // TRANSACCIÓN
    // ===============================================

    await conexion.query(
      "BEGIN"
    );


    // ===============================================
    // CREAR CLIENTE
    // ===============================================

    const clienteResultado =
      await conexion.query(
        `
        INSERT INTO clientes (
          nombre_razon_social,
          identificacion,
          correo_general,
          telefono_general,
          direccion,
          observaciones,
          estado
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7
        )

        RETURNING
          id_cliente,
          nombre_razon_social,
          identificacion,
          correo_general,
          telefono_general,
          direccion,
          observaciones,
          estado,
          creado_en
        `,
        [
          nombre_razon_social.trim(),
          identificacion
            ? identificacion.trim()
            : null,
          correo_general
            ? correo_general.trim().toLowerCase()
            : null,
          telefono_general
            ? telefono_general.trim()
            : null,
          direccion
            ? direccion.trim()
            : null,
          observaciones
            ? observaciones.trim()
            : null,
          estado,
        ]
      );

    const cliente =
      clienteResultado.rows[0];


    // ===============================================
    // CONTACTO PRINCIPAL OPCIONAL
    // ===============================================

    let contacto = null;

    if (
      contactoPrincipal &&
      contactoPrincipal.nombre
    ) {
      const contactoResultado =
        await conexion.query(
          `
          INSERT INTO contactos_cliente (
            id_cliente,
            nombre,
            puesto,
            correo,
            telefono,
            es_principal,
            estado
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            TRUE,
            'ACTIVO'
          )

          RETURNING *
          `,
          [
            cliente.id_cliente,
            contactoPrincipal.nombre.trim(),
            contactoPrincipal.puesto
              ? contactoPrincipal.puesto.trim()
              : null,
            contactoPrincipal.correo
              ? contactoPrincipal.correo
                  .trim()
                  .toLowerCase()
              : null,
            contactoPrincipal.telefono
              ? contactoPrincipal.telefono.trim()
              : null,
          ]
        );

      contacto =
        contactoResultado.rows[0];
    }


    await conexion.query(
      "COMMIT"
    );


    return res.status(201).json({
      mensaje:
        "Cliente registrado correctamente.",

      cliente,

      contactoPrincipal:
        contacto,
    });

  } catch (error) {
    await conexion.query(
      "ROLLBACK"
    );

    console.error(
      "Error al crear cliente:",
      error
    );

    return res.status(500).json({
      mensaje:
        "Error interno al registrar el cliente.",
    });

  } finally {
    conexion.release();
  }
});


// =====================================================
// POST /api/clientes/:id/contactos
// AGREGAR CONTACTO
// HU-M02-01
// =====================================================

router.post(
  "/:id/contactos",
  async (req, res) => {
    try {
      const { id } = req.params;

      const {
        nombre,
        puesto,
        correo,
        telefono,
        es_principal = false,
      } = req.body;


      if (!nombre) {
        return res.status(400).json({
          mensaje:
            "El nombre del contacto es obligatorio.",
        });
      }


      // =============================================
      // VALIDAR CLIENTE
      // =============================================

      const cliente =
        await pool.query(
          `
          SELECT id_cliente
          FROM clientes
          WHERE id_cliente = $1
          `,
          [id]
        );

      if (
        cliente.rows.length === 0
      ) {
        return res.status(404).json({
          mensaje:
            "Cliente no encontrado.",
        });
      }


      // =============================================
      // SI SERÁ PRINCIPAL,
      // QUITAR PRINCIPAL ANTERIOR
      // =============================================

      if (es_principal) {
        await pool.query(
          `
          UPDATE contactos_cliente

          SET es_principal = FALSE

          WHERE id_cliente = $1
          `,
          [id]
        );
      }


      // =============================================
      // CREAR CONTACTO
      // =============================================

      const resultado =
        await pool.query(
          `
          INSERT INTO contactos_cliente (
            id_cliente,
            nombre,
            puesto,
            correo,
            telefono,
            es_principal,
            estado
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            'ACTIVO'
          )

          RETURNING *
          `,
          [
            id,
            nombre.trim(),
            puesto
              ? puesto.trim()
              : null,
            correo
              ? correo
                  .trim()
                  .toLowerCase()
              : null,
            telefono
              ? telefono.trim()
              : null,
            es_principal,
          ]
        );


      return res.status(201).json({
        mensaje:
          "Contacto registrado correctamente.",

        contacto:
          resultado.rows[0],
      });

    } catch (error) {
      console.error(
        "Error al crear contacto:",
        error
      );

      return res.status(500).json({
        mensaje:
          "Error interno al registrar el contacto.",
      });
    }
  }
);


module.exports = router;