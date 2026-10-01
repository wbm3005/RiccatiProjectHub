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
// CATÁLOGO DE PRIORIDADES
// GET /api/proyectos/catalogos/prioridades
// =====================================================

router.get(
  "/catalogos/prioridades",
  async (req, res) => {
    try {
      const resultado =
        await pool.query(`
          SELECT
            id_prioridad,
            nombre,
            descripcion

          FROM prioridades_proyecto

          WHERE activo = TRUE

          ORDER BY id_prioridad
        `);

      return res.json(
        resultado.rows
      );

    } catch (error) {
      console.error(
        "Error al obtener prioridades:",
        error
      );

      return res.status(500).json({
        mensaje:
          "No fue posible obtener las prioridades.",
      });
    }
  }
);


// =====================================================
// CATÁLOGO DE ESTADOS
// GET /api/proyectos/catalogos/estados
// =====================================================

router.get(
  "/catalogos/estados",
  async (req, res) => {
    try {
      const resultado =
        await pool.query(`
          SELECT
            id_estado,
            nombre,
            descripcion

          FROM estados_proyecto

          WHERE activo = TRUE

          ORDER BY id_estado
        `);

      return res.json(
        resultado.rows
      );

    } catch (error) {
      console.error(
        "Error al obtener estados:",
        error
      );

      return res.status(500).json({
        mensaje:
          "No fue posible obtener los estados.",
      });
    }
  }
);


// =====================================================
// LISTAR PROYECTOS
// GET /api/proyectos
// =====================================================

router.get("/", async (req, res) => {
  try {
    const resultado =
      await pool.query(`
        SELECT
          p.id_proyecto,
          p.codigo,
          p.nombre,
          p.descripcion,
          p.contrato,
          p.observaciones,

          p.fecha_inicio,
          p.fecha_compromiso,
          p.fecha_finalizacion,

          c.id_cliente,
          c.nombre_razon_social AS cliente,

          pp.id_prioridad,
          pp.nombre AS prioridad,

          ep.id_estado,
          ep.nombre AS estado,

          u.id_usuario AS id_responsable,

          CONCAT(
            u.nombre,
            ' ',
            u.apellidos
          ) AS responsable

        FROM proyectos p

        INNER JOIN clientes c
          ON p.id_cliente =
             c.id_cliente

        INNER JOIN prioridades_proyecto pp
          ON p.id_prioridad =
             pp.id_prioridad

        INNER JOIN estados_proyecto ep
          ON p.id_estado =
             ep.id_estado

        LEFT JOIN proyecto_usuarios pu
          ON p.id_proyecto =
             pu.id_proyecto
          AND pu.es_responsable_principal = TRUE
          AND pu.activo = TRUE

        LEFT JOIN usuarios u
          ON pu.id_usuario =
             u.id_usuario

        ORDER BY
          p.id_proyecto DESC
      `);

    return res.json(
      resultado.rows
    );

  } catch (error) {
    console.error(
      "Error al obtener proyectos:",
      error
    );

    return res.status(500).json({
      mensaje:
        "No fue posible obtener los proyectos.",
    });
  }
});


