import Pagination from "../components/Pagination";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import RiccatiLayout from "../components/RiccatiLayout";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import UsuarioModal from "../components/UsuarioModal";
import { createPortal } from "react-dom";
import { UserCheck, UserX } from "lucide-react";

import {
  obtenerUsuarios,
  obtenerRoles,
  crearUsuario,
  actualizarUsuario,
  cambiarEstadoUsuario,
} from "../services/usuariosService";


function Usuarios() {
  const [usuarios, setUsuarios] =
    useState([]);

  const [roles, setRoles] =
    useState([]);

  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] =
    useState("");

  const [mostrarModal, setMostrarModal] =
    useState(false);

  const [usuarioEditando, setUsuarioEditando] =
    useState(null);

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [usuarioConfirmando, setUsuarioConfirmando] = useState(null);
  const [procesandoEstado, setProcesandoEstado] = useState(false);
  let miId = -1;
  try {
    miId = Number(JSON.parse(localStorage.getItem("usuarioRiccati"))?.idUsuario || -1);
  } catch {
    miId = -1;
  }



  const [error, setError] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");

  const [formulario, setFormulario] =
    useState({
      nombre: "",
      apellidos: "",
      correo: "",
      password: "",
      rol: "Colaborador",
      estado: "ACTIVO",
    });


  // =====================================================
  // CARGAR DATOS
  // =====================================================

  useEffect(() => {
    cargarDatos();
  }, []);


  const cargarDatos = async () => {
    setCargando(true);
    setError("");

    try {
      const [
        datosUsuarios,
        datosRoles,
      ] = await Promise.all([
        obtenerUsuarios(),
        obtenerRoles(),
      ]);

      setUsuarios(datosUsuarios);
      setRoles(datosRoles);

    } catch (error) {
      setError(error.message);

    } finally {
      setCargando(false);
    }
  };


  // =====================================================
  // BUSCADOR
  // =====================================================

  const usuariosFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      if (!texto) {
        return usuarios;
      }

      return usuarios.filter(
        (usuario) =>
          usuario.nombre
            .toLowerCase()
            .includes(texto) ||

          usuario.apellidos
            .toLowerCase()
            .includes(texto) ||

          usuario.correo
            .toLowerCase()
            .includes(texto) ||

          usuario.rol
            .toLowerCase()
            .includes(texto)
      );

    }, [usuarios, busqueda]);
  const paginaActual = Math.min(pagina, Math.max(1, Math.ceil(usuariosFiltrados.length / 10)));
  const visibles = usuariosFiltrados.slice((paginaActual - 1) * 10, paginaActual * 10);



  // =====================================================
  // ESTADÍSTICAS
  // =====================================================

  const activos =
    usuarios.filter(
      (usuario) =>
        usuario.estado === "ACTIVO"
    ).length;

  const administradores =
    usuarios.filter(
      (usuario) =>
        usuario.rol === "Administrador"
    ).length;

  const colaboradores =
    usuarios.filter(
      (usuario) =>
        usuario.rol === "Colaborador"
    ).length;


  // =====================================================
  // FORMULARIO
  // =====================================================

  const manejarCambio = (e) => {
    const {
      name,
      value,
    } = e.target;

    setFormulario(
      (anterior) => ({
        ...anterior,
        [name]: value,
      })
    );
  };


  const abrirNuevoUsuario = () => {
    setUsuarioEditando(null);
    setError("");

    setFormulario({
      nombre: "",
      apellidos: "",
      correo: "",
      password: "",
      rol: "Colaborador",
      estado: "ACTIVO",
    });

    setMostrarModal(true);
  };


  const abrirEditarUsuario = (
    usuario
  ) => {
    setUsuarioEditando(usuario);
    setError("");

    setFormulario({
      nombre: usuario.nombre,
      apellidos: usuario.apellidos,
      correo: usuario.correo,
      password: "",
      rol: usuario.rol,
      estado: usuario.estado,
    });

    setMostrarModal(true);
  };


  const cerrarModal = () => {
    if (guardando) {
      return;
    }

    setMostrarModal(false);
    setUsuarioEditando(null);
    setError("");
  };


  // =====================================================
  // GUARDAR
  // =====================================================

  const guardarUsuario = async (e) => {
    e.preventDefault();

    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      let resultado;

      if (usuarioEditando) {
        resultado =
          await actualizarUsuario(
            usuarioEditando.id_usuario,
            formulario
          );

      } else {
        resultado =
          await crearUsuario(
            formulario
          );
      }

      setMensaje(
        resultado.mensaje
      );

      setMostrarModal(false);
      setUsuarioEditando(null);

      await cargarDatos();

      setTimeout(() => {
        setMensaje("");
      }, 3500);

    } catch (error) {
      setError(error.message);

    } finally {
      setGuardando(false);
    }
  };


  // =====================================================
  // HU-M01-06: INACTIVAR / REACTIVAR
  // =====================================================

  const confirmarCambioEstado = async () => {
    if (!usuarioConfirmando) return;
    const destino = usuarioConfirmando.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";
    setProcesandoEstado(true);
    setError("");
    setMensaje("");
    try {
      const resultado = await cambiarEstadoUsuario(usuarioConfirmando.id_usuario, destino);
      setUsuarioConfirmando(null);
      await cargarDatos();
      setMensaje(resultado.mensaje);
    } catch (fallo) {
      setUsuarioConfirmando(null);
      setError(fallo.message);
    } finally {
      setProcesandoEstado(false);
    }
  };

  // =====================================================
  // CARGANDO
  // =====================================================

  if (cargando) {
    return (
      <RiccatiLayout paginaActiva="usuarios">

        <div className="riccati-loader-wrapper">

          <div className="riccati-loader">
          </div>

          <span className="riccati-loader-text">
            Cargando usuarios...
          </span>

        </div>

      </RiccatiLayout>
    );
  }


  return (
    <RiccatiLayout paginaActiva="usuarios">

      <PageHeader
        modulo="MÓDULO M01 · ADMINISTRACIÓN"
        titulo="Usuarios"
        descripcion="Administración de usuarios, roles y permisos de acceso al sistema."
        estado="Administración de accesos"
      />


      {/* MENSAJE EXITOSO */}

      {mensaje && (
        <div
          className="animate-up"
          style={{
            marginBottom: "16px",
            padding: "12px 15px",
            borderRadius: "10px",
            border:
              "1px solid rgba(45,226,166,0.15)",
            background:
              "rgba(45,226,166,0.06)",
            color: "var(--ui-success)",
            fontSize: "12px",
          }}
        >
          ✓ {mensaje}
        </div>
      )}


      {/* ERROR GENERAL */}

      {error && !mostrarModal && (
        <div className="login-error animate-up" role="alert">
          {error}
        </div>
      )}


      {/* ESTADÍSTICAS */}

      <section className="riccati-stats-grid">

        <StatCard
          etiqueta="TOTAL USUARIOS"
          valor={usuarios.length}
          icono="◇"
          pie="Usuarios registrados"
        />

        <StatCard
          etiqueta="USUARIOS ACTIVOS"
          valor={activos}
          icono="✓"
          pie="Con acceso habilitado"
          clasePie="text-riccati-green"
        />

        <StatCard
          etiqueta="ADMINISTRADORES"
          valor={administradores}
          icono="A"
          pie="Acceso administrativo"
          clasePie="text-riccati-cyan"
        />

        <StatCard
          etiqueta="COLABORADORES"
          valor={colaboradores}
          icono="C"
          pie="Acceso operativo"
        />

      </section>


      {/* PANEL */}

      <section className="riccati-panel animate-up delay-2">

        <div className="riccati-panel-header">

          <div>

            <span className="riccati-panel-label">
              DIRECTORIO
            </span>

            <h3>
              Usuarios registrados
            </h3>

          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >

            <div className="riccati-search">

              <span className="riccati-search-icon">
                ⌕
              </span>

              <input
                type="text"
                aria-label="Buscar usuario" placeholder="Buscar usuario..."
                value={busqueda}
                onChange={(e) =>
                  (setBusqueda(e.target.value), setPagina(1))
                }
              />

            </div>

            <button
              className="riccati-button-primary"
              onClick={abrirNuevoUsuario}
            >
              + Nuevo usuario
            </button>

          </div>

        </div>


        {/* TABLA */}

        <div className="riccati-table-wrapper">

          <table className="riccati-table">

            <thead>

              <tr>
                <th>USUARIO</th>
                <th>CORREO</th>
                <th>ROL</th>
                <th>ESTADO</th>
                <th>ÚLTIMO ACCESO</th>
                <th>ACCIONES</th>
              </tr>

            </thead>

            <tbody>
 {usuariosFiltrados.length === 0 && <tr><td colSpan={6}><div className="riccati-empty"><strong>Sin resultados</strong><span>{busqueda ? "Prueba con otro nombre, correo o rol." : "No hay usuarios registrados."}</span></div></td></tr>}

              {visibles.map(
                (usuario) => (

                  <tr key={usuario.id_usuario}>

                    <td>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "11px",
                        }}
                      >

                        <div
                          className="riccati-user-avatar"
                          style={{
                            width: "32px",
                            height: "32px",
                          }}
                        >
                          {usuario.nombre.charAt(0)}
                        </div>

                        <div>

                          <strong
                            style={{
                              display: "block",
                              color: "var(--rp-ink)",
                              fontSize: "12px",
                            }}
                          >
                            {usuario.nombre}{" "}
                            {usuario.apellidos}
                          </strong>

                          <span
                            style={{
                              display: "block",
                              marginTop: "3px",
                              color: "var(--rp-muted)",
                              fontSize: "13px",
                            }}
                          >
                            USR-
                            {String(
                              usuario.id_usuario
                            ).padStart(
                              3,
                              "0"
                            )}
                          </span>

                        </div>

                      </div>

                    </td>

                    <td>
                      {usuario.correo}
                    </td>

                    <td>

                      <span
                        className={
                          usuario.rol ===
                          "Administrador"
                            ? "riccati-badge riccati-badge-purple"
                            : "riccati-badge riccati-badge-cyan"
                        }
                      >
                        {usuario.rol}
                      </span>

                    </td>

                    <td>
                      <EstadoUsuario
                        estado={usuario.estado}
                      />
                    </td>

                    <td>

                      {usuario.ultimo_acceso
                        ? new Date(
                            usuario.ultimo_acceso
                          ).toLocaleString(
                            "es-CR"
                          )
                        : "Sin acceso"}

                    </td>

                    <td>

                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="riccati-button-secondary"
                          onClick={() => abrirEditarUsuario(usuario)}
                        >
                          Editar
                        </button>
                        {Number(usuario.id_usuario) !== miId && (
                          <button
                            type="button"
                            className={usuario.estado === "ACTIVO"
                              ? "riccati-button-danger" : "riccati-button-secondary"}
                            onClick={() => setUsuarioConfirmando(usuario)}
                          >
                            {usuario.estado === "ACTIVO"
                              ? <><UserX size={15} aria-hidden="true" /> Inactivar</>
                              : <><UserCheck size={15} aria-hidden="true" /> Reactivar</>}
                          </button>
                        )}
                      </div>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>


        <Pagination total={usuariosFiltrados.length} page={paginaActual} onChange={setPagina} noun="usuarios" />

      </section>


      {/* CONFIRMACIÓN DE CAMBIO DE ESTADO */}
      <ConfirmarEstadoUsuario
        usuario={usuarioConfirmando}
        procesando={procesandoEstado}
        onConfirmar={confirmarCambioEstado}
        onCerrar={() => setUsuarioConfirmando(null)}
      />

      {/* MODAL */}

      <UsuarioModal
        mostrar={mostrarModal}
        usuarioEditando={usuarioEditando}
        formulario={formulario}
        roles={roles}
        error={
          mostrarModal
            ? error
            : ""
        }
        guardando={guardando}
        onChange={manejarCambio}
        onSubmit={guardarUsuario}
        onClose={cerrarModal}
      />

    </RiccatiLayout>
  );
}


