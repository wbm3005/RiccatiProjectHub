const API_URL =
  "http://localhost:3000/api/clientes";


/* =====================================================
   TOKEN
===================================================== */

const obtenerToken = () => {
  return localStorage.getItem(
    "tokenRiccati"
  );
};


/* =====================================================
   HEADERS
===================================================== */

const obtenerHeaders = (
  incluirContenido = false
) => {
  const headers = {
    Authorization:
      `Bearer ${obtenerToken()}`,
  };

  if (incluirContenido) {
    headers["Content-Type"] =
      "application/json";
  }

  return headers;
};


/* =====================================================
   RESPUESTA
===================================================== */

const procesarRespuesta =
  async (respuesta) => {

    let datos = {};

    try {
      datos =
        await respuesta.json();
    } catch {
      datos = {};
    }

    if (respuesta.status === 401) {
      localStorage.removeItem(
        "tokenRiccati"
      );

      localStorage.removeItem(
        "usuarioRiccati"
      );

      window.location.href = "/";

      throw new Error(
        "La sesión ha expirado."
      );
    }

    if (!respuesta.ok) {
      throw new Error(
        datos.mensaje ||
          "No fue posible completar la solicitud."
      );
    }

    return datos;
  };


/* =====================================================
   LISTAR CLIENTES
===================================================== */

export const obtenerClientes =
  async () => {

    const respuesta = await fetch(
      API_URL,
      {
        headers:
          obtenerHeaders(),
      }
    );

    return procesarRespuesta(
      respuesta
    );
  };


/* =====================================================
   FICHA DE CLIENTE
===================================================== */

export const obtenerCliente =
  async (idCliente) => {

    const respuesta = await fetch(
      `${API_URL}/${idCliente}`,
      {
        headers:
          obtenerHeaders(),
      }
    );

    return procesarRespuesta(
      respuesta
    );
  };


/* =====================================================
   CREAR CLIENTE
===================================================== */

export const crearCliente =
  async (cliente) => {

    const respuesta = await fetch(
      API_URL,
      {
        method: "POST",

        headers:
          obtenerHeaders(true),

        body: JSON.stringify(
          cliente
        ),
      }
    );

    return procesarRespuesta(
      respuesta
    );
  };


/* =====================================================
   ACTUALIZAR CLIENTE
===================================================== */

export const actualizarCliente =
  async (
    idCliente,
    cliente
  ) => {

    const respuesta = await fetch(
      `${API_URL}/${idCliente}`,
      {
        method: "PUT",

        headers:
          obtenerHeaders(true),

        body: JSON.stringify(
          cliente
        ),
      }
    );

    return procesarRespuesta(
      respuesta
    );
  };


/* =====================================================
   OBTENER CONTACTOS
===================================================== */

export const obtenerContactosCliente =
  async (idCliente) => {

    const respuesta = await fetch(
      `${API_URL}/${idCliente}/contactos`,
      {
        headers:
          obtenerHeaders(),
      }
    );

    return procesarRespuesta(
      respuesta
    );
  };


/* =====================================================
   REGISTRAR CONTACTO
===================================================== */

export const crearContactoCliente =
  async (
    idCliente,
    contacto
  ) => {

    const respuesta = await fetch(
      `${API_URL}/${idCliente}/contactos`,
      {
        method: "POST",

        headers:
          obtenerHeaders(true),

        body: JSON.stringify(
          contacto
        ),
      }
    );

    return procesarRespuesta(
      respuesta
    );
  };