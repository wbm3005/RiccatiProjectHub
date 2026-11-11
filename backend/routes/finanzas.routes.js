"use strict";
// =====================================================
// SPRINT 3 · M06 CONTROL FINANCIERO BÁSICO (captura)
// HU-M06-01 Registrar monto acordado
// HU-M06-02 Registrar pagos recibidos (RN-013 sin monto no hay pagos, RN-014 saldo actualizado)
// HU-M06-03 Corregir pagos registrados (RN-015 corrección/anulación sin eliminar historial)
// Todas las historias son "Como administrador": todas las rutas exigen ese rol.
// =====================================================
const express = require("express");
const pool = require("../db");
const { autenticarToken, soloAdministrador } = require("../middleware/auth.middleware");
const { permisoProyecto, idValido } = require("../services/accesoProyecto");
const { fechaValida } = require("../services/filtrosFecha");

const router = express.Router();
router.use(autenticarToken, soloAdministrador);

const MONEDAS = ["CRC", "USD"];
const texto = (v) => (typeof v === "string" ? v.trim() : "");
const errorHTTP = (res, estado, mensaje, extra = {}) => res.status(estado).json({ mensaje, ...extra });

// Montos como texto decimal con 2 decimales máximo. Se comparan en céntimos (enteros)
// para evitar errores de redondeo de punto flotante.
function analizarMonto(valor, etiqueta = "El monto") {
  const cadena = typeof valor === "number" ? String(valor) : texto(valor);
  if (!/^\d{1,12}(\.\d{1,2})?$/.test(cadena)) return { error: `${etiqueta} debe ser un número positivo con máximo 2 decimales.` };
  const centavos = aCentavos(cadena);
  if (centavos <= 0) return { error: `${etiqueta} debe ser mayor que 0.` };
  return { monto: (centavos / 100).toFixed(2), centavos };
}
function aCentavos(valor) {
  const [entero, decimal = ""] = String(valor).split(".");
  return Number(entero) * 100 + Number((decimal + "00").slice(0, 2));
}
const deCentavos = (c) => (c / 100).toFixed(2);
// Formato para mensajes: ₡1 500 000,00 o $2 500,50 (igual que la interfaz).
const conMoneda = (c, moneda) => `${moneda === "USD" ? "$" : "₡"}${(c / 100).toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const hoyLocal = () => new Date().toLocaleDateString("en-CA"); // AAAA-MM-DD en la zona del servidor

function validarDatosPago(body) {
  const monto = analizarMonto(body?.monto, "El monto del pago");
  if (monto.error) return monto;
  const fecha = texto(body?.fecha_pago);
  if (!fechaValida(fecha)) return { error: "Indica una fecha de pago válida (AAAA-MM-DD)." };
  if (fecha > hoyLocal()) return { error: "La fecha de pago no puede ser posterior a hoy." };
  const referencia = texto(body?.referencia);
  if (referencia.length > 80) return { error: "La referencia no puede superar 80 caracteres." };
  const observacion = texto(body?.observacion);
  if (observacion.length > 1000) return { error: "La observación no puede superar 1000 caracteres." };
  return { fecha_pago: fecha, monto: monto.monto, centavos: monto.centavos, referencia: referencia || null, observacion: observacion || null };
}

function validarJustificacion(valor) {
  const justificacion = texto(valor);
  if (justificacion.length < 10 || justificacion.length > 1000) return { error: "Indica la justificación (entre 10 y 1000 caracteres)." };
  return { justificacion };
}

// Totales del proyecto en céntimos. `cliente` puede ser el pool o una transacción.
async function totales(cliente, idProyecto) {
  const r = await cliente.query(
    `SELECT f.moneda, f.monto_acordado::text AS monto_acordado,
            COALESCE(SUM(p.monto) FILTER (WHERE p.estado = 'VIGENTE'), 0)::text AS total_pagado,
            COUNT(p.id_pago) FILTER (WHERE p.estado = 'VIGENTE')::int AS pagos_vigentes,
            COUNT(p.id_pago)::int AS pagos_registrados
       FROM finanzas_proyecto f
       LEFT JOIN pagos_proyecto p ON p.id_proyecto = f.id_proyecto
      WHERE f.id_proyecto = $1
      GROUP BY f.id_proyecto`,
    [idProyecto]
  );
  if (!r.rowCount) return null;
  const fila = r.rows[0];
  return { ...fila, acordado: aCentavos(fila.monto_acordado), pagado: aCentavos(fila.total_pagado) };
}

function resumen(t) {
  if (!t) return null;
  const saldo = t.acordado - t.pagado;
  return {
    moneda: t.moneda, monto_acordado: deCentavos(t.acordado), total_pagado: deCentavos(t.pagado),
    saldo: deCentavos(saldo), saldo_a_favor: saldo < 0, pagos_vigentes: t.pagos_vigentes,
  };
}

// Decisión del usuario: un pago que supera el monto acordado se permite, pero con aviso.
// El servidor exige confirmación explícita (`confirmar_excedente: true`) para registrarlo.
function requiereConfirmacion(res, acordado, nuevoTotal, moneda, accion) {
  const excedente = nuevoTotal - acordado;
  return errorHTTP(res, 409,
    `${accion} hace que lo pagado supere el monto acordado por ${conMoneda(excedente, moneda)}. Confirma para registrarlo; el proyecto quedará con saldo a favor del cliente.`,
    { codigo: "REQUIERE_CONFIRMACION", excedente: deCentavos(excedente), moneda });
}

async function validarProyecto(req, res, next) {
  if (!idValido(req.params.id)) return errorHTTP(res, 400, "Proyecto inválido.");
  try {
    const acceso = await permisoProyecto(pool, req, Number(req.params.id));
    if (acceso.estado) return errorHTTP(res, acceso.estado, acceso.mensaje);
    req.proyecto = acceso.proyecto;
    return next();
  } catch (error) {
    console.error("Error validando proyecto (finanzas):", error);
    return errorHTTP(res, 500, "No fue posible validar el proyecto.");
  }
}

// GET /api/finanzas/proyectos/:id — datos necesarios para registrar y corregir.
router.get("/proyectos/:id", validarProyecto, async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [finanzas, pagos, cambios, t] = await Promise.all([
      pool.query(
        `SELECT f.moneda, f.monto_acordado::text AS monto_acordado, f.registrado_en, f.actualizado_en,
                CONCAT(ur.nombre, ' ', ur.apellidos) AS usuario_registra,
                CASE WHEN ua.id_usuario IS NULL THEN NULL ELSE CONCAT(ua.nombre, ' ', ua.apellidos) END AS usuario_actualiza
           FROM finanzas_proyecto f
           JOIN usuarios ur ON ur.id_usuario = f.id_usuario_registra
           LEFT JOIN usuarios ua ON ua.id_usuario = f.id_usuario_actualiza
          WHERE f.id_proyecto = $1`, [id]),
      pool.query(
        `SELECT p.id_pago, p.fecha_pago::text AS fecha_pago, p.monto::text AS monto, p.referencia, p.observacion,
                p.estado, p.registrado_en, p.actualizado_en, CONCAT(u.nombre, ' ', u.apellidos) AS usuario_registra,
                (SELECT COUNT(*)::int FROM pagos_correcciones c WHERE c.id_pago = p.id_pago) AS correcciones
           FROM pagos_proyecto p
           JOIN usuarios u ON u.id_usuario = p.id_usuario_registra
          WHERE p.id_proyecto = $1
          ORDER BY p.fecha_pago DESC, p.id_pago DESC`, [id]),
      pool.query(
        `SELECT c.moneda_anterior, c.monto_anterior::text AS monto_anterior, c.moneda_nueva, c.monto_nuevo::text AS monto_nuevo,
                c.justificacion, c.cambiado_en, CONCAT(u.nombre, ' ', u.apellidos) AS usuario
           FROM finanzas_monto_cambios c JOIN usuarios u ON u.id_usuario = c.id_usuario
          WHERE c.id_proyecto = $1 ORDER BY c.cambiado_en DESC, c.id_cambio DESC`, [id]),
      totales(pool, id),
    ]);
    return res.json({
      proyecto: req.proyecto, finanzas: finanzas.rows[0] || null, resumen: resumen(t),
      pagos: pagos.rows, cambios_monto: cambios.rows,
    });
  } catch (error) {
    console.error("Error consultando finanzas:", error);
    return errorHTTP(res, 500, "No fue posible consultar la información financiera. Comprueba que ejecutaste la migración 10.");
  }
});

// PUT /api/finanzas/proyectos/:id/monto — registrar o actualizar el monto acordado (HU-M06-01).
// Body: { monto, moneda: "CRC"|"USD", justificacion (obligatoria al actualizar), confirmar_excedente? }
router.put("/proyectos/:id/monto", validarProyecto, async (req, res) => {
  const id = Number(req.params.id);
  const monto = analizarMonto(req.body?.monto, "El monto acordado");
  if (monto.error) return errorHTTP(res, 400, monto.error);
  const moneda = texto(req.body?.moneda).toUpperCase();
  if (!MONEDAS.includes(moneda)) return errorHTTP(res, 400, "Selecciona la moneda del proyecto: colones (CRC) o dólares (USD).");
  let conexion;
  try {
    conexion = await pool.connect();
    await conexion.query("BEGIN");
    const actual = await conexion.query(
      "SELECT moneda, monto_acordado::text AS monto_acordado FROM finanzas_proyecto WHERE id_proyecto = $1 FOR UPDATE", [id]);

    if (!actual.rowCount) {
      await conexion.query(
        `INSERT INTO finanzas_proyecto (id_proyecto, moneda, monto_acordado, id_usuario_registra)
         VALUES ($1, $2, $3, $4)`, [id, moneda, monto.monto, req.usuario.idUsuario]);
      await conexion.query("COMMIT");
      return res.status(201).json({ mensaje: "Monto acordado registrado. Ya puedes registrar los pagos del proyecto.", resumen: resumen(await totales(pool, id)) });
    }

    const previo = actual.rows[0];
    if (previo.moneda === moneda && aCentavos(previo.monto_acordado) === monto.centavos) {
      await conexion.query("ROLLBACK");
      return errorHTTP(res, 400, "El monto y la moneda son iguales a los registrados.");
    }
    const just = validarJustificacion(req.body?.justificacion);
    if (just.error) { await conexion.query("ROLLBACK"); return errorHTTP(res, 400, "Para modificar el monto acordado " + just.error.charAt(0).toLowerCase() + just.error.slice(1)); }
    const t = await totales(conexion, id);
    if (previo.moneda !== moneda && t.pagos_registrados > 0) {
      await conexion.query("ROLLBACK");
      return errorHTTP(res, 409, "No se puede cambiar la moneda porque el proyecto ya tiene pagos registrados en " + previo.moneda + ".");
    }
    if (t.pagado > monto.centavos && req.body?.confirmar_excedente !== true) {
      await conexion.query("ROLLBACK");
      return requiereConfirmacion(res, monto.centavos, t.pagado, moneda, "El nuevo monto acordado");
    }
    await conexion.query(
      `INSERT INTO finanzas_monto_cambios
         (id_proyecto, moneda_anterior, monto_anterior, moneda_nueva, monto_nuevo, justificacion, id_usuario)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, previo.moneda, previo.monto_acordado, moneda, monto.monto, just.justificacion, req.usuario.idUsuario]);
    await conexion.query(
      `UPDATE finanzas_proyecto SET moneda = $1, monto_acordado = $2, id_usuario_actualiza = $3, actualizado_en = CURRENT_TIMESTAMP
        WHERE id_proyecto = $4`, [moneda, monto.monto, req.usuario.idUsuario, id]);
    await conexion.query("COMMIT");
    return res.json({ mensaje: "Monto acordado actualizado. El cambio quedó registrado en el historial.", resumen: resumen(await totales(pool, id)) });
  } catch (error) {
    if (conexion) await conexion.query("ROLLBACK").catch(() => {});
    console.error("Error registrando monto acordado:", error);
    return errorHTTP(res, 500, "No fue posible guardar el monto acordado.");
  } finally {
    if (conexion) conexion.release();
  }
});