function ConfirmarEstadoUsuario({ usuario, procesando, onConfirmar, onCerrar }) {
  if (!usuario) return null;

  const seInactiva = usuario.estado === "ACTIVO";
  return createPortal(
    <div className="riccati-modal-backdrop" onMouseDown={(e) => {
      if (e.target === e.currentTarget && !procesando) onCerrar();
    }}>
      <div className="riccati-modal" role="dialog" aria-modal="true"
           aria-labelledby="confirmacion-estado-titulo"
           style={{ width: "min(100%, 520px)" }}>
        <div className="riccati-modal-header">
          <span className="riccati-page-label">GESTIÓN DE CUENTAS</span>
          <h3 id="confirmacion-estado-titulo">{seInactiva ? "Inactivar usuario" : "Reactivar usuario"}</h3>
        </div>
        <div className="riccati-modal-body" style={{ fontSize: 14 }}>
          {seInactiva
            ? <>¿Deseas inactivar a <strong>{usuario.nombre} {usuario.apellidos}</strong>? Perderá el acceso inmediatamente. No se eliminará su historial.</>
            : <>¿Deseas reactivar a <strong>{usuario.nombre} {usuario.apellidos}</strong>? Podrá volver a iniciar sesión.</>}
        </div>
        <div className="riccati-modal-footer">
          <button type="button" className="riccati-button-secondary" onClick={onCerrar} disabled={procesando}>Cancelar</button>
          <button type="button" className={seInactiva ? "riccati-button-danger" : "riccati-button-primary"}
                  onClick={onConfirmar} disabled={procesando}>
            {procesando ? "Actualizando..." : seInactiva ? "Sí, inactivar" : "Sí, reactivar"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function EstadoUsuario({
  estado,
}) {
  if (estado === "ACTIVO") {
    return (
      <span className="riccati-badge riccati-badge-green">

        <span className="riccati-badge-dot">
        </span>

        Activo

      </span>
    );
  }

  if (estado === "BLOQUEADO") {
    return (
      <span className="riccati-badge riccati-badge-red">
        Bloqueado
      </span>
    );
  }

  return (
    <span className="riccati-badge riccati-badge-orange">
      Inactivo
    </span>
  );
}

export default Usuarios;