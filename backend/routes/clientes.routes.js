const express = require("express");
const pool = require("../db");
const { autenticarToken, soloAdministrador } = require("../middleware/auth.middleware");

const router = express.Router();
router.use(autenticarToken);

const esId = (id) => /^[1-9]\d*$/.test(String(id));
const normalizar = (valor) => typeof valor === "string" ? valor.trim() : "";
const opcional = (valor) => normalizar(valor) || null;
const correoValido = (valor) => !valor || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
const textoValido = (valor, max) => typeof valor === "string" && valor.trim().length <= max;
const textoOpcionalValido = (valor, max) => valor == null || textoValido(valor, max);
const fallo = (res, codigo, mensaje) => res.status(codigo).json({ mensaje });
const errorDb = (res, error, accion) => {
  if (error.code === "23505") return fallo(res, 409, "Ya existe un cliente con esa identificación.");
  if (error.code === "23503") return fallo(res, 409, "El registro tiene referencias relacionadas no válidas.");
  console.error(`Error en clientes (${accion}):`, error);
  return fallo(res, 500, "No fue posible completar la operación.");
};

function validarCliente(datos) {
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) return "Los datos del cliente son obligatorios.";
  if (typeof datos.nombre_razon_social !== "string" || !datos.nombre_razon_social.trim()) return "El nombre o razón social es obligatorio.";
  if (!textoValido(datos.nombre_razon_social, 160)) return "El nombre no puede superar 160 caracteres.";
  for (const [campo, max] of [["identificacion", 30], ["correo_general", 150], ["telefono_general", 30]]) {
    if (!textoOpcionalValido(datos[campo], max)) return `El campo ${campo} no es válido o es demasiado largo.`;
  }
  if (!correoValido(normalizar(datos.correo_general))) return "El correo general no tiene un formato válido.";
  if (datos.estado !== undefined && !["ACTIVO", "INACTIVO"].includes(datos.estado)) return "El estado indicado no es válido.";
  return null;
}

function validarContacto(datos) {
  if (!datos || typeof datos.nombre !== "string" || !datos.nombre.trim() || !textoValido(datos.nombre, 100)) return "El nombre del contacto es obligatorio (máximo 100 caracteres).";
  if (!textoOpcionalValido(datos.puesto, 100) || !textoOpcionalValido(datos.correo, 150) || !textoOpcionalValido(datos.telefono, 30)) return "Los datos del contacto superan la longitud permitida.";
  if (!correoValido(normalizar(datos.correo))) return "El correo del contacto no tiene un formato válido.";
  if (datos.estado && !["ACTIVO", "INACTIVO"].includes(datos.estado)) return "El estado del contacto no es válido.";
  return null;
}

// Consulta para ambos roles. Devuelve ARRAY para compatibilidad con Dashboard y Proyectos.
router.get("/", async (req, res) => {
  try {
    const q = normalizar(req.query.q).slice(0, 160);
    const estado = normalizar(req.query.estado).toUpperCase();
    if (estado && !["ACTIVO", "INACTIVO"].includes(estado)) return fallo(res, 400, "Filtro de estado no válido.");
    const respuesta = await pool.query(`
      SELECT c.id_cliente, c.nombre_razon_social, c.identificacion,
             c.correo_general, c.telefono_general, c.direccion,
             c.observaciones, c.estado, c.creado_en,
             COUNT(cc.id_contacto)::INTEGER AS cantidad_contactos
        FROM clientes c
        LEFT JOIN contactos_cliente cc ON cc.id_cliente = c.id_cliente
       WHERE ($1 = '' OR c.nombre_razon_social ILIKE '%' || $1 || '%'
                   OR c.identificacion ILIKE '%' || $1 || '%'
                   OR c.correo_general ILIKE '%' || $1 || '%'
                   OR c.telefono_general ILIKE '%' || $1 || '%')
         AND ($2 = '' OR c.estado = $2)
       GROUP BY c.id_cliente
       ORDER BY c.nombre_razon_social, c.id_cliente`, [q, estado]);
    return res.json(respuesta.rows);
  } catch (error) { return errorDb(res, error, "listar"); }
});

