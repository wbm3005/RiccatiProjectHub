"use strict";

// Regla compartida por Bitácora (M04) y Documentos (M05):
// el administrador accede a todos los proyectos y el colaborador
// solo a los proyectos en los que tiene una asignación activa.
// `cliente` puede ser el pool o una conexión dentro de una transacción.
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
  if (req.usuario.rol !== "Administrador" && !proyecto.asignado) {
    return { estado: 403, mensaje: "Solo puedes consultar o registrar información en proyectos que tengas asignados." };
  }
  return { proyecto };
}

const idValido = (v) => /^\d+$/.test(String(v)) && Number.isSafeInteger(Number(v)) && Number(v) > 0;

module.exports = { permisoProyecto, idValido };
