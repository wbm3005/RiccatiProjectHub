function ProyectoFichaModal({
  mostrar,
  proyecto,
  responsablesProyecto,

  estados,
  responsables,

  estadoSeleccionado,
  responsableSeleccionado,

  cargando,
  actualizando,
  error,

  onCambiarEstado,
  onCambiarResponsable,

  onChangeEstado,
  onChangeResponsable,

  onEditar,
  onClose,
}) {
  if (!mostrar) {
    return null;
  }

  return (
    <div
      className="riccati-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="riccati-modal"
        style={{
          maxWidth: "850px",
        }}
      >
        {/* HEADER */}

        <div className="riccati-modal-header">
          <span className="riccati-page-label">
            M03 · FICHA DEL PROYECTO
          </span>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "15px",
            }}
          >
            <div>
              <h3>
                {proyecto?.nombre ||
                  "Proyecto"}
              </h3>

              <p
                style={{
                  marginTop: "5px",
                  color: "#60788d",
                  fontSize: "8px",
                }}
              >
                {proyecto?.codigo ||
                  "Cargando ProjectID..."}
              </p>
            </div>

            {proyecto && (
              <EstadoBadge
                estado={proyecto.estado}
              />
            )}
          </div>
        </div>

        {/* BODY */}

        <div className="riccati-modal-body">

          {cargando && (
            <div className="riccati-loader-wrapper">

              <div className="riccati-loader">
              </div>

              <span className="riccati-loader-text">
                Cargando proyecto...
              </span>

            </div>
          )}

          {error && !cargando && (
            <div className="login-error">
              {error}
            </div>
          )}

          {!cargando &&
            !error &&
            proyecto && (
              <>

                {/* INFORMACIÓN GENERAL */}

                <span className="riccati-panel-label">
                  INFORMACIÓN GENERAL
                </span>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(2, minmax(0, 1fr))",
                    gap: "12px",
                    marginTop: "14px",
                  }}
                >
                  <DatoProyecto
                    titulo="ProjectID"
                    valor={proyecto.codigo}
                    destacado
                  />

                  <DatoProyecto
                    titulo="Cliente"
                    valor={
                      proyecto.cliente ||
                      "No asignado"
                    }
                  />

                  <DatoProyecto
                    titulo="Contacto principal"
                    valor={
                      proyecto.contacto_principal ||
                      "No asignado"
                    }
                  />

                  <DatoProyecto
                    titulo="Prioridad"
                    valor={
                      proyecto.prioridad ||
                      "No asignada"
                    }
                    prioridad
                  />
                </div>

                <div
                  style={{
                    marginTop: "12px",
                  }}
                >
                  <DatoProyecto
                    titulo="Descripción"
                    valor={
                      proyecto.descripcion ||
                      "Sin descripción"
                    }
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(2, minmax(0, 1fr))",
                    gap: "12px",
                    marginTop: "12px",
                  }}
                >
                  <DatoProyecto
                    titulo="Contrato"
                    valor={
                      proyecto.contrato ||
                      "No registrado"
                    }
                  />

                  <DatoProyecto
                    titulo="Estado"
                    valor={
                      proyecto.estado
                    }
                    estado
                  />
                </div>

                <div
                  style={{
                    marginTop: "12px",
                  }}
                >
                  <DatoProyecto
                    titulo="Observaciones"
                    valor={
                      proyecto.observaciones ||
                      "Sin observaciones"
                    }
                  />
                </div>

                {/* PLANIFICACIÓN */}

                <div
                  style={{
                    marginTop: "24px",
                    paddingTop: "18px",
                    borderTop:
                      "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <span className="riccati-panel-label">
                    PLANIFICACIÓN
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(3, minmax(0, 1fr))",
                    gap: "12px",
                    marginTop: "14px",
                  }}
                >
                  <DatoProyecto
                    titulo="Fecha de inicio"
                    valor={formatearFecha(
                      proyecto.fecha_inicio
                    )}
                  />

                  <DatoProyecto
                    titulo="Fecha de compromiso"
                    valor={formatearFecha(
                      proyecto.fecha_compromiso
                    )}
                  />

                  <DatoProyecto
                    titulo="Fecha de cierre"
                    valor={formatearFecha(
                      proyecto.fecha_finalizacion
                    )}
                  />
                </div>

                {/* RESPONSABLE */}

                <div
                  style={{
                    marginTop: "24px",
                    paddingTop: "18px",
                    borderTop:
                      "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <span className="riccati-panel-label">
                    RESPONSABLE
                  </span>
                </div>

                <div
                  className="riccati-card"
                  style={{
                    marginTop: "14px",
                    padding: "16px",
                  }}
                >
                  {responsablesProyecto.length >
                  0 ? (

                    responsablesProyecto.map(
                      (usuario) => (
                        <div
                          key={
                            usuario.id_usuario
                          }
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent:
                              "space-between",
                            gap: "15px",
                            marginBottom:
                              responsablesProyecto.length >
                              1
                                ? "10px"
                                : 0,
                          }}
                        >
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
                                width: "36px",
                                height: "36px",
                              }}
                            >
                              {usuario.nombre
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                "U"}
                            </div>

                            <div>
                              <strong
                                style={{
                                  display: "block",
                                  color:
                                    "#e7eef5",
                                  fontSize:
                                    "9px",
                                }}
                              >
                                {usuario.nombre}{" "}
                                {
                                  usuario.apellidos
                                }
                              </strong>

                              <span
                                style={{
                                  display: "block",
                                  marginTop:
                                    "4px",
                                  color:
                                    "#60788d",
                                  fontSize:
                                    "7px",
                                }}
                              >
                                {usuario.correo}
                              </span>
                            </div>
                          </div>

                          {usuario.es_responsable_principal && (
                            <span className="riccati-badge riccati-badge-cyan">
                              Principal
                            </span>
                          )}
                        </div>
                      )
                    )

                  ) : (

                    <span
                      style={{
                        color: "#60788d",
                        fontSize: "8px",
                      }}
                    >
                      Sin responsable asignado.
                    </span>

                  )}
                </div>

                {/* CAMBIAR RESPONSABLE */}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1fr auto",
                    gap: "10px",
                    marginTop: "12px",
                  }}
                >
                  <select
                    className="riccati-select"
                    value={
                      responsableSeleccionado
                    }
                    onChange={(e) =>
                      onChangeResponsable(
                        e.target.value
                      )
                    }
                  >
                    <option value="">
                      Seleccionar nuevo responsable
                    </option>

                    {responsables.map(
                      (usuario) => (
                        <option
                          key={
                            usuario.id_usuario
                          }
                          value={
                            usuario.id_usuario
                          }
                        >
                          {usuario.nombre}{" "}
                          {usuario.apellidos}
                          {" · "}
                          {usuario.rol}
                        </option>
                      )
                    )}
                  </select>

                  <button
                    type="button"
                    className="riccati-button-secondary"
                    onClick={
                      onCambiarResponsable
                    }
                    disabled={
                      !responsableSeleccionado ||
                      actualizando
                    }
                  >
                    Cambiar responsable
                  </button>
                </div>

                {/* ESTADO OPERATIVO */}

                <div
                  style={{
                    marginTop: "24px",
                    paddingTop: "18px",
                    borderTop:
                      "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <span className="riccati-panel-label">
                    ESTADO OPERATIVO
                  </span>

                  <p
                    style={{
                      marginTop: "5px",
                      color: "#60788d",
                      fontSize: "8px",
                    }}
                  >
                    Estado actual:{" "}
                    <strong
                      style={{
                        color: "#26d9ff",
                      }}
                    >
                      {proyecto.estado}
                    </strong>
                  </p>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1fr auto",
                    gap: "10px",
                    marginTop: "14px",
                  }}
                >
                  <select
                    className="riccati-select"
                    value={
                      estadoSeleccionado
                    }
                    onChange={(e) =>
                      onChangeEstado(
                        e.target.value
                      )
                    }
                  >
                    <option value="">
                      Seleccionar estado
                    </option>

                    {estados.map(
                      (estado) => (
                        <option
                          key={
                            estado.id_estado
                          }
                          value={
                            estado.id_estado
                          }
                        >
                          {estado.nombre}
                        </option>
                      )
                    )}
                  </select>

                  <button
                    type="button"
                    className="riccati-button-primary"
                    onClick={
                      onCambiarEstado
                    }
                    disabled={
                      !estadoSeleccionado ||
                      actualizando
                    }
                  >
                    {actualizando
                      ? "Actualizando..."
                      : "Cambiar estado"}
                  </button>
                </div>

              </>
            )}

        </div>

        {/* FOOTER */}

        <div className="riccati-modal-footer">

          {proyecto && (
            <button
              type="button"
              className="riccati-button-primary"
              onClick={onEditar}
              disabled={actualizando}
            >
              Editar proyecto
            </button>
          )}

          <button
            type="button"
            className="riccati-button-secondary"
            onClick={onClose}
            disabled={actualizando}
          >
            Cerrar
          </button>

        </div>

      </div>
    </div>
  );
}