// Ficha: trae datos, contactos y proyectos históricos visibles para ese usuario.
router.get("/:id", async (req, res) => {
  if (!esId(req.params.id)) return fallo(res, 400, "Identificador de cliente inválido.");
  try {
    const [clienteR, contactosR, proyectosR] = await Promise.all([
      pool.query("SELECT * FROM clientes WHERE id_cliente = $1", [req.params.id]),
      pool.query(`SELECT id_contacto, id_cliente, nombre, puesto, correo, telefono,
                        es_principal, estado, creado_en FROM contactos_cliente
                   WHERE id_cliente = $1 ORDER BY es_principal DESC, nombre`, [req.params.id]),
      pool.query(`SELECT p.id_proyecto, p.codigo, p.nombre, e.nombre AS estado,
                         pr.nombre AS prioridad, p.fecha_inicio, p.fecha_compromiso,
                         p.fecha_finalizacion
                    FROM proyectos p
                    JOIN estados_proyecto e ON e.id_estado = p.id_estado
                    JOIN prioridades_proyecto pr ON pr.id_prioridad = p.id_prioridad
                   WHERE p.id_cliente = $1
                     AND ($2 = 'Administrador' OR EXISTS (
                       SELECT 1 FROM proyecto_usuarios pu
                        WHERE pu.id_proyecto = p.id_proyecto AND pu.id_usuario = $3 AND pu.activo = TRUE
                     ))
                   ORDER BY p.creado_en DESC, p.id_proyecto DESC`, [req.params.id, req.usuario.rol, req.usuario.idUsuario]),
    ]);
    if (!clienteR.rows.length) return fallo(res, 404, "Cliente no encontrado.");
    return res.json({ cliente: clienteR.rows[0], contactos: contactosR.rows, proyectos: proyectosR.rows });
  } catch (error) { return errorDb(res, error, "ficha"); }
});

router.get("/:id/contactos", async (req, res) => {
  if (!esId(req.params.id)) return fallo(res, 400, "Identificador de cliente inválido.");
  try {
    const respuesta = await pool.query(`SELECT id_contacto, id_cliente, nombre, puesto, correo, telefono,
                                              es_principal, estado, creado_en
                                         FROM contactos_cliente WHERE id_cliente = $1
                                        ORDER BY es_principal DESC, nombre`, [req.params.id]);
    return res.json(respuesta.rows);
  } catch (error) { return errorDb(res, error, "contactos"); }
});

