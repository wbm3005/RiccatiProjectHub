import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Dashboard.css";
import "./Proyectos.css";

function Proyectos() {
  const [proyectos, setProyectos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");

  const navigate = useNavigate();

  const usuario = JSON.parse(
    localStorage.getItem("usuarioRiccati")
  );

  useEffect(() => {
    fetch("http://localhost:3000/api/proyectos")
      .then((respuesta) => respuesta.json())
      .then((datos) => setProyectos(datos))
      .catch((error) =>
        console.error("Error al cargar proyectos:", error)
      );
  }, []);

  const proyectosFiltrados = proyectos.filter((proyecto) => {
    const texto = busqueda.toLowerCase();

    const coincideBusqueda =
      proyecto.nombre.toLowerCase().includes(texto) ||
      proyecto.projectId.toLowerCase().includes(texto) ||
      proyecto.cliente.toLowerCase().includes(texto) ||
      proyecto.responsable.toLowerCase().includes(texto);

    const coincideEstado =
      filtroEstado === "Todos" ||
      proyecto.estado === filtroEstado;

    return coincideBusqueda && coincideEstado;
  });

  const cantidadEnCurso = proyectos.filter(
    (proyecto) => proyecto.estado === "En curso"
  ).length;

  const cantidadRegistrados = proyectos.filter(
    (proyecto) => proyecto.estado === "Registrado"
  ).length;

  const cantidadSuspendidos = proyectos.filter(
    (proyecto) => proyecto.estado === "Suspendido"
  ).length;

  const obtenerClaseEstado = (estado) => {
    switch (estado) {
      case "En curso":
        return "project-status project-status-progress";

      case "Registrado":
        return "project-status project-status-registered";

      case "Suspendido":
        return "project-status project-status-paused";

      case "Finalizado":
        return "project-status project-status-finished";

      case "Archivado":
        return "project-status project-status-archived";

      default:
        return "project-status";
    }
  };

  const obtenerClasePrioridad = (prioridad) => {
    switch (prioridad) {
      case "Alta":
        return "priority-badge priority-high";

      case "Media":
        return "priority-badge priority-medium";

      case "Baja":
        return "priority-badge priority-low";

      default:
        return "priority-badge";
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) {
      return "-";
    }

    const [anio, mes, dia] = fecha.split("-");

    return `${dia}/${mes}/${anio}`;
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
            onClick={() => navigate("/dashboard")}
          >
            <span className="menu-icon">◈</span>
            Dashboard
          </button>

          <button
            className="menu-item active"
            onClick={() => navigate("/proyectos")}
          >
            <span className="menu-icon">◉</span>
            Proyectos
          </button>

          <button
            className="menu-item"
            onClick={() => navigate("/clientes")}
          >
            <span className="menu-icon">◎</span>
            Clientes
          </button>

          <button className="menu-item">
            <span className="menu-icon">◫</span>
            Bitácora
          </button>

          <button className="menu-item">
            <span className="menu-icon">▱</span>
            Documentos
          </button>

          <button className="menu-item">
            <span className="menu-icon">₡</span>
            Finanzas
          </button>

        </div>

        <div className="sidebar-section">

          <span className="sidebar-title">
            ADMINISTRACIÓN
          </span>

          <button className="menu-item">
            <span className="menu-icon">◇</span>
            Usuarios
          </button>

        </div>

        <div className="sidebar-user">

          <div className="user-avatar">
            {usuario?.nombre?.charAt(0) || "A"}
          </div>

          <div>

            <strong>
              {usuario?.nombre || "Administrador"}
            </strong>

            <span>
              {usuario?.rol || "Administrador"}
            </span>

          </div>

        </div>

      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="riccati-main">

        {/* HEADER */}
        <header className="topbar">

          <div>

            <span className="page-label">
              MÓDULO M03
            </span>

            <h1>
              Proyectos
            </h1>

            <p>
              Gestión y seguimiento general de los proyectos
              arquitectónicos de Riccati.
            </p>

          </div>

          <div className="topbar-actions">

            <div className="system-status">
              <span className="status-dot"></span>

              {proyectos.length} proyectos
            </div>

            <button className="notification-button">
              ◉
            </button>

          </div>

        </header>

        {/* ESTADÍSTICAS */}
        <section className="proyectos-stats">

          <div className="proyecto-stat-card">

            <div className="proyecto-stat-header">

              <span>
                TOTAL PROYECTOS
              </span>

              <div className="proyecto-stat-icon">
                ◈
              </div>

            </div>

            <strong>
              {proyectos.length}
            </strong>

            <small>
              Registro general
            </small>

          </div>

          <div className="proyecto-stat-card">

            <div className="proyecto-stat-header">

              <span>
                EN CURSO
              </span>

              <div className="proyecto-stat-icon green">
                ●
              </div>

            </div>

            <strong>
              {cantidadEnCurso}
            </strong>

            <small className="green-text">
              Proyectos activos
            </small>

          </div>

          <div className="proyecto-stat-card">

            <div className="proyecto-stat-header">

              <span>
                REGISTRADOS
              </span>

              <div className="proyecto-stat-icon">
                +
              </div>

            </div>

            <strong>
              {cantidadRegistrados}
            </strong>

            <small>
              Pendientes de inicio
            </small>

          </div>

          <div className="proyecto-stat-card">

            <div className="proyecto-stat-header">

              <span>
                SUSPENDIDOS
              </span>

              <div className="proyecto-stat-icon orange">
                !
              </div>

            </div>

            <strong>
              {cantidadSuspendidos}
            </strong>

            <small className="orange-text">
              Requieren seguimiento
            </small>

          </div>

        </section>

        {/* PANEL PRINCIPAL */}
        <section className="proyectos-panel">

          <div className="proyectos-panel-header">

            <div>

              <span className="panel-label">
                PORTAFOLIO
              </span>

              <h3>
                Proyectos registrados
              </h3>

            </div>

            <div className="proyectos-actions">

              {/* BUSCADOR */}
              <div className="proyectos-search">

                <span>⌕</span>

                <input
                  type="text"
                  placeholder="Buscar proyecto..."
                  value={busqueda}
                  onChange={(e) =>
                    setBusqueda(e.target.value)
                  }
                />

              </div>

              {/* FILTRO */}
              <select
                className="proyectos-filter"
                value={filtroEstado}
                onChange={(e) =>
                  setFiltroEstado(e.target.value)
                }
              >
                <option value="Todos">
                  Todos los estados
                </option>

                <option value="Registrado">
                  Registrado
                </option>

                <option value="En curso">
                  En curso
                </option>

                <option value="Suspendido">
                  Suspendido
                </option>

                <option value="Finalizado">
                  Finalizado
                </option>

                <option value="Archivado">
                  Archivado
                </option>

              </select>

              <button className="new-project-button">
                + Nuevo proyecto
              </button>

            </div>

          </div>

          {/* TABLA */}
          <div className="proyectos-table-wrapper">

            <table className="proyectos-table">

              <thead>

                <tr>
                  <th>PROYECTO</th>
                  <th>CLIENTE</th>
                  <th>RESPONSABLE</th>
                  <th>PRIORIDAD</th>
                  <th>ESTADO</th>
                  <th>COMPROMISO</th>
                  <th></th>
                </tr>

              </thead>

              <tbody>

                {proyectosFiltrados.map((proyecto) => (

                  <tr key={proyecto.id}>

                    {/* PROYECTO */}
                    <td>

                      <div className="project-table-name">

                        <div className="project-table-icon">
                          {proyecto.projectId
                            .replace("PRY-", "")}
                        </div>

                        <div>

                          <strong>
                            {proyecto.nombre}
                          </strong>

                          <span>
                            {proyecto.projectId}
                          </span>

                        </div>

                      </div>

                    </td>

                    {/* CLIENTE */}
                    <td className="project-client">
                      {proyecto.cliente}
                    </td>

                    {/* RESPONSABLE */}
                    <td>

                      <div className="responsable-container">

                        <div className="responsable-avatar">
                          {proyecto.responsable.charAt(0)}
                        </div>

                        <span>
                          {proyecto.responsable}
                        </span>

                      </div>

                    </td>

                    {/* PRIORIDAD */}
                    <td>

                      <span
                        className={obtenerClasePrioridad(
                          proyecto.prioridad
                        )}
                      >
                        {proyecto.prioridad}
                      </span>

                    </td>

                    {/* ESTADO */}
                    <td>

                      <span
                        className={obtenerClaseEstado(
                          proyecto.estado
                        )}
                      >
                        <span></span>

                        {proyecto.estado}
                      </span>

                    </td>

                    {/* FECHA */}
                    <td>

                      <div className="project-date">

                        <strong>
                          {formatearFecha(
                            proyecto.fechaCompromiso
                          )}
                        </strong>

                        <span>
                          Inicio{" "}
                          {formatearFecha(
                            proyecto.fechaInicio
                          )}
                        </span>

                      </div>

                    </td>

                    {/* OPCIONES */}
                    <td>

                      <button className="project-options">
                        ···
                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

          {/* SIN RESULTADOS */}
          {proyectosFiltrados.length === 0 && (

            <div className="projects-empty">

              <div>
                ◌
              </div>

              <strong>
                No se encontraron proyectos
              </strong>

              <span>
                Intenta modificar los filtros de búsqueda.
              </span>

            </div>

          )}

          {/* FOOTER */}
          <div className="proyectos-table-footer">

            <span>
              Mostrando{" "}
              {proyectosFiltrados.length} de{" "}
              {proyectos.length} proyectos
            </span>

            <span>
              Riccati Project Hub
            </span>

          </div>

        </section>

      </main>

    </div>
  );
}

export default Proyectos;