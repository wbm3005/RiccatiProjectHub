const assert = require("node:assert/strict");
const test = require("node:test");
const { cargarConDobles, servidor, filas, authSimulada } = require("./helpers/http");

test("Clientes: permisos, respuestas compatibles y cambios de estado auditados", async t => {
  const cliente = { id_cliente: 1, nombre_razon_social: "Cliente existente", estado: "ACTIVO", cantidad_contactos: 0 };
  let consultas = 0, auditoria = [], proyectosActivos = 1, commits = 0, rollbacks = 0;
  const pool = {
    async query(sql, params = []) {
      consultas++;
      const q = sql.replace(/\s+/g, " ").trim();
      if (q === "BEGIN") return filas([]);
      if (q === "COMMIT") { commits++; return filas([]); }
      if (q === "ROLLBACK") { rollbacks++; return filas([]); }
      if (q.includes("COUNT(*)::INTEGER AS total")) return filas([{ total: proyectosActivos }]);
      if (q.startsWith("INSERT INTO clientes_cambios_estado")) {
        auditoria.push({ id_cliente: params[0], id_usuario: params[1], anterior: params[2], nuevo: params[3], justificacion: params[4] });
        return filas([]);
      }
      if (q.startsWith("UPDATE clientes SET estado")) {
        cliente.estado = params[0];
        return filas([]);
      }
      if (q.startsWith("UPDATE clientes SET")) {
        // La edición general no cambia estado: se reserva para la ruta auditada.
        assert.doesNotMatch(q, /\bestado\s*=/);
        cliente.nombre_razon_social = params[0];
        return filas([{ ...cliente }]);
      }
      if (q.includes("FROM contactos_cliente")) return filas([]);
      if (q.includes("FROM proyectos p")) {
        assert.match(q, /pu.activo = TRUE/);
        assert.deepEqual(params.slice(1), ["Colaborador", 2]);
        return filas([]);
      }
      if (q.includes("FROM clientes")) return filas([{ ...cliente }]);
      throw new Error(`Consulta inesperada: ${q}`);
    },
    async connect() { return { query: pool.query, release() {} }; },
  };
  const rutas = cargarConDobles(require.resolve("../routes/clientes.routes"), pool, authSimulada);
  const llamar = await servidor(t, app => app.use("/clientes", rutas));
  const colaborador = { "x-role": "Colaborador", "x-user": "2" };

  await t.test("ambos roles reciben un array compatible con Dashboard y Proyectos", async () => {
    for (const headers of [{}, colaborador]) {
      const r = await llamar("/clientes", { headers });
      assert.equal(r.status, 200);
      assert.ok(Array.isArray(r.body));
      assert.equal(r.body[0].id_cliente, 1);
    }
    const ficha = await llamar("/clientes/1", { headers: colaborador });
    assert.equal(ficha.status, 200);
    assert.ok(Array.isArray(ficha.body.contactos));
    assert.ok(Array.isArray(ficha.body.proyectos));
  });
  await t.test("un colaborador no puede escribir clientes ni contactos por ninguna ruta", async () => {
    const antes = consultas;
    for (const [method, ruta] of [
      ["POST", "/clientes"], ["PUT", "/clientes/1"], ["PUT", "/clientes/1/estado"],
      ["POST", "/clientes/1/contactos"], ["PUT", "/clientes/1/contactos/2"],
    ]) assert.equal((await llamar(ruta, { method, headers: colaborador, body: {} })).status, 403);
    assert.equal(consultas, antes);
  });
  await t.test("inactivar con proyectos activos exige motivo y no cambia nada al rechazar", async () => {
    const r = await llamar("/clientes/1/estado", { method: "PUT", body: { estado: "INACTIVO" } });
    assert.equal(r.status, 400);
    assert.equal(cliente.estado, "ACTIVO");
    assert.equal(auditoria.length, 0);
    assert.equal(rollbacks, 1);
  });
  await t.test("el administrador inactiva y reactiva dejando autor, estados y motivo", async () => {
    const motivo = "Proyecto pendiente de cierre administrativo";
    const r = await llamar("/clientes/1/estado", { method: "PUT", body: { estado: "INACTIVO", justificacion: motivo } });
    assert.equal(r.status, 200);
    assert.equal(r.body.proyectosActivos, 1);
    assert.equal(cliente.estado, "INACTIVO");
    assert.deepEqual(auditoria[0], { id_cliente: "1", id_usuario: 1, anterior: "ACTIVO", nuevo: "INACTIVO", justificacion: motivo });
    assert.equal((await llamar("/clientes/1/estado", { method: "PUT", body: { estado: "ACTIVO" } })).status, 200);
    assert.equal(auditoria.length, 2);
    assert.equal(commits, 2);
  });
  await t.test("editar la ficha no permite eludir la auditoría de estado", async () => {
    const r = await llamar("/clientes/1", { method: "PUT", body: { nombre_razon_social: "Nombre actualizado", estado: "INACTIVO" } });
    assert.equal(r.status, 200);
    assert.equal(r.body.cliente.estado, "ACTIVO");
    assert.equal(auditoria.length, 2);
  });
  await t.test("rechaza estados y filtros inválidos y detecta estados repetidos", async () => {
    assert.equal((await llamar("/clientes?estado=OTRO")).status, 400);
    assert.equal((await llamar("/clientes/1/estado", { method: "PUT", body: { estado: "OTRO" } })).status, 400);
    assert.equal((await llamar("/clientes/1/estado", { method: "PUT", body: { estado: "ACTIVO" } })).status, 409);
  });
});