// =====================================================
// OBTENER PROYECTO
// GET /api/proyectos/:id
// =====================================================

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const proyectoResultado =
      await pool.query(
        `
        SELECT
          p.id_proyecto,
          p.codigo,
          p.nombre,
          p.descripcion,
          p.contrato,
          p.observaciones,

          p.id_cliente,
          p.id_contacto_principal,

          p.id_prioridad,
          pp.nombre AS prioridad,

          p.id_estado,
          ep.nombre AS estado,

          p.fecha_inicio,
          p.fecha_compromiso,
          p.fecha_finalizacion,

          c.nombre_razon_social AS cliente,

          cc.nombre AS contacto_principal,

          p.creado_en,
          p.actualizado_en

        FROM proyectos p

        INNER JOIN clientes c
          ON p.id_cliente =
             c.id_cliente

        INNER JOIN prioridades_proyecto pp
          ON p.id_prioridad =
             pp.id_prioridad

        INNER JOIN estados_proyecto ep
          ON p.id_estado =
             ep.id_estado

        LEFT JOIN contactos_cliente cc
          ON p.id_contacto_principal =
             cc.id_contacto

        WHERE p.id_proyecto = $1
        `,
        [id]
      );


    if (
      proyectoResultado.rows.length === 0
    ) {
      return res.status(404).json({
        mensaje:
          "Proyecto no encontrado.",
      });
    }


    const responsablesResultado =
      await pool.query(
        `
        SELECT
          u.id_usuario,
          u.nombre,
          u.apellidos,
          u.correo,
          pu.es_responsable_principal

        FROM proyecto_usuarios pu

        INNER JOIN usuarios u
          ON pu.id_usuario =
             u.id_usuario

        WHERE
          pu.id_proyecto = $1
          AND pu.activo = TRUE

        ORDER BY
          pu.es_responsable_principal DESC,
          u.nombre
        `,
        [id]
      );


    return res.json({
      proyecto:
        proyectoResultado.rows[0],

      responsables:
        responsablesResultado.rows,
    });

  } catch (error) {
    console.error(
      "Error al obtener proyecto:",
      error
    );

    return res.status(500).json({
      mensaje:
        "No fue posible obtener el proyecto.",
    });
  }
});


// =====================================================
// CREAR PROYECTO
// POST /api/proyectos
// HU-M03-01
// =====================================================

