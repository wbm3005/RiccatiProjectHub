function ProyectoModal({
  mostrar,
  proyectoEditando,
  formulario,
  clientes,
  contactos,
  prioridades,
  responsables,
  error,
  guardando,
  onChange,
  onSubmit,
  onClose,
}) {
  if (!mostrar) {
    return null;
  }

  const esEdicion =
    Boolean(proyectoEditando);

  return (
    <div
      className="riccati-modal-backdrop"
      onMouseDown={(e) => {
        if (
          e.target ===
          e.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div
        className="riccati-modal"
        style={{
          maxWidth: "900px",
          height:
            "calc(100dvh - 32px)",
          maxHeight: "880px",
        }}
      >

        {/* =========================================
            HEADER
        ========================================= */}

        <div className="riccati-modal-header">

          <span className="riccati-page-label">
            M03 · PROYECTOS
          </span>

          <h3>
            {esEdicion
              ? "Editar proyecto"
              : "Nuevo proyecto"}
          </h3>

          <p
            style={{
              marginTop: "5px",
              color: "#60788d",
              fontSize: "8px",
            }}
          >
            {esEdicion
              ? "Actualiza la información general del proyecto."
              : "Registra un nuevo proyecto en Riccati Project Hub."}
          </p>

        </div>


        {/* =========================================
            FORMULARIO
        ========================================= */}

        <form
          onSubmit={onSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
          }}
        >

          {/* =======================================
              BODY CON SCROLL
          ======================================= */}

          <div
            className="riccati-modal-body"
            style={{
              flex: "1 1 auto",
              minHeight: 0,
              overflowY: "auto",
              overflowX: "hidden",
            }}
          >

            {/* ERROR */}

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}


            {/* =====================================
                INFORMACIÓN GENERAL
            ===================================== */}

            <span className="riccati-panel-label">
              INFORMACIÓN GENERAL
            </span>


            {/* NOMBRE */}

            <div
              className="riccati-form-group"
              style={{
                marginTop: "14px",
              }}
            >

              <label>
                Nombre del proyecto
              </label>

              <input
                type="text"
                name="nombre"
                className="riccati-input"
                placeholder="Ej: Remodelación Oficinas Centrales"
                value={
                  formulario.nombre
                }
                onChange={onChange}
                required
              />

            </div>


            {/* =====================================
                CLIENTE + CONTACTO
            ===================================== */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: "12px",
              }}
            >

              {/* CLIENTE */}

              <div className="riccati-form-group">

                <label>
                  Cliente
                </label>

                <select
                  name="id_cliente"
                  className="riccati-select"
                  value={
                    formulario.id_cliente
                  }
                  onChange={onChange}
                  required
                >

                  <option value="">
                    Seleccionar cliente
                  </option>

                  {clientes.map(
                    (cliente) => (

                      <option
                        key={
                          cliente.id_cliente
                        }
                        value={
                          cliente.id_cliente
                        }
                      >
                        {
                          cliente
                            .nombre_razon_social
                        }
                      </option>

                    )
                  )}

                </select>

              </div>


              {/* CONTACTO */}

              <div className="riccati-form-group">

                <label>
                  Contacto principal
                </label>

                <select
                  name="id_contacto_principal"
                  className="riccati-select"
                  value={
                    formulario
                      .id_contacto_principal
                  }
                  onChange={onChange}
                  disabled={
                    !formulario.id_cliente
                  }
                >

                  <option value="">
                    {formulario.id_cliente
                      ? "Seleccionar contacto"
                      : "Primero selecciona un cliente"}
                  </option>

                  {contactos.map(
                    (contacto) => (

                      <option
                        key={
                          contacto.id_contacto
                        }
                        value={
                          contacto.id_contacto
                        }
                      >
                        {contacto.nombre}

                        {contacto.puesto
                          ? ` · ${contacto.puesto}`
                          : ""}
                      </option>

                    )
                  )}

                </select>

              </div>

            </div>


            {/* =====================================
                RESPONSABLE + PRIORIDAD
            ===================================== */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: "12px",
              }}
            >

              {/* RESPONSABLE */}

              <div className="riccati-form-group">

                <label>
                  Responsable
                </label>

                <select
                  name="id_responsable"
                  className="riccati-select"
                  value={
                    formulario
                      .id_responsable
                  }
                  onChange={onChange}
                >

                  <option value="">
                    Seleccionar responsable
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

                        {usuario.rol
                          ? ` · ${usuario.rol}`
                          : ""}
                      </option>

                    )
                  )}

                </select>

              </div>


              {/* PRIORIDAD */}

              <div className="riccati-form-group">

                <label>
                  Prioridad
                </label>

                <select
                  name="id_prioridad"
                  className="riccati-select"
                  value={
                    formulario
                      .id_prioridad
                  }
                  onChange={onChange}
                  required
                >

                  <option value="">
                    Seleccionar prioridad
                  </option>

                  {prioridades.map(
                    (prioridad) => (

                      <option
                        key={
                          prioridad
                            .id_prioridad
                        }
                        value={
                          prioridad
                            .id_prioridad
                        }
                      >
                        {
                          prioridad.nombre
                        }
                      </option>

                    )
                  )}

                </select>

              </div>

            </div>


            {/* =====================================
                DETALLES DEL PROYECTO
            ===================================== */}

            <div
              style={{
                marginTop: "22px",
                marginBottom: "15px",

                borderTop:
                  "1px solid rgba(255,255,255,0.05)",

                paddingTop: "18px",
              }}
            >

              <span className="riccati-panel-label">
                DETALLES DEL PROYECTO
              </span>

              <p
                style={{
                  marginTop: "5px",
                  color: "#60788d",
                  fontSize: "8px",
                }}
              >
                Información descriptiva
                y contractual.
              </p>

            </div>


            {/* DESCRIPCIÓN */}

            <div className="riccati-form-group">

              <label>
                Descripción
              </label>

              <textarea
                name="descripcion"
                className="riccati-input"
                placeholder="Descripción general del proyecto..."
                value={
                  formulario.descripcion
                }
                onChange={onChange}
                rows="3"
                style={{
                  resize: "vertical",
                }}
              />

            </div>


            {/* CONTRATO */}

            <div className="riccati-form-group">

              <label>
                Contrato
              </label>

              <input
                type="text"
                name="contrato"
                className="riccati-input"
                placeholder="Ej: CTR-2026-001"
                value={
                  formulario.contrato
                }
                onChange={onChange}
              />

            </div>


            {/* OBSERVACIONES */}

            <div className="riccati-form-group">

              <label>
                Observaciones
              </label>

              <textarea
                name="observaciones"
                className="riccati-input"
                placeholder="Información adicional del proyecto..."
                value={
                  formulario.observaciones
                }
                onChange={onChange}
                rows="3"
                style={{
                  resize: "vertical",
                }}
              />

            </div>


            {/* =====================================
                PLANIFICACIÓN
            ===================================== */}

            <div
              style={{
                marginTop: "22px",
                marginBottom: "15px",

                borderTop:
                  "1px solid rgba(255,255,255,0.05)",

                paddingTop: "18px",
              }}
            >

              <span className="riccati-panel-label">
                PLANIFICACIÓN
              </span>

              <p
                style={{
                  marginTop: "5px",
                  color: "#60788d",
                  fontSize: "8px",
                }}
              >
                Define las fechas
                principales del proyecto.
              </p>

            </div>


            {/* =====================================
                FECHAS
            ===================================== */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3, minmax(0, 1fr))",
                gap: "12px",
              }}
            >

              {/* INICIO */}

              <div className="riccati-form-group">

                <label>
                  Fecha de inicio
                </label>

                <input
                  type="date"
                  name="fecha_inicio"
                  className="riccati-input"
                  value={
                    formulario.fecha_inicio
                  }
                  onChange={onChange}
                />

              </div>


              {/* COMPROMISO */}

              <div className="riccati-form-group">

                <label>
                  Fecha de compromiso
                </label>

                <input
                  type="date"
                  name="fecha_compromiso"
                  className="riccati-input"
                  value={
                    formulario
                      .fecha_compromiso
                  }
                  onChange={onChange}
                />

              </div>


              {/* FINALIZACIÓN */}

              <div className="riccati-form-group">

                <label>
                  Fecha de cierre
                </label>

                <input
                  type="date"
                  name="fecha_finalizacion"
                  className="riccati-input"
                  value={
                    formulario
                      .fecha_finalizacion
                  }
                  onChange={onChange}
                />

              </div>

            </div>


            {/* =====================================
                PROJECT ID
            ===================================== */}

            {!esEdicion && (

              <div
                className="riccati-card"
                style={{
                  marginTop: "18px",
                  padding: "14px 16px",
                }}
              >

                <span
                  style={{
                    display: "block",
                    color: "#26d9ff",
                    fontSize: "8px",
                    fontWeight: "600",
                    marginBottom: "5px",
                  }}
                >
                  PROJECT ID
                </span>

                <span
                  style={{
                    color: "#60788d",
                    fontSize: "8px",
                    lineHeight: "1.6",
                  }}
                >
                  El ProjectID se generará
                  automáticamente al
                  registrar el proyecto.
                </span>

              </div>

            )}

          </div>


          {/* =======================================
              FOOTER FIJO
          ======================================= */}

          <div
            className="riccati-modal-footer"
            style={{
              flexShrink: 0,
            }}
          >

            <button
              type="button"
              className="riccati-button-secondary"
              onClick={onClose}
              disabled={guardando}
            >
              Cancelar
            </button>


            <button
              type="submit"
              className="riccati-button-primary"
              disabled={guardando}
            >

              {guardando
                ? esEdicion
                  ? "Guardando..."
                  : "Creando..."
                : esEdicion
                  ? "Guardar cambios"
                  : "Crear proyecto"}

            </button>

          </div>

        </form>

      </div>
    </div>
  );
}


export default ProyectoModal;