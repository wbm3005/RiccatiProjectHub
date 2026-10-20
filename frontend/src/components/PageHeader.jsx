function PageHeader({
  modulo,
  titulo,
  descripcion,
  estado = "Sistema operativo",
  acciones = null,
}) {
  return (
    <header className="riccati-topbar">

      <div className="animate-up">

        <span className="riccati-page-label">
          {modulo}
        </span>

        <h1>
          {titulo}
        </h1>

        <p>
          {descripcion}
        </p>

      </div>

      <div className="riccati-topbar-actions animate-right">

        {acciones}

        <div className="riccati-status">

          <span className="riccati-status-dot">
          </span>

          {estado}

        </div>

      </div>

    </header>
  );
}

export default PageHeader;