import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Clientes.css";
import "./Dashboard.css";

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  const navigate = useNavigate();

  const usuario = JSON.parse(
    localStorage.getItem("usuarioRiccati")
  );

  useEffect(() => {
    fetch("http://localhost:3000/api/clientes")
      .then((respuesta) => respuesta.json())
      .then((datos) => setClientes(datos))
      .catch((error) =>
        console.error("Error al cargar clientes:", error)
      );
  }, []);

  const clientesFiltrados = clientes.filter((cliente) => {
    const texto = busqueda.toLowerCase();

    return (
      cliente.nombre.toLowerCase().includes(texto) ||
      cliente.contacto.toLowerCase().includes(texto) ||
      cliente.correo.toLowerCase().includes(texto) ||
      cliente.telefono.toLowerCase().includes(texto)
    );
  });

  return (
    <div className="riccati-app">

      {/* SIDEBAR */}
      <aside className="riccati-sidebar">

        <div className="brand">
          <div className="brand-icon">R</div>

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

          <button className="menu-item">
            <span className="menu-icon">◉</span>
            Proyectos
          </button>

          <button
            className="menu-item active"
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

        <header className="topbar">

          <div>
            <span className="page-label">
              MÓDULO M02
            </span>

            <h1>Clientes</h1>

            <p>
              Consulta y gestión de los clientes
              registrados en Riccati Project Hub.
            </p>
          </div>

          <div className="topbar-actions">

            <div className="system-status">
              <span className="status-dot"></span>
              {clientes.length} registros
            </div>

            <button className="notification-button">
              ◎
            </button>

          </div>

        </header>

        {/* RESUMEN */}
        <section className="clientes-stats">

          <div className="cliente-stat-card">
            <span>TOTAL CLIENTES</span>

            <strong>
              {clientes.length}
            </strong>
          </div>

          <div className="cliente-stat-card">
            <span>CLIENTES ACTIVOS</span>

            <strong>
              {
                clientes.filter(
                  (cliente) =>
                    cliente.estado === "Activo"
                ).length
              }
            </strong>
          </div>

          <div className="cliente-stat-card">
            <span>CLIENTES INACTIVOS</span>

            <strong>
              {
                clientes.filter(
                  (cliente) =>
                    cliente.estado === "Inactivo"
                ).length
              }
            </strong>
          </div>

        </section>

        {/* PANEL */}
        <section className="clientes-panel">

          <div className="clientes-panel-header">

            <div>
              <span className="panel-label">
                DIRECTORIO
              </span>

              <h3>
                Clientes registrados
              </h3>
            </div>

            <div className="clientes-actions">

              <div className="search-container">
                <span>⌕</span>

                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={busqueda}
                  onChange={(e) =>
                    setBusqueda(e.target.value)
                  }
                />
              </div>

              <button className="new-client-button">
                + Nuevo cliente
              </button>

            </div>

          </div>

          {/* TABLA */}
          <div className="clientes-table-wrapper">

            <table className="clientes-table">

              <thead>
                <tr>
                  <th>CLIENTE</th>
                  <th>CONTACTO</th>
                  <th>CORREO</th>
                  <th>TELÉFONO</th>
                  <th>ESTADO</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>

                {clientesFiltrados.map((cliente) => (

                  <tr key={cliente.id}>

                    <td>
                      <div className="cliente-name">

                        <div className="cliente-avatar">
                          {cliente.nombre.charAt(0)}
                        </div>

                        <div>
                          <strong>
                            {cliente.nombre}
                          </strong>

                          <span>
                            CLI-
                            {String(cliente.id).padStart(
                              3,
                              "0"
                            )}
                          </span>
                        </div>

                      </div>
                    </td>

                    <td>
                      {cliente.contacto}
                    </td>

                    <td className="cliente-email">
                      {cliente.correo}
                    </td>

                    <td>
                      {cliente.telefono}
                    </td>

                    <td>
                      <span
                        className={
                          cliente.estado === "Activo"
                            ? "cliente-status active-status"
                            : "cliente-status inactive-status"
                        }
                      >
                        <span></span>
                        {cliente.estado}
                      </span>
                    </td>

                    <td>
                      <button className="client-options">
                        ···
                      </button>
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

          <div className="clientes-table-footer">

            <span>
              Mostrando {clientesFiltrados.length} de{" "}
              {clientes.length} clientes
            </span>

          </div>

        </section>

      </main>

    </div>
  );
}

export default Clientes;