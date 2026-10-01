function StatCard({
  etiqueta,
  valor,
  icono,
  pie,
  clasePie = "",
  className = "",
}) {
  return (
    <div
      className={`riccati-stat-card ${className}`}
    >

      <div className="riccati-stat-header">

        <span className="riccati-stat-label">
          {etiqueta}
        </span>

        <div className="riccati-stat-icon">
          {icono}
        </div>

      </div>

      <strong className="riccati-stat-number">
        {valor}
      </strong>

      <div
        className={`riccati-stat-footer ${clasePie}`}
      >
        {pie}
      </div>

    </div>
  );
}

export default StatCard;