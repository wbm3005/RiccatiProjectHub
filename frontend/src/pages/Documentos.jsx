import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Dashboard.css";
import "./Documentos.css";

function Documentos() {
  const [documentos, setDocumentos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroAlmacenamiento, setFiltroAlmacenamiento] =
    useState("Todos");

  const navigate = useNavigate();

  const usuario = JSON.parse(
    localStorage.getItem("usuarioRiccati")
  );

  useEffect(() => {
    fetch("http://localhost:3000/api/documentos")
      .then((respuesta) => respuesta.json())
      .then((datos) => setDocumentos(datos))
      .catch((error) =>
        console.error(
          "Error al cargar documentos:",
          error
        )
      );
  }, []);

  const documentosFiltrados = documentos.filter(
    (documento) => {
      const texto = busqueda.toLowerCase();

      const coincideBusqueda =
        documento.nombre.toLowerCase().includes(texto) ||
        documento.projectId.toLowerCase().includes(texto) ||
        documento.tipo.toLowerCase().includes(texto) ||
        documento.formato.toLowerCase().includes(texto) ||
        documento.usuario.toLowerCase().includes(texto);

      const coincideAlmacenamiento =
        filtroAlmacenamiento === "Todos" ||
        documento.almacenamiento ===
          filtroAlmacenamiento;

      return (
        coincideBusqueda &&
        coincideAlmacenamiento
      );
    }
  );

  const documentosLocales = documentos.filter(
    (documento) =>
      documento.almacenamiento === "Local"
  ).length;

  const documentosExternos = documentos.filter(
    (documento) =>
      documento.almacenamiento === "Externo"
  ).length;

  const formatosUnicos = new Set(
    documentos.map(
      (documento) => documento.formato
    )
  ).size;

  const obtenerClaseFormato = (formato) => {
    switch (formato) {
      case "PDF":
        return "document-format format-pdf";

      case "DOCX":
        return "document-format format-docx";

      case "XLSX":
        return "document-format format-xlsx";

      case "JPG":
      case "JPEG":
      case "PNG":
        return "document-format format-image";

      case "CAD":
        return "document-format format-cad";

      default:
        return "document-format";
    }
  };

  const obtenerIcono = (formato) => {
    switch (formato) {
      case "PDF":
        return "PDF";

      case "DOCX":
        return "W";

      case "XLSX":
        return "X";

      case "CAD":
        return "CAD";

      case "JPG":
      case "JPEG":
      case "PNG":
        return "IMG";

      default:
        return "DOC";
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) {
      return "-";
    }

    const [anio, mes, dia] =
      fecha.split("-");

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
            className="menu-item active"
            onClick={() =>
              navigate("/documentos")
            }
          >
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
            {usuario?.nombre?.charAt(0) || "A"}
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
              MÓDULO M05
            </span>

            <h1>
              Documentos
            </h1>

            <p>
              Administración de archivos,
              versiones y enlaces asociados
              a los proyectos.
            </p>

          </div>

          <div className="topbar-actions">

            <div className="system-status">

              <span className="status-dot"></span>

              {documentos.length} documentos

            </div>

            <button className="notification-button">
              ▱
            </button>

          </div>

        </header>

        {/* ESTADÍSTICAS */}
        <section className="documentos-stats">

          <div className="document-stat-card">

            <div className="document-stat-top">

              <span>
                TOTAL DOCUMENTOS
              </span>

              <div className="document-stat-icon">
                ▱
              </div>

            </div>

            <strong>
              {documentos.length}
            </strong>

            <small>
              Archivos registrados
            </small>

          </div>

          <div className="document-stat-card">

            <div className="document-stat-top">

              <span>
                ALMACENAMIENTO LOCAL
              </span>

              <div className="document-stat-icon green">
                ↓
              </div>

            </div>

            <strong>
              {documentosLocales}
            </strong>

            <small className="green-text">
              Archivos internos
            </small>

          </div>

          <div className="document-stat-card">

            <div className="document-stat-top">

              <span>
                ENLACES EXTERNOS
              </span>

              <div className="document-stat-icon purple">
                ↗
              </div>

            </div>

            <strong>
              {documentosExternos}
            </strong>

            <small>
              Recursos externos
            </small>

          </div>

          <div className="document-stat-card">

            <div className="document-stat-top">

              <span>
                FORMATOS
              </span>

              <div className="document-stat-icon orange">
                #
              </div>

            </div>

            <strong>
              {formatosUnicos}
            </strong>

            <small className="orange-text">
              Tipos diferentes
            </small>

          </div>

        </section>

        {/* PANEL */}
        <section className="documentos-panel">

          <div className="documentos-panel-header">

            <div>

              <span className="panel-label">
                REPOSITORIO
              </span>

              <h3>
                Documentos registrados
              </h3>

            </div>

            <div className="documentos-actions">

              <div className="documentos-search">

                <span>⌕</span>

                <input
                  type="text"
                  placeholder="Buscar documento..."
                  value={busqueda}
                  onChange={(e) =>
                    setBusqueda(
                      e.target.value
                    )
                  }
                />

              </div>

              <select
                className="documentos-filter"
                value={filtroAlmacenamiento}
                onChange={(e) =>
                  setFiltroAlmacenamiento(
                    e.target.value
                  )
                }
              >

                <option value="Todos">
                  Todos
                </option>

                <option value="Local">
                  Local
                </option>

                <option value="Externo">
                  Externo
                </option>

              </select>

              <button className="new-document-button">
                + Nuevo documento
              </button>

            </div>

          </div>

          {/* TABLA */}
          <div className="documentos-table-wrapper">

            <table className="documentos-table">

              <thead>

                <tr>
                  <th>DOCUMENTO</th>
                  <th>PROYECTO</th>
                  <th>TIPO</th>
                  <th>FORMATO</th>
                  <th>VERSIÓN</th>
                  <th>ALMACENAMIENTO</th>
                  <th>USUARIO</th>
                  <th>FECHA</th>
                  <th></th>
                </tr>

              </thead>

              <tbody>

                {documentosFiltrados.map(
                  (documento) => (

                    <tr key={documento.id}>

                      {/* DOCUMENTO */}
                      <td>

                        <div className="document-name">

                          <div
                            className={obtenerClaseFormato(
                              documento.formato
                            )}
                          >
                            {obtenerIcono(
                              documento.formato
                            )}
                          </div>

                          <div>

                            <strong>
                              {documento.nombre}
                            </strong>

                            <span>
                              DOC-
                              {String(
                                documento.id
                              ).padStart(
                                3,
                                "0"
                              )}
                            </span>

                          </div>

                        </div>

                      </td>

                      {/* PROYECTO */}
                      <td>

                        <span className="document-project">
                          {documento.projectId}
                        </span>

                      </td>

                      {/* TIPO */}
                      <td className="document-type">
                        {documento.tipo}
                      </td>

                      {/* FORMATO */}
                      <td>

                        <span className="format-label">
                          {documento.formato}
                        </span>

                      </td>

                      {/* VERSION */}
                      <td>

                        <span className="version-label">
                          v{documento.version}
                        </span>

                      </td>

                      {/* ALMACENAMIENTO */}
                      <td>

                        <span
                          className={
                            documento.almacenamiento ===
                            "Local"
                              ? "storage-badge storage-local"
                              : "storage-badge storage-external"
                          }
                        >

                          <span></span>

                          {
                            documento.almacenamiento
                          }

                        </span>

                      </td>

                      {/* USUARIO */}
                      <td>

                        <div className="document-user">

                          <div className="document-user-avatar">

                            {documento.usuario.charAt(
                              0
                            )}

                          </div>

                          <span>
                            {documento.usuario}
                          </span>

                        </div>

                      </td>

                      {/* FECHA */}
                      <td>

                        <span className="document-date">
                          {formatearFecha(
                            documento.fecha
                          )}
                        </span>

                      </td>

                      {/* OPCIONES */}
                      <td>

                        <button className="document-options">
                          ···
                        </button>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

          {documentosFiltrados.length === 0 && (

            <div className="documentos-empty">

              <div>
                ▱
              </div>

              <strong>
                No se encontraron documentos
              </strong>

              <span>
                Intenta modificar la búsqueda
                o los filtros.
              </span>

            </div>

          )}

          <div className="documentos-footer">

            <span>
              Mostrando{" "}
              {documentosFiltrados.length} de{" "}
              {documentos.length} documentos
            </span>

            <span>
              Gestión documental · M05
            </span>

          </div>

        </section>

      </main>

    </div>
  );
}

export default Documentos;