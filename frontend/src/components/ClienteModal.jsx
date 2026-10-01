function ClienteModal({
  mostrar,
  formulario,
  contacto,
  error,
  guardando,
  onChangeCliente,
  onChangeContacto,
  onSubmit,
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
          height: "calc(100dvh - 32px)",
          maxHeight: "860px",
        }}
      >

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="riccati-modal-header">

          <span className="riccati-page-label">
            M02 · CLIENTES
          </span>

          <h3>
            Nuevo cliente
          </h3>

          <p
            style={{
              marginTop: "5px",
              color: "#60788d",
              fontSize: "8px",
            }}
          >
            Registra la información general
            del cliente.
          </p>

        </div>


        {/* =====================================================
            FORMULARIO
        ===================================================== */}

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

          {/* ===================================================
              CUERPO CON SCROLL
          =================================================== */}

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


            {/* =================================================
                INFORMACIÓN GENERAL
            ================================================= */}

            <span className="riccati-panel-label">
              INFORMACIÓN GENERAL
            </span>


            {/* NOMBRE */}

            <div className="riccati-form-group">

              <label>
                Nombre o razón social
              </label>

              <input
                type="text"
                name="nombre_razon_social"
                className="riccati-input"
                placeholder="Ej: Arquitectura Central S.A."
                value={
                  formulario.nombre_razon_social
                }
                onChange={onChangeCliente}
                required
              />

            </div>


            {/* IDENTIFICACIÓN + ESTADO */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: "12px",
              }}
            >

              <div className="riccati-form-group">

                <label>
                  Identificación
                </label>

                <input
                  type="text"
                  name="identificacion"
                  className="riccati-input"
                  placeholder="Cédula física o jurídica"
                  value={
                    formulario.identificacion
                  }
                  onChange={onChangeCliente}
                />

              </div>


              <div className="riccati-form-group">

                <label>
                  Estado
                </label>

                <select
                  name="estado"
                  className="riccati-select"
                  value={formulario.estado}
                  onChange={onChangeCliente}
                >
                  <option value="ACTIVO">
                    Activo
                  </option>

                  <option value="INACTIVO">
                    Inactivo
                  </option>
                </select>

              </div>

            </div>


            {/* CORREO + TELÉFONO */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: "12px",
              }}
            >

              <div className="riccati-form-group">

                <label>
                  Correo general
                </label>

                <input
                  type="email"
                  name="correo_general"
                  className="riccati-input"
                  placeholder="cliente@correo.com"
                  value={
                    formulario.correo_general
                  }
                  onChange={onChangeCliente}
                />

              </div>


              <div className="riccati-form-group">

                <label>
                  Teléfono
                </label>

                <input
                  type="text"
                  name="telefono_general"
                  className="riccati-input"
                  placeholder="8888-8888"
                  value={
                    formulario.telefono_general
                  }
                  onChange={onChangeCliente}
                />

              </div>

            </div>


            {/* DIRECCIÓN */}

            <div className="riccati-form-group">

              <label>
                Dirección
              </label>

              <input
                type="text"
                name="direccion"
                className="riccati-input"
                placeholder="Dirección del cliente"
                value={
                  formulario.direccion
                }
                onChange={onChangeCliente}
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
                placeholder="Información adicional..."
                value={
                  formulario.observaciones
                }
                onChange={onChangeCliente}
                rows="3"
                style={{
                  resize: "vertical",
                }}
              />

            </div>


            {/* =================================================
                CONTACTO PRINCIPAL
            ================================================= */}

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
                CONTACTO PRINCIPAL
              </span>

              <p
                style={{
                  marginTop: "5px",
                  marginBottom: "15px",
                  color: "#60788d",
                  fontSize: "8px",
                }}
              >
                Este apartado es opcional.
              </p>

            </div>


            {/* NOMBRE CONTACTO */}

            <div className="riccati-form-group">

              <label>
                Nombre del contacto
              </label>

              <input
                type="text"
                name="nombre"
                className="riccati-input"
                placeholder="Nombre completo"
                value={contacto.nombre}
                onChange={onChangeContacto}
              />

            </div>


            {/* PUESTO */}

            <div className="riccati-form-group">

              <label>
                Puesto
              </label>

              <input
                type="text"
                name="puesto"
                className="riccati-input"
                placeholder="Ej: Gerente de proyectos"
                value={contacto.puesto}
                onChange={onChangeContacto}
              />

            </div>


            {/* CORREO + TELÉFONO CONTACTO */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: "12px",
              }}
            >

              <div className="riccati-form-group">

                <label>
                  Correo
                </label>

                <input
                  type="email"
                  name="correo"
                  className="riccati-input"
                  placeholder="contacto@correo.com"
                  value={contacto.correo}
                  onChange={onChangeContacto}
                />

              </div>


              <div className="riccati-form-group">

                <label>
                  Teléfono
                </label>

                <input
                  type="text"
                  name="telefono"
                  className="riccati-input"
                  placeholder="8888-8888"
                  value={contacto.telefono}
                  onChange={onChangeContacto}
                />

              </div>

            </div>

          </div>


          {/* ===================================================
              FOOTER SIEMPRE VISIBLE
          =================================================== */}

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
                ? "Registrando..."
                : "Registrar cliente"}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}


export default ClienteModal;