// POST /api/finanzas/proyectos/:id/pagos — registrar pago recibido (HU-M06-02).
// Body: { fecha_pago, monto, referencia?, observacion?, confirmar_excedente? }
router.post("/proyectos/:id/pagos", validarProyecto, async (req, res) => {
  const id = Number(req.params.id);
  const datos = validarDatosPago(req.body);
  if (datos.error) return errorHTTP(res, 400, datos.error);
  let conexion;
  try {
    conexion = await pool.connect();
    await conexion.query("BEGIN");
    // Bloqueo del registro financiero: los pagos simultáneos se calculan sobre el saldo real.
    const bloqueo = await conexion.query("SELECT id_proyecto FROM finanzas_proyecto WHERE id_proyecto = $1 FOR UPDATE", [id]);
    if (!bloqueo.rowCount) {
      await conexion.query("ROLLBACK");
      return errorHTTP(res, 409, "Registra primero el monto acordado del proyecto; sin él no se pueden registrar pagos.");
    }
    const t = await totales(conexion, id);
    const nuevoTotal = t.pagado + datos.centavos;
    if (nuevoTotal > t.acordado && req.body?.confirmar_excedente !== true) {
      await conexion.query("ROLLBACK");
      return requiereConfirmacion(res, t.acordado, nuevoTotal, t.moneda, "Este pago");
    }
    const r = await conexion.query(
      `INSERT INTO pagos_proyecto (id_proyecto, fecha_pago, monto, referencia, observacion, id_usuario_registra)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_pago`,
      [id, datos.fecha_pago, datos.monto, datos.referencia, datos.observacion, req.usuario.idUsuario]);
    await conexion.query("COMMIT");
    const nuevo = resumen(await totales(pool, id));
    return res.status(201).json({
      mensaje: nuevo.saldo_a_favor
        ? "Pago registrado. Atención: lo pagado supera el monto acordado; el proyecto queda con saldo a favor del cliente."
        : "Pago registrado. El saldo del proyecto se actualizó.",
      id_pago: r.rows[0].id_pago, resumen: nuevo,
    });
  } catch (error) {
    if (conexion) await conexion.query("ROLLBACK").catch(() => {});
    console.error("Error registrando pago:", error);
    return errorHTTP(res, 500, "No fue posible registrar el pago.");
  } finally {
    if (conexion) conexion.release();
  }
});