router.post("/", soloAdministrador, async (req, res) => {
  const validacion = validarCliente(req.body);
  if (validacion) return fallo(res, 400, validacion);
  const contacto = req.body.contactoPrincipal;
  if (contacto && Object.values(contacto).some(v => typeof v === "string" && v.trim())) {
    const error = validarContacto(contacto);
    if (error) return fallo(res, 400, error);
  }
  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    const datos = req.body;
    const respuesta = await db.query(`
      INSERT INTO clientes (nombre_razon_social, identificacion, correo_general,
                            telefono_general, direccion, observaciones, estado)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, [
      normalizar(datos.nombre_razon_social), opcional(datos.identificacion),
      opcional(datos.correo_general)?.toLowerCase(), opcional(datos.telefono_general),
      opcional(datos.direccion), opcional(datos.observaciones), datos.estado || "ACTIVO",
    ]);
    const cliente = respuesta.rows[0];
    if (contacto?.nombre?.trim()) {
      await db.query(`INSERT INTO contactos_cliente
          (id_cliente, nombre, puesto, correo, telefono, es_principal)
        VALUES ($1,$2,$3,$4,$5,TRUE)`, [cliente.id_cliente, normalizar(contacto.nombre), opcional(contacto.puesto), opcional(contacto.correo)?.toLowerCase(), opcional(contacto.telefono)]);
    }
    await db.query("COMMIT");
    return res.status(201).json({ mensaje: "Cliente registrado correctamente.", cliente });
  } catch (error) {
    await db.query("ROLLBACK");
    return errorDb(res, error, "crear");
  } finally { db.release(); }
});

// HU-M02-03: editar datos sin eliminar historial ni modificar estado aquí.
router.put("/:id", soloAdministrador, async (req, res) => {
  if (!esId(req.params.id)) return fallo(res, 400, "Identificador de cliente inválido.");
  const errorValidacion = validarCliente(req.body);
  if (errorValidacion) return fallo(res, 400, errorValidacion);
  try {
    const d = req.body;
    const respuesta = await pool.query(`UPDATE clientes SET
      nombre_razon_social=$1, identificacion=$2, correo_general=$3,
      telefono_general=$4, direccion=$5, observaciones=$6,
      actualizado_en=CURRENT_TIMESTAMP WHERE id_cliente=$7 RETURNING *`, [
      normalizar(d.nombre_razon_social), opcional(d.identificacion), opcional(d.correo_general)?.toLowerCase(),
      opcional(d.telefono_general), opcional(d.direccion), opcional(d.observaciones), req.params.id,
    ]);
    if (!respuesta.rows.length) return fallo(res, 404, "Cliente no encontrado.");
    return res.json({ mensaje: "Cliente actualizado correctamente.", cliente: respuesta.rows[0] });
  } catch (error) { return errorDb(res, error, "actualizar"); }
});

// HU-M02-06: inactivar/reactivar y auditar sin borrar datos.
router.put("/:id/estado", soloAdministrador, async (req, res) => {
  if (!esId(req.params.id)) return fallo(res, 400, "Identificador de cliente inválido.");
  const { estado } = req.body || {};
  const justificacion = normalizar(req.body?.justificacion);
  if (!["ACTIVO", "INACTIVO"].includes(estado)) return fallo(res, 400, "Estado no válido.");
  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    const actual = await db.query("SELECT id_cliente, estado FROM clientes WHERE id_cliente=$1 FOR UPDATE", [req.params.id]);
    if (!actual.rows.length) { await db.query("ROLLBACK"); return fallo(res, 404, "Cliente no encontrado."); }
    if (actual.rows[0].estado === estado) { await db.query("ROLLBACK"); return fallo(res, 409, "El cliente ya tiene ese estado."); }
    const activos = await db.query(`SELECT COUNT(*)::INTEGER AS total FROM proyectos p
      JOIN estados_proyecto e ON e.id_estado = p.id_estado
      WHERE p.id_cliente=$1 AND e.nombre NOT IN ('Finalizado','Archivado')`, [req.params.id]);
    const proyectosActivos = activos.rows[0].total;
    if (estado === "INACTIVO" && proyectosActivos > 0 && !justificacion) {
      await db.query("ROLLBACK");
      return fallo(res, 400, "Este cliente tiene proyectos activos: debe indicar una justificación para inactivarlo.");
    }
    await db.query("UPDATE clientes SET estado=$1, actualizado_en=CURRENT_TIMESTAMP WHERE id_cliente=$2", [estado, req.params.id]);
    await db.query(`INSERT INTO clientes_cambios_estado
      (id_cliente, id_usuario, estado_anterior, estado_nuevo, justificacion)
      VALUES ($1,$2,$3,$4,$5)`, [req.params.id, req.usuario.idUsuario, actual.rows[0].estado, estado, justificacion || null]);
    await db.query("COMMIT");
    return res.json({ mensaje: estado === "ACTIVO" ? "Cliente reactivado correctamente." : "Cliente inactivado correctamente.", proyectosActivos });
  } catch (error) {
    await db.query("ROLLBACK");
    return errorDb(res, error, "estado");
  } finally { db.release(); }
});

router.post("/:id/contactos", soloAdministrador, async (req, res) => {
  if (!esId(req.params.id)) return fallo(res, 400, "Identificador de cliente inválido.");
  const errorValidacion = validarContacto(req.body);
  if (errorValidacion) return fallo(res, 400, errorValidacion);
  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    const cliente = await db.query("SELECT id_cliente FROM clientes WHERE id_cliente=$1", [req.params.id]);
    if (!cliente.rows.length) { await db.query("ROLLBACK"); return fallo(res, 404, "Cliente no encontrado."); }
    if (req.body.es_principal === true) {
      await db.query("UPDATE contactos_cliente SET es_principal=FALSE WHERE id_cliente=$1", [req.params.id]);
    }
    const d = req.body;
    const respuesta = await db.query(`INSERT INTO contactos_cliente
      (id_cliente,nombre,puesto,correo,telefono,es_principal,estado)
      VALUES ($1,$2,$3,$4,$5,$6,'ACTIVO') RETURNING *`, [
      req.params.id, normalizar(d.nombre), opcional(d.puesto), opcional(d.correo)?.toLowerCase(), opcional(d.telefono), d.es_principal === true,
    ]);
    await db.query("COMMIT");
    return res.status(201).json({ mensaje: "Contacto registrado correctamente.", contacto: respuesta.rows[0] });
  } catch (error) { await db.query("ROLLBACK"); return errorDb(res, error, "crear contacto"); }
  finally { db.release(); }
});

router.put("/:id/contactos/:contactoId", soloAdministrador, async (req, res) => {
  if (!esId(req.params.id) || !esId(req.params.contactoId)) return fallo(res, 400, "Identificador inválido.");
  const errorValidacion = validarContacto(req.body);
  if (errorValidacion) return fallo(res, 400, errorValidacion);
  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    const anterior = await db.query(`SELECT id_contacto FROM contactos_cliente
      WHERE id_cliente=$1 AND id_contacto=$2 FOR UPDATE`, [req.params.id, req.params.contactoId]);
    if (!anterior.rows.length) { await db.query("ROLLBACK"); return fallo(res, 404, "Contacto no encontrado."); }
    if (req.body.es_principal === true) {
      await db.query("UPDATE contactos_cliente SET es_principal=FALSE WHERE id_cliente=$1", [req.params.id]);
    }
    const d = req.body;
    const respuesta = await db.query(`UPDATE contactos_cliente SET nombre=$1, puesto=$2, correo=$3,
      telefono=$4, es_principal=$5, estado=$6 WHERE id_cliente=$7 AND id_contacto=$8 RETURNING *`, [
      normalizar(d.nombre), opcional(d.puesto), opcional(d.correo)?.toLowerCase(), opcional(d.telefono),
      d.es_principal === true, d.estado || "ACTIVO", req.params.id, req.params.contactoId,
    ]);
    await db.query("COMMIT");
    return res.json({ mensaje: "Contacto actualizado correctamente.", contacto: respuesta.rows[0] });
  } catch (error) { await db.query("ROLLBACK"); return errorDb(res, error, "editar contacto"); }
  finally { db.release(); }
});

module.exports = router;