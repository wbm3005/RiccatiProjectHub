// Pruebas aisladas de M06 (Sprint 3): no conectan a PostgreSQL.
const assert = require("node:assert/strict");
const test = require("node:test");
const { cargarConDobles, servidor, filas, authSimulada } = require("./helpers/http");

// Estado simulado: proyecto 1 con monto acordado de 1000.00 CRC y sin pagos.
const estado = { finanzas: { moneda: "CRC", monto_acordado: "1000.00" }, pagos: [] };
const pool = {
  connect: async () => ({ query: pool.query, release() {} }),
  async query(sql, p = []) {
    if (/^\s*(BEGIN|COMMIT|ROLLBACK)/.test(sql)) return filas([]);
    if (sql.includes("FROM proyectos p") && sql.includes("WHERE p.id_proyecto = $1")) {
      return filas(+p[0] === 1 ? [{ id_proyecto: 1, codigo: "PRJ-0001", nombre: "Proyecto", estado: "En curso", cliente: "Cliente", asignado: false }] : []);
    }
    if (sql.includes("SELECT id_proyecto FROM finanzas_proyecto") && sql.includes("FOR UPDATE")) return filas(estado.finanzas ? [{ id_proyecto: 1 }] : []);
    if (sql.includes("FROM finanzas_proyecto f") && sql.includes("LEFT JOIN pagos_proyecto p")) {
      if (!estado.finanzas) return filas([]);
      const vigentes = estado.pagos.filter(x => x.estado === "VIGENTE");
      const total = vigentes.reduce((s, x) => s + Math.round(Number(x.monto) * 100), 0);
      return filas([{ moneda: estado.finanzas.moneda, monto_acordado: estado.finanzas.monto_acordado, total_pagado: (total / 100).toFixed(2), pagos_vigentes: vigentes.length, pagos_registrados: estado.pagos.length }]);
    }
    if (sql.includes("INSERT INTO pagos_proyecto")) { estado.pagos.push({ monto: p[2], estado: "VIGENTE" }); return filas([{ id_pago: estado.pagos.length }]); }
    throw new Error("Consulta no simulada: " + sql.slice(0, 80));
  },
};
const ruta = require.resolve("../routes/finanzas.routes");
const router = cargarConDobles(ruta, pool, authSimulada);
const { analizarMonto, aCentavos, deCentavos } = router._interno;
const hoy = new Date().toLocaleDateString("en-CA");

test("M06: montos en céntimos sin errores de redondeo", () => {
  assert.equal(aCentavos("0.1") + aCentavos("0.2"), aCentavos("0.3"));
  assert.equal(aCentavos("1500000.75"), 150000075);
  assert.equal(deCentavos(150000075), "1500000.75");
  assert.equal(analizarMonto("12.5").monto, "12.50");
  for (const malo of ["0", "-1", "1.234", "abc", "", "1e5"]) assert.ok(analizarMonto(malo).error, malo);
});

test("M06: permisos, RN-013 y aviso de sobrepago", async t => {
  const llamar = await servidor(t, app => app.use("/api/finanzas", router));
  const colaborador = { "x-role": "Colaborador", "x-user": "2" };
  let r = await llamar("/api/finanzas/proyectos/1", { headers: colaborador });
  assert.equal(r.status, 403, "un colaborador no accede a finanzas");
  r = await llamar("/api/finanzas/proyectos/1/pagos", { method: "POST", body: { fecha_pago: hoy, monto: "600" } });
  assert.equal(r.status, 201, r.body.mensaje);
  assert.equal(r.body.resumen.saldo, "400.00", "RN-014: el saldo se actualiza");
  r = await llamar("/api/finanzas/proyectos/1/pagos", { method: "POST", body: { fecha_pago: hoy, monto: "500" } });
  assert.equal(r.status, 409, "sobrepago sin confirmar");
  assert.equal(r.body.codigo, "REQUIERE_CONFIRMACION");
  assert.equal(estado.pagos.length, 1, "el sobrepago rechazado no se guarda");
  r = await llamar("/api/finanzas/proyectos/1/pagos", { method: "POST", body: { fecha_pago: hoy, monto: "500", confirmar_excedente: true } });
  assert.equal(r.status, 201);
  assert.equal(r.body.resumen.saldo_a_favor, true, "queda saldo a favor del cliente");
  r = await llamar("/api/finanzas/proyectos/1/pagos", { method: "POST", body: { fecha_pago: "2099-01-01", monto: "1" } });
  assert.equal(r.status, 400, "fecha futura");
  estado.finanzas = null;
  r = await llamar("/api/finanzas/proyectos/1/pagos", { method: "POST", body: { fecha_pago: hoy, monto: "1" } });
  assert.equal(r.status, 409, "RN-013: sin monto acordado no hay pagos");
});