// Carga un pago bloqueándolo junto con el registro financiero de su proyecto.
async function bloquearPago(conexion, idPago) {
  const r = await conexion.query(
    `SELECT p.id_pago, p.id_proyecto, p.fecha_pago::text AS fecha_pago, p.monto::text AS monto,
            p.referencia, p.observacion, p.estado
       FROM pagos_proyecto p WHERE p.id_pago = $1 FOR UPDATE`, [idPago]);
  if (!r.rowCount) return null;
  await conexion.query("SELECT 1 FROM finanzas_proyecto WHERE id_proyecto = $1 FOR UPDATE", [r.rows[0].id_proyecto]);
  return r.rows[0];
}
const instantanea = (p) => ({ fecha_pago: p.fecha_pago, monto: p.monto, referencia: p.referencia ?? null, observacion: p.observacion ?? null });

// PUT /api/finanzas/pagos/:id — corregir un pago (HU-M06-03, RN-015).
// Body: { fecha_pago, monto, referencia?, observacion?, justificacion, confirmar_excedente? }
router.put("/pagos/:id", async (req, res) => {
  if (!idValido(req.params.id)) return errorHTTP(res, 400, "Pago inválido.");
  const datos = validarDatosPago(req.body);
  if (datos.error) return errorHTTP(res, 400, datos.error);
  const just = validarJustificacion(req.body?.justificacion);
  if (just.error) return errorHTTP(res, 400, just.error);
  let conexion;
  try {
    conexion = await pool.connect();
    await conexion.query("BEGIN");
    const pago = await bloquearPago(conexion, Number(req.params.id));
    if (!pago) { await conexion.query("ROLLBACK"); return errorHTTP(res, 404, "El pago no existe."); }
    if (pago.estado !== "VIGENTE") { await conexion.query("ROLLBACK"); return errorHTTP(res, 409, "No se puede corregir un pago anulado."); }
    const anterior = instantanea(pago);
    const nuevo = instantanea(datos);
    if (JSON.stringify(anterior) === JSON.stringify(nuevo)) {
      await conexion.query("ROLLBACK");
      return errorHTTP(res, 400, "Modifica al menos un dato para registrar la corrección.");
    }
    const t = await totales(conexion, pago.id_proyecto);
    const nuevoTotal = t.pagado - aCentavos(pago.monto) + datos.centavos;
    if (nuevoTotal > t.acordado && datos.centavos > aCentavos(pago.monto) && req.body?.confirmar_excedente !== true) {
      await conexion.query("ROLLBACK");
      return requiereConfirmacion(res, t.acordado, nuevoTotal, t.moneda, "La corrección");
    }
    await conexion.query(
      `UPDATE pagos_proyecto SET fecha_pago = $1, monto = $2, referencia = $3, observacion = $4, actualizado_en = CURRENT_TIMESTAMP
        WHERE id_pago = $5`,
      [datos.fecha_pago, datos.monto, datos.referencia, datos.observacion, pago.id_pago]);
    await conexion.query(
      `INSERT INTO pagos_correcciones (id_pago, tipo, anterior, nuevo, justificacion, id_usuario)
       VALUES ($1, 'CORRECCION', $2::jsonb, $3::jsonb, $4, $5)`,
      [pago.id_pago, JSON.stringify(anterior), JSON.stringify(nuevo), just.justificacion, req.usuario.idUsuario]);
    await conexion.query("COMMIT");
    return res.json({ mensaje: "Pago corregido. Los valores anteriores quedaron en el historial del pago.", resumen: resumen(await totales(pool, pago.id_proyecto)) });
  } catch (error) {
    if (conexion) await conexion.query("ROLLBACK").catch(() => {});
    console.error("Error corrigiendo pago:", error);
    return errorHTTP(res, 500, "No fue posible corregir el pago.");
  } finally {
    if (conexion) conexion.release();
  }
});

