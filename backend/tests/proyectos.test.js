const assert = require("node:assert/strict");
const test = require("node:test");
const { cargarConDobles, servidor, filas, authSimulada } = require("./helpers/http");

test("Edición de proyectos: clientes activos, contactos e historial", async t => {
  let actual, clientes, contactos, cambios, commits, rollbacks;
  function reiniciar() {
    actual = { id_cliente: 1, id_contacto_principal: null };
    clientes = new Map([[1, "ACTIVO"], [2, "INACTIVO"], [3, "ACTIVO"]]);
    contactos = new Map([[4, { id_contacto: 4, id_cliente: 3, estado: "ACTIVO" }]]);
    cambios = commits = rollbacks = 0;
  }
  reiniciar();
  const pool = {
    query() { throw new Error("La actualización debe usar una transacción."); },
    async connect() {
      return {
        async query(sql, params = []) {
          const q = sql.replace(/\s+/g, " ").trim();
          if (q === "BEGIN") return filas([]);
          if (q === "COMMIT") { commits++; return filas([]); }
          if (q === "ROLLBACK") { rollbacks++; return filas([]); }
          if (q.includes("FROM clientes")) {
            assert.match(q, /FOR SHARE/);
            const estado = clientes.get(Number(params[0]));
            return filas(estado ? [{ id_cliente: Number(params[0]), estado }] : []);
          }
          if (q.includes("FROM proyectos")) {
            assert.match(q, /FOR UPDATE/);
            return filas(actual ? [{ ...actual }] : []);
          }
          if (q.includes("FROM contactos_cliente")) {
            const contacto = contactos.get(Number(params[0]));
            return filas(contacto && contacto.id_cliente === Number(params[1]) ? [contacto] : []);
          }
          if (q.startsWith("UPDATE proyectos")) {
            cambios++;
            return filas([{ id_proyecto: 10, nombre: params[0], id_cliente: params[1] }]);
          }
          throw new Error(`Consulta inesperada: ${q}`);
        },
        release() {},
      };
    },
  };
  const rutas = cargarConDobles(require.resolve("../routes/proyectos.routes"), pool, authSimulada);
  const llamar = await servidor(t, app => app.use("/proyectos", rutas));
  const actualizar = (idCliente, extra = {}) => llamar("/proyectos/10", {
    method: "PUT", body: { nombre: "Proyecto existente", id_cliente: idCliente, id_prioridad: 1, ...extra },
  });
  await t.test("rechaza reasignar a un cliente inactivo o inexistente", async () => {
    for (const id of [2, 999]) {
      reiniciar();
      assert.equal((await actualizar(id)).status, 400);
      assert.equal(cambios, 0);
      assert.equal(rollbacks, 1);
    }
  });
  await t.test("permite reasignar a un cliente activo con su contacto activo", async () => {
    reiniciar();
    const r = await actualizar(3, { id_contacto_principal: 4 });
    assert.equal(r.status, 200);
    assert.equal(r.body.proyecto.id_cliente, 3);
    assert.equal(commits, 1);
    assert.equal(cambios, 1);
  });
  await t.test("conserva cliente y contacto históricos inactivos sin bloquear otras ediciones", async () => {
    reiniciar();
    clientes.set(1, "INACTIVO");
    contactos.set(5, { id_contacto: 5, id_cliente: 1, estado: "INACTIVO" });
    actual.id_contacto_principal = 5;
    assert.equal((await actualizar(1, { id_contacto_principal: 5 })).status, 200);
    assert.equal(commits, 1);
  });
  await t.test("rechaza contactos ajenos o nuevos contactos inactivos", async () => {
    reiniciar();
    assert.equal((await actualizar(1, { id_contacto_principal: 4 })).status, 400);
    contactos.get(4).estado = "INACTIVO";
    assert.equal((await actualizar(3, { id_contacto_principal: 4 })).status, 400);
    assert.equal(cambios, 0);
  });
  await t.test("mantiene errores de proyecto inexistente y fechas incompatibles", async () => {
    reiniciar();
    actual = null;
    assert.equal((await actualizar(1)).status, 404);
    reiniciar();
    assert.equal((await actualizar(1, { fecha_inicio: "2026-10-22", fecha_compromiso: "2026-10-21" })).status, 400);
    assert.equal(cambios, 0);
  });
});