router.post("/", async (req, res) => {
  const conexion =
    await pool.connect();

  try {
    const {
      nombre,
      descripcion,
      contrato,
      observaciones,

      id_cliente,
      id_contacto_principal,

      id_prioridad,

      fecha_inicio,
      fecha_compromiso,
      fecha_finalizacion,

      id_responsable,
    } = req.body;


    // =================================================
    // VALIDACIONES BÁSICAS
    // =================================================

    if (!nombre) {
      return res.status(400).json({
        mensaje:
          "El nombre del proyecto es obligatorio.",
      });
    }

    if (!id_cliente) {
      return res.status(400).json({
        mensaje:
          "Debe seleccionar un cliente.",
      });
    }

    if (!id_prioridad) {
      return res.status(400).json({
        mensaje:
          "Debe seleccionar una prioridad.",
      });
    }


    // =================================================
    // VALIDACIÓN DE FECHAS
    // =================================================

    if (
      fecha_inicio &&
      fecha_compromiso &&
      new Date(fecha_compromiso) <
        new Date(fecha_inicio)
    ) {
      return res.status(400).json({
        mensaje:
          "La fecha de compromiso no puede ser anterior a la fecha de inicio.",
      });
    }


    if (
      fecha_inicio &&
      fecha_finalizacion &&
      new Date(fecha_finalizacion) <
        new Date(fecha_inicio)
    ) {
      return res.status(400).json({
        mensaje:
          "La fecha de cierre no puede ser anterior a la fecha de inicio.",
      });
    }


    // =================================================
    // VALIDAR CLIENTE
    // =================================================

    const clienteResultado =
      await conexion.query(
        `
        SELECT id_cliente

        FROM clientes

        WHERE
          id_cliente = $1
          AND estado = 'ACTIVO'
        `,
        [id_cliente]
      );


    if (
      clienteResultado.rows.length === 0
    ) {
      return res.status(400).json({
        mensaje:
          "El cliente seleccionado no existe o se encuentra inactivo.",
      });
    }


    // =================================================
    // VALIDAR CONTACTO
    // =================================================

    if (id_contacto_principal) {
      const contactoResultado =
        await conexion.query(
          `
          SELECT id_contacto

          FROM contactos_cliente

          WHERE
            id_contacto = $1
            AND id_cliente = $2
            AND estado = 'ACTIVO'
          `,
          [
            id_contacto_principal,
            id_cliente,
          ]
        );


      if (
        contactoResultado.rows.length === 0
      ) {
        return res.status(400).json({
          mensaje:
            "El contacto seleccionado no pertenece al cliente.",
        });
      }
    }


    // =================================================
    // VALIDAR PRIORIDAD
    // =================================================

    const prioridadResultado =
      await conexion.query(
        `
        SELECT id_prioridad

        FROM prioridades_proyecto

        WHERE
          id_prioridad = $1
          AND activo = TRUE
        `,
        [id_prioridad]
      );


    if (
      prioridadResultado.rows.length === 0
    ) {
      return res.status(400).json({
        mensaje:
          "La prioridad seleccionada no es válida.",
      });
    }


    // =================================================
    // ESTADO INICIAL = REGISTRADO
    // =================================================

    const estadoResultado =
      await conexion.query(`
        SELECT id_estado

        FROM estados_proyecto

        WHERE nombre = 'Registrado'

        LIMIT 1
      `);


    if (
      estadoResultado.rows.length === 0
    ) {
      return res.status(500).json({
        mensaje:
          "No se encontró el estado inicial del proyecto.",
      });
    }


    const idEstado =
      estadoResultado.rows[0].id_estado;


    // =================================================
    // TRANSACCIÓN
    // =================================================

    await conexion.query("BEGIN");


    // =================================================
    // PROJECT ID AUTOMÁTICO
    // =================================================

    const codigoResultado =
      await conexion.query(`
        SELECT
          'PRJ-' ||
          LPAD(
            nextval(
              'proyecto_codigo_seq'
            )::TEXT,
            4,
            '0'
          ) AS codigo
      `);


    const codigo =
      codigoResultado.rows[0].codigo;


    // =================================================
    // CREAR PROYECTO
    // =================================================

    const resultado =
      await conexion.query(
        `
        INSERT INTO proyectos (
          codigo,
          nombre,
          id_cliente,
          id_contacto_principal,
          id_prioridad,
          id_estado,
          descripcion,
          contrato,
          observaciones,
          fecha_inicio,
          fecha_compromiso,
          fecha_finalizacion,
          creado_por
        )

        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          $13
        )

        RETURNING *
        `,
        [
          codigo,
          nombre.trim(),
          id_cliente,
          id_contacto_principal || null,
          id_prioridad,
          idEstado,

          descripcion
            ? descripcion.trim()
            : null,

          contrato
            ? contrato.trim()
            : null,

          observaciones
            ? observaciones.trim()
            : null,

          fecha_inicio || null,
          fecha_compromiso || null,
          fecha_finalizacion || null,

          req.usuario.idUsuario,
        ]
      );


    const proyecto =
      resultado.rows[0];


    // =================================================
    // RESPONSABLE OPCIONAL
    // =================================================

    if (id_responsable) {
      const usuarioResultado =
        await conexion.query(
          `
          SELECT id_usuario

          FROM usuarios

          WHERE
            id_usuario = $1
            AND estado = 'ACTIVO'
          `,
          [id_responsable]
        );


      if (
        usuarioResultado.rows.length === 0
      ) {
        throw new Error(
          "RESPONSABLE_INVALIDO"
        );
      }


      await conexion.query(
        `
        INSERT INTO proyecto_usuarios (
          id_proyecto,
          id_usuario,
          es_responsable_principal,
          activo
        )

        VALUES (
          $1,
          $2,
          TRUE,
          TRUE
        )
        `,
        [
          proyecto.id_proyecto,
          id_responsable,
        ]
      );
    }


    await conexion.query("COMMIT");


    return res.status(201).json({
      mensaje:
        "Proyecto registrado correctamente.",

      proyecto,
    });

  } catch (error) {
    await conexion.query(
      "ROLLBACK"
    );


    if (
      error.message ===
      "RESPONSABLE_INVALIDO"
    ) {
      return res.status(400).json({
        mensaje:
          "El responsable seleccionado no es válido.",
      });
    }


    console.error(
      "Error al crear proyecto:",
      error
    );


    return res.status(500).json({
      mensaje:
        "Error interno al registrar el proyecto.",
    });

  } finally {
    conexion.release();
  }
});


