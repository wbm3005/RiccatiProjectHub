"use strict";
const express = require("express");
const pool = require("../db");
const { autenticarToken } = require("../middleware/auth.middleware");

const router = express.Router();
router.use(autenticarToken);

const idValido = (v) => /^\d+$/.test(String(v)) && Number.isSafeInteger(Number(v)) && Number(v) > 0;
const texto = (v) => typeof v === "string" ? v.trim() : "";
const administrador = (req) => req.usuario.rol === "Administrador";
const errorHTTP = (res, estado, mensaje) => res.status(estado).json({ mensaje });

// RN-008: horas son opcionales, si se indican deben ser >0 y <=24, con máximo 2 decimales.
function analizarHoras(valor) {
  if (valor === null || valor === undefined || valor === "") return { horas: null };
  const cadena = String(valor).trim();
  if (!/^\d{1,2}(?:\.\d{1,2})?$/.test(cadena) || Number(cadena) <= 0 || Number(cadena) > 24) {
    return { error: "Las horas deben ser mayores que 0 y como máximo 24 (hasta dos decimales)." };
  }
  return { horas: Number(cadena) };
}

function validarActividad(body) {
  const titulo = texto(body?.titulo);
  const contenido = texto(body?.contenido);
  const esfuerzo = texto(body?.descripcion_esfuerzo);
  const { horas, error } = analizarHoras(body?.horas);
  if (error) return { error };
  if (titulo.length < 3 || titulo.length > 180) return { error: "El título debe tener entre 3 y 180 caracteres." };
  if (contenido.length < 5 || contenido.length > 5000) return { error: "La descripción de la actividad debe tener entre 5 y 5000 caracteres." };
  if (esfuerzo.length > 2000) return { error: "La descripción del esfuerzo no puede superar 2000 caracteres." };
  if (horas === null && esfuerzo.length < 5) return { error: "Si no registras horas, describe el esfuerzo realizado (mínimo 5 caracteres)." };
  return { titulo, contenido, horas, descripcion_esfuerzo: esfuerzo || null };
}

async function permisoProyecto(cliente, req, idProyecto) {
  const resp = await cliente.query(
    `SELECT p.id_proyecto, p.codigo, p.nombre, ep.nombre AS estado,
            c.nombre_razon_social AS cliente,
            EXISTS (SELECT 1 FROM proyecto_usuarios pu
                     WHERE pu.id_proyecto = p.id_proyecto AND pu.id_usuario = $2 AND pu.activo = TRUE) AS asignado
       FROM proyectos p
       JOIN estados_proyecto ep ON ep.id_estado = p.id_estado
       JOIN clientes c ON c.id_cliente = p.id_cliente
      WHERE p.id_proyecto = $1`,
    [idProyecto, req.usuario.idUsuario]
  );
  if (!resp.rowCount) return { estado: 404, mensaje: "El proyecto no existe." };
  const proyecto = resp.rows[0];
  if (!administrador(req) && !proyecto.asignado) {
    return { estado: 403, mensaje: "Solo puedes consultar o registrar información en proyectos que tengas asignados." };
  }
  return { proyecto };
}