// PUT /api/finanzas/pagos/:id/anular — anular un pago registrado por error (HU-M06-03, RN-015).
// El pago se conserva con estado ANULADO y deja de contar para el saldo.
router.put("/pagos/:id/anular", async (req, res) => {
  if (!idValido(req.params.id)) return errorHTTP(res, 400, "Pago inválido.");
  const just = validarJustificacion(req.body?.justificacion);
  if (just.error) return errorHTTP(res, 400, just.error);
  let conexion;
  try {
    conexion = await pool.connect();
    await conexion.query("BEGIN");
    const pago = await bloquearPago(conexion, Number(req.params.id));
    if (!pago) { await conexion.query("ROLLBACK"); return errorHTTP(res, 404, "El pago no existe."); }
    if (pago.estado !== "VIGENTE") { await conexion.query("ROLLBACK"); return errorHTTP(res, 409, "El pago ya estaba anulado."); }
    await conexion.query("UPDATE pagos_proyecto SET estado = 'ANULADO', actualizado_en = CURRENT_TIMESTAMP WHERE id_pago = $1", [pago.id_pago]);
    await conexion.query(
      `INSERT INTO pagos_correcciones (id_pago, tipo, anterior, nuevo, justificacion, id_usuario)
       VALUES ($1, 'ANULACION', $2::jsonb, $3::jsonb, $4, $5)`,
      [pago.id_pago, JSON.stringify({ ...instantanea(pago), estado: "VIGENTE" }), JSON.stringify({ ...instantanea(pago), estado: "ANULADO" }),
        just.justificacion, req.usuario.idUsuario]);
    await conexion.query("COMMIT");
    return res.json({ mensaje: "Pago anulado. Se conserva en el historial y ya no cuenta para el saldo.", resumen: resumen(await totales(pool, pago.id_proyecto)) });
  } catch (error) {
    if (conexion) await conexion.query("ROLLBACK").catch(() => {});
    console.error("Error anulando pago:", error);
    return errorHTTP(res, 500, "No fue posible anular el pago.");
  } finally {
    if (conexion) conexion.release();
  }
});

// GET /api/finanzas/pagos/:id/correcciones — trazabilidad de un pago (HU-M06-03).
router.get("/pagos/:id/correcciones", async (req, res) => {
  if (!idValido(req.params.id)) return errorHTTP(res, 400, "Pago inválido.");
  try {
    const pago = await pool.query("SELECT id_pago FROM pagos_proyecto WHERE id_pago = $1", [Number(req.params.id)]);
    if (!pago.rowCount) return errorHTTP(res, 404, "El pago no existe.");
    const r = await pool.query(
      `SELECT c.id_correccion, c.tipo, c.anterior, c.nuevo, c.justificacion, c.corregido_en,
              CONCAT(u.nombre, ' ', u.apellidos) AS usuario
         FROM pagos_correcciones c JOIN usuarios u ON u.id_usuario = c.id_usuario
        WHERE c.id_pago = $1 ORDER BY c.corregido_en DESC, c.id_correccion DESC`, [Number(req.params.id)]);
    return res.json(r.rows);
  } catch (error) {
    console.error("Error consultando correcciones de pago:", error);
    return errorHTTP(res, 500, "No fue posible consultar el historial del pago.");
  }
});

module.exports = router;
module.exports._interno = { analizarMonto, aCentavos, deCentavos };