// =====================================================
// ACTUALIZAR PROYECTO
// PUT /api/proyectos/:id
// HU-M03-02 + HU-M03-04
// =====================================================

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      nombre,
      descripcion,
      contrato,
      observaciones,

      id_cliente,
      id_contacto_principal,

      id_prioridad,

      fecha_inicio,
      fecha_compromiso,
      fecha_finalizacion,
    } = req.body;


    if (
      !nombre ||
      !id_cliente ||
      !id_prioridad
    ) {
      return res.status(400).json({
        mensaje:
          "Nombre, cliente y prioridad son obligatorios.",
      });
    }


    if (
      fecha_inicio &&
      fecha_compromiso &&
      new Date(fecha_compromiso) <
        new Date(fecha_inicio)
    ) {
      return res.status(400).json({
        mensaje:
          "La fecha de compromiso no puede ser anterior a la fecha de inicio.",
      });
    }


    if (
      fecha_inicio &&
      fecha_finalizacion &&
      new Date(fecha_finalizacion) <
        new Date(fecha_inicio)
    ) {
      return res.status(400).json({
        mensaje:
          "La fecha de cierre no puede ser anterior a la fecha de inicio.",
      });
    }


    const resultado =
      await pool.query(
        `
        UPDATE proyectos

        SET
          nombre = $1,
          id_cliente = $2,
          id_contacto_principal = $3,
          id_prioridad = $4,
          descripcion = $5,
          contrato = $6,
          observaciones = $7,
          fecha_inicio = $8,
          fecha_compromiso = $9,
          fecha_finalizacion = $10,
          actualizado_en =
            CURRENT_TIMESTAMP

        WHERE id_proyecto = $11

        RETURNING *
        `,
        [
          nombre.trim(),
          id_cliente,
          id_contacto_principal || null,
          id_prioridad,

          descripcion
            ? descripcion.trim()
            : null,

          contrato
            ? contrato.trim()
            : null,

          observaciones
            ? observaciones.trim()
            : null,

          fecha_inicio || null,
          fecha_compromiso || null,
          fecha_finalizacion || null,

          id,
        ]
      );


    if (
      resultado.rows.length === 0
    ) {
      return res.status(404).json({
        mensaje:
          "Proyecto no encontrado.",
      });
    }


    return res.json({
      mensaje:
        "Proyecto actualizado correctamente.",

      proyecto:
        resultado.rows[0],
    });

  } catch (error) {
    console.error(
      "Error al actualizar proyecto:",
      error
    );

    return res.status(500).json({
      mensaje:
        "No fue posible actualizar el proyecto.",
    });
  }
});


// =====================================================
// ASIGNAR / CAMBIAR RESPONSABLE
// PUT /api/proyectos/:id/responsable
// HU-M03-03
// =====================================================

router.put(
  "/:id/responsable",
  async (req, res) => {
    const conexion =
      await pool.connect();

    try {
      const { id } = req.params;

      const {
        idUsuario,
      } = req.body;


      if (!idUsuario) {
        return res.status(400).json({
          mensaje:
            "Debe seleccionar un responsable.",
        });
      }


      const proyectoResultado =
        await conexion.query(
          `
          SELECT id_proyecto

          FROM proyectos

          WHERE id_proyecto = $1
          `,
          [id]
        );


      if (
        proyectoResultado.rows.length === 0
      ) {
        return res.status(404).json({
          mensaje:
            "Proyecto no encontrado.",
        });
      }


      const usuarioResultado =
        await conexion.query(
          `
          SELECT id_usuario

          FROM usuarios

          WHERE
            id_usuario = $1
            AND estado = 'ACTIVO'
          `,
          [idUsuario]
        );


      if (
        usuarioResultado.rows.length === 0
      ) {
        return res.status(400).json({
          mensaje:
            "El usuario seleccionado no es válido.",
        });
      }


      await conexion.query("BEGIN");


      // DESACTIVAR RESPONSABLE ACTUAL

      await conexion.query(
        `
        UPDATE proyecto_usuarios

        SET
          es_responsable_principal = FALSE,
          activo = FALSE

        WHERE
          id_proyecto = $1
          AND es_responsable_principal = TRUE
        `,
        [id]
      );


      // SI YA ESTABA ASIGNADO, REACTIVAR

      const existente =
        await conexion.query(
          `
          SELECT
            id_proyecto,
            id_usuario

          FROM proyecto_usuarios

          WHERE
            id_proyecto = $1
            AND id_usuario = $2
          `,
          [
            id,
            idUsuario,
          ]
        );


      if (
        existente.rows.length > 0
      ) {
        await conexion.query(
          `
          UPDATE proyecto_usuarios

          SET
            es_responsable_principal = TRUE,
            activo = TRUE,
            fecha_asignacion =
              CURRENT_TIMESTAMP

          WHERE
            id_proyecto = $1
            AND id_usuario = $2
          `,
          [
            id,
            idUsuario,
          ]
        );

      } else {

        await conexion.query(
          `
          INSERT INTO proyecto_usuarios (
            id_proyecto,
            id_usuario,
            es_responsable_principal,
            activo
          )

          VALUES (
            $1,
            $2,
            TRUE,
            TRUE
          )
          `,
          [
            id,
            idUsuario,
          ]
        );
      }


      await conexion.query("COMMIT");


      return res.json({
        mensaje:
          "Responsable actualizado correctamente.",
      });

    } catch (error) {
      await conexion.query(
        "ROLLBACK"
      );

      console.error(
        "Error al asignar responsable:",
        error
      );

      return res.status(500).json({
        mensaje:
          "No fue posible actualizar el responsable.",
      });

    } finally {
      conexion.release();
    }
  }
);