/* =====================================================
   DATO PROYECTO
===================================================== */

function DatoProyecto({
  titulo,
  valor,
  destacado = false,
  prioridad = false,
  estado = false,
}) {
  return (
    <div
      className="riccati-card"
      style={{
        padding: "13px",
      }}
    >
      <span
        style={{
          display: "block",
          marginBottom: "6px",
          color: "#526b81",
          fontSize: "7px",
          letterSpacing: "0.8px",
          textTransform: "uppercase",
        }}
      >
        {titulo}
      </span>

      {prioridad ? (

        <PrioridadBadge
          prioridad={valor}
        />

      ) : estado ? (

        <EstadoBadge
          estado={valor}
        />

      ) : (

        <strong
          style={{
            display: "block",
            color: destacado
              ? "#26d9ff"
              : "#e7eef5",
            fontSize: destacado
              ? "10px"
              : "9px",
            fontWeight: "500",
            lineHeight: "1.6",
          }}
        >
          {valor}
        </strong>

      )}
    </div>
  );
}


/* =====================================================
   PRIORIDAD
===================================================== */

function PrioridadBadge({
  prioridad,
}) {
  if (prioridad === "Alta") {
    return (
      <span className="riccati-badge riccati-badge-red">
        Alta
      </span>
    );
  }

  if (prioridad === "Media") {
    return (
      <span className="riccati-badge riccati-badge-orange">
        Media
      </span>
    );
  }

  return (
    <span className="riccati-badge riccati-badge-green">
      {prioridad || "Baja"}
    </span>
  );
}


/* =====================================================
   ESTADO
===================================================== */

function EstadoBadge({
  estado,
}) {
  if (estado === "En curso") {
    return (
      <span className="riccati-badge riccati-badge-green">
        En curso
      </span>
    );
  }

  if (estado === "Suspendido") {
    return (
      <span className="riccati-badge riccati-badge-orange">
        Suspendido
      </span>
    );
  }

  if (estado === "Finalizado") {
    return (
      <span className="riccati-badge riccati-badge-cyan">
        Finalizado
      </span>
    );
  }

  if (estado === "Archivado") {
    return (
      <span className="riccati-badge riccati-badge-purple">
        Archivado
      </span>
    );
  }

  return (
    <span className="riccati-badge riccati-badge-cyan">
      {estado || "Registrado"}
    </span>
  );
}


/* =====================================================
   FECHA
===================================================== */

function formatearFecha(fecha) {
  if (!fecha) {
    return "No definida";
  }

  const valor =
    String(fecha).split("T")[0];

  const partes =
    valor.split("-");

  if (partes.length !== 3) {
    return valor;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}


export default ProyectoFichaModal;