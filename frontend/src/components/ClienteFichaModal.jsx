function ClienteFichaModal({
  mostrar,
  cliente,
  contactos,
  cargando,
  error,
  onAgregarContacto,
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
          maxWidth: "760px",
        }}
      >
        <div className="riccati-modal-header">

          <span className="riccati-page-label">
            M02 · FICHA DEL CLIENTE
          </span>

          <h3>
            {cliente?.nombre_razon_social ||
              "Cliente"}
          </h3>

          <p
            style={{
              marginTop: "5px",
              color: "#60788d",
              fontSize: "8px",
            }}
          >
            Información general y contactos asociados.
          </p>

        </div>

        <div className="riccati-modal-body">

          {cargando && (
            <div className="riccati-loader-wrapper">

              <div className="riccati-loader">
              </div>

              <span className="riccati-loader-text">
                Cargando ficha...
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
            cliente && (
              <>
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
                  <DatoFicha
                    titulo="Identificación"
                    valor={
                      cliente.identificacion ||
                      "No registrada"
                    }
                  />

                  <DatoFicha
                    titulo="Estado"
                    valor={cliente.estado}
                    estado
                  />

                  <DatoFicha
                    titulo="Correo general"
                    valor={
                      cliente.correo_general ||
                      "No registrado"
                    }
                  />

                  <DatoFicha
                    titulo="Teléfono"
                    valor={
                      cliente.telefono_general ||
                      "No registrado"
                    }
                  />

                </div>

                <div
                  style={{
                    marginTop: "12px",
                  }}
                >
                  <DatoFicha
                    titulo="Dirección"
                    valor={
                      cliente.direccion ||
                      "No registrada"
                    }
                  />
                </div>

                <div
                  style={{
                    marginTop: "12px",
                  }}
                >
                  <DatoFicha
                    titulo="Observaciones"
                    valor={
                      cliente.observaciones ||
                      "Sin observaciones"
                    }
                  />
                </div>


                {/* CONTACTOS */}

                <div
                  style={{
                    marginTop: "24px",
                    paddingTop: "18px",
                    borderTop:
                      "1px solid rgba(255,255,255,0.05)",
                  }}
                >

                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                      gap: "15px",
                      marginBottom: "14px",
                    }}
                  >

                    <span className="riccati-panel-label">
                      CONTACTOS ASOCIADOS
                    </span>

                    <button
                      type="button"
                      className="riccati-button-primary"
                      onClick={
                        onAgregarContacto
                      }
                    >
                      + Agregar contacto
                    </button>

                  </div>


                  {contactos.length === 0 ? (

                    <div className="riccati-empty">

                      <div className="riccati-empty-icon">
                        ◇
                      </div>

                      <strong>
                        Sin contactos registrados
                      </strong>

                      <span>
                        Este cliente todavía no tiene
                        contactos asociados.
                      </span>

                    </div>

                  ) : (

                    contactos.map(
                      (contacto) => (

                        <ContactoCard
                          key={
                            contacto.id_contacto
                          }
                          contacto={
                            contacto
                          }
                        />

                      )
                    )

                  )}

                </div>
              </>
            )}

        </div>


        <div className="riccati-modal-footer">

          <button
            type="button"
            className="riccati-button-secondary"
            onClick={onClose}
          >
            Cerrar
          </button>

        </div>

      </div>
    </div>
  );
}


function DatoFicha({
  titulo,
  valor,
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

      {estado ? (

        <span
          className={
            valor === "ACTIVO"
              ? "riccati-badge riccati-badge-green"
              : "riccati-badge riccati-badge-orange"
          }
        >
          {valor}
        </span>

      ) : (

        <strong
          style={{
            display: "block",
            color: "#e7eef5",
            fontSize: "9px",
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


function ContactoCard({
  contacto,
}) {
  return (
    <div
      className="riccati-card"
      style={{
        padding: "15px",
        marginBottom: "10px",
      }}
    >

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          gap: "15px",
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
              width: "34px",
              height: "34px",
            }}
          >
            {contacto.nombre
              ?.charAt(0)
              ?.toUpperCase() || "C"}
          </div>

          <div>

            <strong
              style={{
                display: "block",
                color: "#e7eef5",
                fontSize: "9px",
              }}
            >
              {contacto.nombre}
            </strong>

            <span
              style={{
                display: "block",
                marginTop: "4px",
                color: "#60788d",
                fontSize: "7px",
              }}
            >
              {contacto.puesto ||
                "Sin puesto registrado"}
            </span>

          </div>

        </div>


        {contacto.es_principal && (
          <span className="riccati-badge riccati-badge-cyan">
            Principal
          </span>
        )}

      </div>


      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
          gap: "10px",
          marginTop: "14px",
        }}
      >

        <DatoContacto
          titulo="Correo"
          valor={
            contacto.correo ||
            "No registrado"
          }
        />

        <DatoContacto
          titulo="Teléfono"
          valor={
            contacto.telefono ||
            "No registrado"
          }
        />

      </div>

    </div>
  );
}


function DatoContacto({
  titulo,
  valor,
}) {
  return (
    <div>

      <span
        style={{
          display: "block",
          color: "#4f667c",
          fontSize: "7px",
          textTransform: "uppercase",
          letterSpacing: "0.7px",
        }}
      >
        {titulo}
      </span>

      <span
        style={{
          display: "block",
          marginTop: "4px",
          color: "#9aabba",
          fontSize: "8px",
        }}
      >
        {valor}
      </span>

    </div>
  );
}


export default ClienteFichaModal;