// =====================================================
// CAMBIAR ESTADO
// PUT /api/proyectos/:id/estado
// HU-M03-05
// =====================================================

router.put(
  "/:id/estado",
  async (req, res) => {
    try {
      const { id } = req.params;

      const {
        idEstado,
      } = req.body;


      if (!idEstado) {
        return res.status(400).json({
          mensaje:
            "Debe seleccionar un estado.",
        });
      }


      const estadoResultado =
        await pool.query(
          `
          SELECT
            id_estado,
            nombre

          FROM estados_proyecto

          WHERE
            id_estado = $1
            AND activo = TRUE
          `,
          [idEstado]
        );


      if (
        estadoResultado.rows.length === 0
      ) {
        return res.status(400).json({
          mensaje:
            "El estado seleccionado no es válido.",
        });
      }


      const estado =
        estadoResultado.rows[0];


      const resultado =
        await pool.query(
          `
          UPDATE proyectos

          SET
            id_estado = $1,

            fecha_finalizacion =
              CASE
                WHEN $2 = 'Finalizado'
                AND fecha_finalizacion IS NULL
                THEN CURRENT_DATE

                ELSE fecha_finalizacion
              END,

            actualizado_en =
              CURRENT_TIMESTAMP

          WHERE id_proyecto = $3

          RETURNING *
          `,
          [
            idEstado,
            estado.nombre,
            id,
          ]
        );


      if (
        resultado.rows.length === 0
      ) {
        return res.status(404).json({
          mensaje:
            "Proyecto no encontrado.",
        });
      }


      return res.json({
        mensaje:
          "Estado del proyecto actualizado correctamente.",

        proyecto:
          resultado.rows[0],
      });

    } catch (error) {
      console.error(
        "Error al cambiar estado:",
        error
      );

      return res.status(500).json({
        mensaje:
          "No fue posible cambiar el estado del proyecto.",
      });
    }
  }
);


module.exports = router;

// =====================================================
// CATÁLOGO DE RESPONSABLES
// GET /api/proyectos/catalogos/responsables
// =====================================================

router.get(
  "/catalogos/responsables",
  async (req, res) => {
    try {
      const resultado =
        await pool.query(`
          SELECT
            u.id_usuario,
            u.nombre,
            u.apellidos,
            u.correo,
            r.nombre AS rol

          FROM usuarios u

          INNER JOIN roles r
            ON u.id_rol = r.id_rol

          WHERE
            u.estado = 'ACTIVO'
            AND r.activo = TRUE

          ORDER BY
            u.nombre,
            u.apellidos
        `);

      return res.json(
        resultado.rows
      );

    } catch (error) {
      console.error(
        "Error al obtener responsables:",
        error
      );

      return res.status(500).json({
        mensaje:
          "No fue posible obtener los responsables.",
      });
    }
  }
);