// Catálogo filtrado en el SERVIDOR: un colaborador solo ve proyectos asignados.
router.get("/proyectos", async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT p.id_proyecto, p.codigo, p.nombre, ep.nombre AS estado,
              c.nombre_razon_social AS cliente
         FROM proyectos p
         JOIN estados_proyecto ep ON ep.id_estado = p.id_estado
         JOIN clientes c ON c.id_cliente = p.id_cliente
        WHERE $1::boolean OR EXISTS
              (SELECT 1 FROM proyecto_usuarios pu
                WHERE pu.id_proyecto = p.id_proyecto AND pu.id_usuario = $2 AND pu.activo = TRUE)
        ORDER BY p.id_proyecto DESC`,
      [administrador(req), req.usuario.idUsuario]
    );
    return res.json(resultado.rows);
  } catch (error) {
    console.error("Error proyectos bitácora:", error);
    return errorHTTP(res, 500, "No fue posible cargar los proyectos de la bitácora.");
  }
});

// HU-M04-04. Eventos originales y cada corrección, ordenados por fecha real de evento.
const EVENTOS_SQL = `
  WITH eventos AS (
    SELECT 'E' || e.id_entrada::text AS clave,
           e.id_entrada, e.id_proyecto, e.tipo AS tipo_evento,
           e.creado_en AS fecha_evento,
           CONCAT(u.nombre, ' ', u.apellidos) AS autor,
           e.id_usuario AS id_autor,
           e.creado_en AS fecha_creacion,
           e.titulo_inicial AS titulo, e.contenido_inicial AS contenido,
           e.horas_iniciales AS horas, e.descripcion_esfuerzo_inicial AS descripcion_esfuerzo,
           NULL::text AS justificacion,
           NULL::jsonb AS anterior, NULL::jsonb AS nuevo,
           jsonb_build_object('titulo',e.titulo,'contenido',e.contenido,
                              'horas',e.horas,'descripcion_esfuerzo',e.descripcion_esfuerzo) AS actual
      FROM bitacora_entradas e
      JOIN usuarios u ON u.id_usuario = e.id_usuario
     WHERE e.id_proyecto = $1
    UNION ALL
    SELECT 'C' || c.id_correccion::text AS clave,
           e.id_entrada, e.id_proyecto, 'CORRECCION' AS tipo_evento,
           c.corregido_en AS fecha_evento,
           CONCAT(u.nombre, ' ', u.apellidos) AS autor,
           c.id_usuario_corrector AS id_autor,
           e.creado_en AS fecha_creacion,
           NULL::varchar(180) AS titulo, NULL::text AS contenido,
           NULL::numeric(4,2) AS horas, NULL::text AS descripcion_esfuerzo,
           c.justificacion, c.anterior, c.nuevo,
           NULL::jsonb AS actual
      FROM bitacora_correcciones c
      JOIN bitacora_entradas e ON e.id_entrada = c.id_entrada
      JOIN usuarios u ON u.id_usuario = c.id_usuario_corrector
     WHERE e.id_proyecto = $1
  )`;

router.get("/proyectos/:id/cronologia", async (req, res) => {
  if (!idValido(req.params.id)) return errorHTTP(res, 400, "Proyecto inválido.");
  const filtro = String(req.query.tipo || "TODOS").toUpperCase();
  if (!["TODOS", "ACTIVIDAD", "COMENTARIO", "CORRECCION"].includes(filtro)) {
    return errorHTTP(res, 400, "Filtro de eventos inválido.");
  }
  const pagina = Math.max(1, Math.min(100000, parseInt(req.query.pagina, 10) || 1));
  const limite = Math.max(1, Math.min(30, parseInt(req.query.limite, 10) || 8));
  try {
    const acceso = await permisoProyecto(pool, req, Number(req.params.id));
    if (acceso.estado) return errorHTTP(res, acceso.estado, acceso.mensaje);
    const parametros = [Number(req.params.id), filtro];
    const condicion = `WHERE ($2::text = 'TODOS' OR tipo_evento = $2::text)`;
    const [contador, listado, resumen] = await Promise.all([
      pool.query(`${EVENTOS_SQL} SELECT COUNT(*)::int AS total FROM eventos ${condicion}`, parametros),
      pool.query(`${EVENTOS_SQL} SELECT * FROM eventos ${condicion}
                  ORDER BY fecha_evento DESC, clave DESC LIMIT $3 OFFSET $4`,
        [...parametros, limite, (pagina - 1) * limite]),
      pool.query(`SELECT COUNT(*) FILTER (WHERE tipo = 'ACTIVIDAD')::int AS actividades,
                         COUNT(*) FILTER (WHERE tipo = 'COMENTARIO')::int AS comentarios,
                         COALESCE(SUM(horas) FILTER (WHERE tipo = 'ACTIVIDAD'),0) AS horas,
                         (SELECT COUNT(*)::int FROM bitacora_correcciones bc
                           JOIN bitacora_entradas be ON be.id_entrada=bc.id_entrada
                          WHERE be.id_proyecto=$1) AS correcciones
                    FROM bitacora_entradas WHERE id_proyecto=$1`, [Number(req.params.id)])
    ]);
    const total = contador.rows[0].total;
    return res.json({ proyecto: acceso.proyecto, eventos: listado.rows, resumen: resumen.rows[0],
      total, pagina, limite, paginas: Math.max(1, Math.ceil(total / limite)) });
  } catch (error) {
    console.error("Error cronología bitácora:", error);
    return errorHTTP(res, 500, "No fue posible consultar la cronología. Comprueba que ejecutaste la migración 07.");
  }
});

// HU-M04-01 / M04-03: actividades y registro opcional de horas.
router.post("/proyectos/:id/actividades", async (req, res) => {
  if (!idValido(req.params.id)) return errorHTTP(res, 400, "Proyecto inválido.");
  const datos = validarActividad(req.body);
  if (datos.error) return errorHTTP(res, 400, datos.error);
  try {
    const acceso = await permisoProyecto(pool, req, Number(req.params.id));
    if (acceso.estado) return errorHTTP(res, acceso.estado, acceso.mensaje);
    const resultado = await pool.query(
      `INSERT INTO bitacora_entradas
         (id_proyecto,id_usuario,tipo,titulo,contenido,horas,descripcion_esfuerzo,
          titulo_inicial,contenido_inicial,horas_iniciales,descripcion_esfuerzo_inicial)
       VALUES ($1,$2,'ACTIVIDAD',$3,$4,$5,$6,$3,$4,$5,$6)
       RETURNING id_entrada, creado_en`,
      [Number(req.params.id), req.usuario.idUsuario, datos.titulo, datos.contenido, datos.horas, datos.descripcion_esfuerzo]
    );
    return res.status(201).json({ mensaje: "Actividad registrada correctamente.", entrada: resultado.rows[0] });
  } catch (error) {
    console.error("Error registrar actividad:", error);
    return errorHTTP(res, 500, "No fue posible registrar la actividad.");
  }
});

// HU-M04-02: comentarios permanentes asociados al proyecto.
router.post("/proyectos/:id/comentarios", async (req, res) => {
  if (!idValido(req.params.id)) return errorHTTP(res, 400, "Proyecto inválido.");
  const contenido = texto(req.body?.contenido);
  if (contenido.length < 2 || contenido.length > 3000) return errorHTTP(res, 400, "El comentario debe tener entre 2 y 3000 caracteres.");
  try {
    const acceso = await permisoProyecto(pool, req, Number(req.params.id));
    if (acceso.estado) return errorHTTP(res, acceso.estado, acceso.mensaje);
    const resultado = await pool.query(
      `INSERT INTO bitacora_entradas
         (id_proyecto,id_usuario,tipo,contenido,contenido_inicial)
       VALUES ($1,$2,'COMENTARIO',$3,$3) RETURNING id_entrada,creado_en`,
      [Number(req.params.id), req.usuario.idUsuario, contenido]
    );
    return res.status(201).json({ mensaje: "Comentario agregado a la bitácora.", entrada: resultado.rows[0] });
  } catch (error) {
    console.error("Error comentario bitácora:", error);
    return errorHTTP(res, 500, "No fue posible agregar el comentario.");
  }
});

// HU-M04-05 / RN-009: cambios de actividades con autor, hora, antes y después.
router.put("/actividades/:id", async (req, res) => {
  if (!idValido(req.params.id)) return errorHTTP(res, 400, "Actividad inválida.");
  const datos = validarActividad(req.body);
  if (datos.error) return errorHTTP(res, 400, datos.error);
  const justificacion = texto(req.body?.justificacion);
  if (justificacion.length > 2000) return errorHTTP(res, 400, "La justificación no puede superar 2000 caracteres.");
  let conexion;
  try {
    conexion = await pool.connect();
    await conexion.query("BEGIN");
    const entradaR = await conexion.query(
      `SELECT e.*, (e.creado_en + INTERVAL '24 hours' > CURRENT_TIMESTAMP) AS dentro_plazo
         FROM bitacora_entradas e WHERE id_entrada=$1 FOR UPDATE`, [Number(req.params.id)]);
    if (!entradaR.rowCount || entradaR.rows[0].tipo !== "ACTIVIDAD") {
      await conexion.query("ROLLBACK");
      return errorHTTP(res, 404, "La actividad no existe.");
    }
    const entrada = entradaR.rows[0];
    const acceso = await permisoProyecto(conexion, req, entrada.id_proyecto);
    if (acceso.estado) { await conexion.query("ROLLBACK"); return errorHTTP(res, acceso.estado, acceso.mensaje); }
    const esAutor = Number(entrada.id_usuario) === Number(req.usuario.idUsuario);
    const esAdmin = administrador(req);
    if (!esAdmin && (!esAutor || !entrada.dentro_plazo)) {
      await conexion.query("ROLLBACK");
      return errorHTTP(res, 403, "Un colaborador solo puede corregir actividades propias durante las primeras 24 horas.");
    }
    if (esAdmin && (!esAutor || !entrada.dentro_plazo) && justificacion.length < 10) {
      await conexion.query("ROLLBACK");
      return errorHTTP(res, 400, "El administrador debe justificar la corrección fuera de plazo o de otra persona (mínimo 10 caracteres).");
    }
    const anterior = { titulo: entrada.titulo, contenido: entrada.contenido,
      horas: entrada.horas === null ? null : Number(entrada.horas),
      descripcion_esfuerzo: entrada.descripcion_esfuerzo || null };
    const nuevo = { titulo: datos.titulo, contenido: datos.contenido,
      horas: datos.horas, descripcion_esfuerzo: datos.descripcion_esfuerzo };
    if (JSON.stringify(anterior) === JSON.stringify(nuevo)) {
      await conexion.query("ROLLBACK");
      return errorHTTP(res, 400, "Modifica al menos un dato para registrar una corrección.");
    }
    await conexion.query(
      `UPDATE bitacora_entradas SET titulo=$1,contenido=$2,horas=$3,
              descripcion_esfuerzo=$4,actualizado_en=CURRENT_TIMESTAMP WHERE id_entrada=$5`,
      [datos.titulo, datos.contenido, datos.horas, datos.descripcion_esfuerzo, Number(req.params.id)]);
    await conexion.query(
      `INSERT INTO bitacora_correcciones
         (id_entrada,id_usuario_corrector,anterior,nuevo,justificacion)
       VALUES ($1,$2,$3::jsonb,$4::jsonb,$5)`,
      [Number(req.params.id), req.usuario.idUsuario, JSON.stringify(anterior), JSON.stringify(nuevo), justificacion || null]);
    await conexion.query("COMMIT");
    return res.json({ mensaje: "Corrección guardada con auditoría de valores anteriores y nuevos." });
  } catch (error) {
    if (conexion) { try { await conexion.query("ROLLBACK"); } catch {} }
    console.error("Error corregir actividad:", error);
    return errorHTTP(res, 500, "No fue posible corregir la actividad.");
  } finally {
    if (conexion) conexion.release();
  }
});

module.exports = router;
module.exports._validarActividad = validarActividad; // pruebas automáticas de reglas RN-008
