import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Dashboard.css";
import "./Bitacora.css";

function Bitacora() {
  const [actividades, setActividades] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("Todos");

  const navigate = useNavigate();

  const usuario = JSON.parse(
    localStorage.getItem("usuarioRiccati")
  );

  useEffect(() => {
    fetch("http://localhost:3000/api/actividades")
      .then((respuesta) => respuesta.json())
      .then((datos) => setActividades(datos))
      .catch((error) =>
        console.error(
          "Error al cargar actividades:",
          error
        )
      );
  }, []);

  const actividadesFiltradas = actividades.filter(
    (actividad) => {
      const texto = busqueda.toLowerCase();

      const coincideBusqueda =
        actividad.projectId
          .toLowerCase()
          .includes(texto) ||
        actividad.usuario
          .toLowerCase()
          .includes(texto) ||
        actividad.descripcion
          .toLowerCase()
          .includes(texto) ||
        actividad.tipo
          .toLowerCase()
          .includes(texto);

      const coincideTipo =
        filtroTipo === "Todos" ||
        actividad.tipo === filtroTipo;

      return coincideBusqueda && coincideTipo;
    }
  );

  const horasTotales = actividades.reduce(
    (total, actividad) =>
      total + Number(actividad.horas || 0),
    0
  );

  const proyectosUnicos = new Set(
    actividades.map(
      (actividad) => actividad.projectId
    )
  ).size;

  const usuariosUnicos = new Set(
    actividades.map(
      (actividad) => actividad.usuario
    )
  ).size;

  const tiposDisponibles = [
    ...new Set(
      actividades.map(
        (actividad) => actividad.tipo
      )
    ),
  ];

  const obtenerClaseTipo = (tipo) => {
    switch (tipo) {
      case "Avance":
        return "activity-type type-progress";

      case "Comentario":
        return "activity-type type-comment";

      case "Actividad":
        return "activity-type type-activity";

      case "Seguimiento":
        return "activity-type type-follow";

      default:
        return "activity-type";
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) {
      return "-";
    }

    const partes = fecha.split(" ");

    const fechaParte = partes[0];
    const horaParte = partes[1];

    const [anio, mes, dia] =
      fechaParte.split("-");

    return {
      fecha: `${dia}/${mes}/${anio}`,
      hora: horaParte || "",
    };
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
            className="menu-item active"
            onClick={() =>
              navigate("/bitacora")
            }
          >
            <span className="menu-icon">
              ◫
            </span>

            Bitácora
          </button>

          <button className="menu-item">

            <span className="menu-icon">
              ▱
            </span>

            Documentos

          </button>

          <button className="menu-item">

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

          <button className="menu-item">

            <span className="menu-icon">
              ◇
            </span>

            Usuarios

          </button>

        </div>

        {/* USUARIO */}
        <div className="sidebar-user">

          <div className="user-avatar">

            {usuario?.nombre?.charAt(0) ||
              "A"}

          </div>

          <div>

            <strong>
              {usuario?.nombre ||
                "Administrador"}
            </strong>

            <span>
              {usuario?.rol ||
                "Administrador"}
            </span>

          </div>

        </div>

      </aside>

      {/* CONTENIDO */}
      <main className="riccati-main">

        {/* HEADER */}
        <header className="topbar">

          <div>

            <span className="page-label">
              MÓDULO M04
            </span>

            <h1>
              Bitácora
            </h1>

            <p>
              Seguimiento cronológico de
              actividades, avances y eventos
              registrados en los proyectos.
            </p>

          </div>

          <div className="topbar-actions">

            <div className="system-status">

              <span className="status-dot">
              </span>

              {actividades.length} registros

            </div>

            <button className="notification-button">
              ◫
            </button>

          </div>

        </header>

        {/* ESTADÍSTICAS */}
        <section className="bitacora-stats">

          <div className="bitacora-stat-card">

            <div className="bitacora-stat-top">

              <span>
                REGISTROS
              </span>

              <div className="bitacora-stat-icon">
                ◫
              </div>

            </div>

            <strong>
              {actividades.length}
            </strong>

            <small>
              Actividades registradas
            </small>

          </div>

          <div className="bitacora-stat-card">

            <div className="bitacora-stat-top">

              <span>
                HORAS REGISTRADAS
              </span>

              <div className="bitacora-stat-icon cyan">
                ◷
              </div>

            </div>

            <strong>
              {horasTotales}
            </strong>

            <small className="cyan-text">
              Horas acumuladas
            </small>

          </div>

          <div className="bitacora-stat-card">

            <div className="bitacora-stat-top">

              <span>
                PROYECTOS
              </span>

              <div className="bitacora-stat-icon purple">
                ◈
              </div>

            </div>

            <strong>
              {proyectosUnicos}
            </strong>

            <small>
              Con movimientos
            </small>

          </div>

          <div className="bitacora-stat-card">

            <div className="bitacora-stat-top">

              <span>
                USUARIOS
              </span>

              <div className="bitacora-stat-icon green">
                ◎
              </div>

            </div>

            <strong>
              {usuariosUnicos}
            </strong>

            <small className="green-text">
              Participantes
            </small>

          </div>

        </section>

        {/* PANEL */}
        <section className="bitacora-panel">

          <div className="bitacora-panel-header">

            <div>

              <span className="panel-label">
                HISTORIAL
              </span>

              <h3>
                Registro de actividades
              </h3>

            </div>

            <div className="bitacora-actions">

              {/* BUSCADOR */}
              <div className="bitacora-search">

                <span>
                  ⌕
                </span>

                <input
                  type="text"
                  placeholder="Buscar actividad..."
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
                className="bitacora-filter"
                value={filtroTipo}
                onChange={(e) =>
                  setFiltroTipo(
                    e.target.value
                  )
                }
              >

                <option value="Todos">
                  Todos los tipos
                </option>

                {tiposDisponibles.map(
                  (tipo) => (
                    <option
                      key={tipo}
                      value={tipo}
                    >
                      {tipo}
                    </option>
                  )
                )}

              </select>

              <button className="new-activity-button">
                + Nueva actividad
              </button>

            </div>

          </div>

          {/* TABLA */}
          <div className="bitacora-table-wrapper">

            <table className="bitacora-table">

              <thead>

                <tr>
                  <th>PROYECTO</th>
                  <th>TIPO</th>
                  <th>DESCRIPCIÓN</th>
                  <th>USUARIO</th>
                  <th>HORAS</th>
                  <th>FECHA</th>
                  <th></th>
                </tr>

              </thead>

              <tbody>

                {actividadesFiltradas.map(
                  (actividad) => {

                    const fecha =
                      formatearFecha(
                        actividad.fecha
                      );

                    return (

                      <tr
                        key={actividad.id}
                      >

                        {/* PROYECTO */}
                        <td>

                          <div className="bitacora-project">

                            <div className="bitacora-project-icon">
                              ◈
                            </div>

                            <div>

                              <strong>
                                {
                                  actividad.projectId
                                }
                              </strong>

                              <span>
                                Proyecto
                              </span>

                            </div>

                          </div>

                        </td>

                        {/* TIPO */}
                        <td>

                          <span
                            className={obtenerClaseTipo(
                              actividad.tipo
                            )}
                          >
                            <span></span>

                            {actividad.tipo}

                          </span>

                        </td>

                        {/* DESCRIPCIÓN */}
                        <td>

                          <div className="activity-description">

                            {
                              actividad.descripcion
                            }

                          </div>

                        </td>

                        {/* USUARIO */}
                        <td>

                          <div className="activity-user">

                            <div className="activity-avatar">

                              {actividad.usuario.charAt(
                                0
                              )}

                            </div>

                            <span>

                              {
                                actividad.usuario
                              }

                            </span>

                          </div>

                        </td>

                        {/* HORAS */}
                        <td>

                          <span className="activity-hours">

                            {
                              actividad.horas
                            }{" "}
                            h

                          </span>

                        </td>

                        {/* FECHA */}
                        <td>

                          <div className="activity-date">

                            <strong>
                              {fecha.fecha}
                            </strong>

                            <span>
                              {fecha.hora}
                            </span>

                          </div>

                        </td>

                        {/* OPCIONES */}
                        <td>

                          <button className="activity-options">
                            ···
                          </button>

                        </td>

                      </tr>

                    );
                  }
                )}

              </tbody>

            </table>

          </div>

          {/* SIN RESULTADOS */}
          {actividadesFiltradas.length ===
            0 && (

            <div className="bitacora-empty">

              <div>
                ◫
              </div>

              <strong>
                No se encontraron actividades
              </strong>

              <span>
                Intenta modificar la búsqueda
                o los filtros.
              </span>

            </div>

          )}

          {/* FOOTER */}
          <div className="bitacora-footer">

            <span>

              Mostrando{" "}
              {actividadesFiltradas.length} de{" "}
              {actividades.length} registros

            </span>

            <span>
              Trazabilidad de proyectos
            </span>

          </div>

        </section>

      </main>

    </div>
  );
}

export default Bitacora;