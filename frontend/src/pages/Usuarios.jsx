import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Dashboard.css";
import "./Usuarios.css";

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("Todos");

  const navigate = useNavigate();

  const usuarioActual = JSON.parse(
    localStorage.getItem("usuarioRiccati")
  );

  useEffect(() => {
    if (usuarioActual?.rol !== "Administrador") {
      navigate("/dashboard");
      return;
    }

    fetch("http://localhost:3000/api/usuarios")
      .then((respuesta) => respuesta.json())
      .then((datos) => setUsuarios(datos))
      .catch((error) =>
        console.error(
          "Error al cargar usuarios:",
          error
        )
      );
  }, []);

  const usuariosFiltrados = usuarios.filter(
    (usuario) => {
      const texto = busqueda.toLowerCase();

      const coincideBusqueda =
        usuario.nombre
          .toLowerCase()
          .includes(texto) ||
        usuario.correo
          .toLowerCase()
          .includes(texto) ||
        usuario.rol
          .toLowerCase()
          .includes(texto);

      const coincideRol =
        filtroRol === "Todos" ||
        usuario.rol === filtroRol;

      return coincideBusqueda && coincideRol;
    }
  );

  const administradores = usuarios.filter(
    (usuario) =>
      usuario.rol === "Administrador"
  ).length;

  const colaboradores = usuarios.filter(
    (usuario) =>
      usuario.rol === "Colaborador"
  ).length;

  const usuariosActivos = usuarios.filter(
    (usuario) =>
      usuario.estado === "Activo"
  ).length;

  const cerrarSesion = () => {
    localStorage.removeItem("usuarioRiccati");
    navigate("/");
  };

  return (
    <div className="riccati-app">

      {/* SIDEBAR */}
      <aside className="riccati-sidebar">

        <div className="brand">

          <div className="brand-icon">
            R
          </div>

          <div>
            <h2>Riccati</h2>
            <span>PROJECT HUB</span>
          </div>

        </div>

        <div className="sidebar-section">

          <span className="sidebar-title">
            MENÚ PRINCIPAL
          </span>

          <button
            className="menu-item"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            <span className="menu-icon">
              ◈
            </span>

            Dashboard
          </button>

          <button
            className="menu-item"
            onClick={() =>
              navigate("/proyectos")
            }
          >
            <span className="menu-icon">
              ◉
            </span>

            Proyectos
          </button>

          <button
            className="menu-item"
            onClick={() =>
              navigate("/clientes")
            }
          >
            <span className="menu-icon">
              ◎
            </span>

            Clientes
          </button>

          <button
            className="menu-item"
            onClick={() =>
              navigate("/bitacora")
            }
          >
            <span className="menu-icon">
              ◫
            </span>

            Bitácora
          </button>

          <button
            className="menu-item"
            onClick={() =>
              navigate("/documentos")
            }
          >
            <span className="menu-icon">
              ▱
            </span>

            Documentos
          </button>

          <button
            className="menu-item"
            onClick={() =>
              navigate("/finanzas")
            }
          >
            <span className="menu-icon">
              ₡
            </span>

            Finanzas
          </button>

        </div>

        <div className="sidebar-section">

          <span className="sidebar-title">
            ADMINISTRACIÓN
          </span>

          <button
            className="menu-item active"
            onClick={() =>
              navigate("/usuarios")
            }
          >
            <span className="menu-icon">
              ◇
            </span>

            Usuarios
          </button>

        </div>

        {/* USUARIO ACTUAL */}
        <div className="sidebar-user">

          <div className="user-avatar">
            {usuarioActual?.nombre?.charAt(0) ||
              "A"}
          </div>

          <div className="sidebar-user-info">

            <strong>
              {usuarioActual?.nombre ||
                "Administrador"}
            </strong>

            <span>
              {usuarioActual?.rol ||
                "Administrador"}
            </span>

          </div>

          <button
            className="sidebar-logout"
            onClick={cerrarSesion}
            title="Cerrar sesión"
          >
            ↪
          </button>

        </div>

      </aside>

      {/* CONTENIDO */}
      <main className="riccati-main">

        {/* HEADER */}
        <header className="topbar">

          <div>

            <span className="page-label">
              MÓDULO M01
            </span>

            <h1>
              Usuarios
            </h1>

            <p>
              Administración de usuarios,
              roles y estados de acceso al
              Riccati Project Hub.
            </p>

          </div>

          <div className="topbar-actions">

            <div className="system-status">

              <span className="status-dot">
              </span>

              Acceso administrativo

            </div>

            <button className="notification-button">
              ◇
            </button>

          </div>

        </header>

        {/* ESTADÍSTICAS */}
        <section className="usuarios-stats">

          <div className="usuario-stat-card">

            <div className="usuario-stat-top">

              <span>
                TOTAL USUARIOS
              </span>

              <div className="usuario-stat-icon">
                ◎
              </div>

            </div>

            <strong>
              {usuarios.length}
            </strong>

            <small>
              Usuarios registrados
            </small>

          </div>

          <div className="usuario-stat-card">

            <div className="usuario-stat-top">

              <span>
                ADMINISTRADORES
              </span>

              <div className="usuario-stat-icon purple">
                ◇
              </div>

            </div>

            <strong>
              {administradores}
            </strong>

            <small className="purple-text">
              Acceso administrativo
            </small>

          </div>

          <div className="usuario-stat-card">

            <div className="usuario-stat-top">

              <span>
                COLABORADORES
              </span>

              <div className="usuario-stat-icon cyan">
                ◉
              </div>

            </div>

            <strong>
              {colaboradores}
            </strong>

            <small className="cyan-text">
              Usuarios operativos
            </small>

          </div>

          <div className="usuario-stat-card">

            <div className="usuario-stat-top">

              <span>
                USUARIOS ACTIVOS
              </span>

              <div className="usuario-stat-icon green">
                ✓
              </div>

            </div>

            <strong>
              {usuariosActivos}
            </strong>

            <small className="green-text">
              Acceso habilitado
            </small>

          </div>

        </section>

        {/* PANEL */}
        <section className="usuarios-panel">

          <div className="usuarios-panel-header">

            <div>

              <span className="panel-label">
                ADMINISTRACIÓN
              </span>

              <h3>
                Usuarios registrados
              </h3>

            </div>

            <div className="usuarios-actions">

              {/* BUSCADOR */}
              <div className="usuarios-search">

                <span>
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

              {/* FILTRO */}
              <select
                className="usuarios-filter"
                value={filtroRol}
                onChange={(e) =>
                  setFiltroRol(
                    e.target.value
                  )
                }
              >

                <option value="Todos">
                  Todos los roles
                </option>

                <option value="Administrador">
                  Administradores
                </option>

                <option value="Colaborador">
                  Colaboradores
                </option>

              </select>

              <button className="new-user-button">
                + Nuevo usuario
              </button>

            </div>

          </div>

          {/* TABLA */}
          <div className="usuarios-table-wrapper">

            <table className="usuarios-table">

              <thead>

                <tr>
                  <th>USUARIO</th>
                  <th>CORREO</th>
                  <th>ROL</th>
                  <th>ESTADO</th>
                  <th>ACCESO</th>
                  <th></th>
                </tr>

              </thead>

              <tbody>

                {usuariosFiltrados.map(
                  (usuario) => (

                    <tr key={usuario.id}>

                      {/* USUARIO */}
                      <td>

                        <div className="user-table-name">

                          <div className="user-table-avatar">
                            {usuario.nombre.charAt(0)}
                          </div>

                          <div>

                            <strong>
                              {usuario.nombre}
                            </strong>

                            <span>
                              USR-
                              {String(
                                usuario.id
                              ).padStart(
                                3,
                                "0"
                              )}
                            </span>

                          </div>

                        </div>

                      </td>

                      {/* CORREO */}
                      <td>

                        <span className="user-email">
                          {usuario.correo}
                        </span>

                      </td>

                      {/* ROL */}
                      <td>

                        <span
                          className={
                            usuario.rol ===
                            "Administrador"
                              ? "user-role role-admin"
                              : "user-role role-collaborator"
                          }
                        >

                          {usuario.rol}

                        </span>

                      </td>

                      {/* ESTADO */}
                      <td>

                        <span
                          className={
                            usuario.estado ===
                            "Activo"
                              ? "user-status user-active"
                              : "user-status user-inactive"
                          }
                        >

                          <span></span>

                          {usuario.estado}

                        </span>

                      </td>

                      {/* ACCESO */}
                      <td>

                        <div className="access-status">

                          <span className="access-icon">
                            ✓
                          </span>

                          Habilitado

                        </div>

                      </td>

                      {/* OPCIONES */}
                      <td>

                        <button className="user-options">
                          ···
                        </button>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

          {usuariosFiltrados.length === 0 && (

            <div className="usuarios-empty">

              <div>
                ◇
              </div>

              <strong>
                No se encontraron usuarios
              </strong>

              <span>
                Intenta cambiar la búsqueda
                o el filtro seleccionado.
              </span>

            </div>

          )}

          <div className="usuarios-footer">

            <span>
              Mostrando{" "}
              {usuariosFiltrados.length} de{" "}
              {usuarios.length} usuarios
            </span>

            <span>
              Control de acceso · M01
            </span>

          </div>

        </section>

        {/* AVISO SEGURIDAD */}
        <section className="security-panel">

          <div className="security-panel-icon">
            ◇
          </div>

          <div>

            <span>
              SEGURIDAD DEL SISTEMA
            </span>

            <strong>
              Gestión de acceso protegida
            </strong>

            <p>
              Las credenciales de los usuarios
              no se muestran desde esta interfaz.
              Esta sección está disponible
              únicamente para administradores.
            </p>

          </div>

        </section>

      </main>

    </div>
  );
}

export default Usuarios;