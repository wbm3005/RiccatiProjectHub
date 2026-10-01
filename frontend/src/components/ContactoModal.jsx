function ContactoModal({
  mostrar,
  formulario,
  error,
  guardando,
  onChange,
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
          maxWidth: "560px",
        }}
      >
        {/* HEADER */}

        <div className="riccati-modal-header">

          <span className="riccati-page-label">
            M02 · CONTACTOS
          </span>

          <h3>
            Nuevo contacto
          </h3>

          <p
            style={{
              marginTop: "5px",
              color: "#60788d",
              fontSize: "8px",
            }}
          >
            Agrega un nuevo contacto asociado
            al cliente.
          </p>

        </div>


        <form onSubmit={onSubmit}>

          <div className="riccati-modal-body">

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}


            {/* NOMBRE */}

            <div className="riccati-form-group">

              <label>
                Nombre completo
              </label>

              <input
                type="text"
                name="nombre"
                className="riccati-input"
                placeholder="Nombre del contacto"
                value={formulario.nombre}
                onChange={onChange}
                required
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
                placeholder="Ej: Arquitecto, Gerente..."
                value={formulario.puesto}
                onChange={onChange}
              />

            </div>


            {/* CORREO + TELÉFONO */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
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
                  placeholder="correo@ejemplo.com"
                  value={formulario.correo}
                  onChange={onChange}
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
                  value={formulario.telefono}
                  onChange={onChange}
                />

              </div>

            </div>


            {/* CONTACTO PRINCIPAL */}

            <div
              className="riccati-card"
              style={{
                padding: "14px",
                marginTop: "6px",
              }}
            >

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                }}
              >

                <input
                  type="checkbox"
                  name="es_principal"
                  checked={
                    formulario.es_principal
                  }
                  onChange={onChange}
                />

                <div>

                  <strong
                    style={{
                      display: "block",
                      color: "#e8f0f7",
                      fontSize: "9px",
                    }}
                  >
                    Contacto principal
                  </strong>

                  <span
                    style={{
                      display: "block",
                      marginTop: "3px",
                      color: "#60788d",
                      fontSize: "7px",
                    }}
                  >
                    Este contacto será el principal
                    del cliente.
                  </span>

                </div>

              </label>

            </div>

          </div>


          {/* FOOTER */}

          <div className="riccati-modal-footer">

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
                ? "Guardando..."
                : "Agregar contacto"}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}

export default ContactoModal;