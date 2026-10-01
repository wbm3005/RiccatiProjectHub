import {
  useEffect,
  useMemo,
  useState,
} from "react";

import RiccatiLayout from "../components/RiccatiLayout";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import UsuarioModal from "../components/UsuarioModal";

import {
  obtenerUsuarios,
  obtenerRoles,
  crearUsuario,
  actualizarUsuario,
} from "../services/usuariosService";


function Usuarios() {
  const [usuarios, setUsuarios] =
    useState([]);

  const [roles, setRoles] =
    useState([]);

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
        estado="PostgreSQL conectado"
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
            color: "#2de2a6",
            fontSize: "9px",
          }}
        >
          ✓ {mensaje}
        </div>
      )}


      {/* ERROR GENERAL */}

      {error && !mostrarModal && (
        <div className="login-error animate-up">
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
                placeholder="Buscar usuario..."
                value={busqueda}
                onChange={(e) =>
                  setBusqueda(
                    e.target.value
                  )
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

              {usuariosFiltrados.map(
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
                              color: "#e8f0f7",
                              fontSize: "9px",
                            }}
                          >
                            {usuario.nombre}{" "}
                            {usuario.apellidos}
                          </strong>

                          <span
                            style={{
                              display: "block",
                              marginTop: "3px",
                              color: "#50677e",
                              fontSize: "7px",
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

                      <button
                        className="riccati-button-secondary"
                        onClick={() =>
                          abrirEditarUsuario(
                            usuario
                          )
                        }
                      >
                        Editar
                      </button>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>


        <div
          style={{
            padding: "12px 16px",
            color: "#50677e",
            fontSize: "7px",
          }}
        >
          Mostrando{" "}
          {usuariosFiltrados.length} de{" "}
          {usuarios.length} usuarios
        </div>

      </section>


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