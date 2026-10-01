const API_URL =
  "http://localhost:3000/api/usuarios";


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
   PROCESAR RESPUESTA
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
          "Ocurrió un error en la solicitud."
      );
    }

    return datos;
  };


/* =====================================================
   OBTENER USUARIOS
===================================================== */

export const obtenerUsuarios =
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
   OBTENER ROLES
===================================================== */

export const obtenerRoles =
  async () => {

    const respuesta = await fetch(
      `${API_URL}/roles`,
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
   CREAR USUARIO
===================================================== */

export const crearUsuario =
  async (usuario) => {

    const respuesta = await fetch(
      API_URL,
      {
        method: "POST",

        headers:
          obtenerHeaders(true),

        body: JSON.stringify(
          usuario
        ),
      }
    );

    return procesarRespuesta(
      respuesta
    );
  };


/* =====================================================
   ACTUALIZAR USUARIO
===================================================== */

export const actualizarUsuario =
  async (
    idUsuario,
    usuario
  ) => {

    const respuesta = await fetch(
      `${API_URL}/${idUsuario}`,
      {
        method: "PUT",

        headers:
          obtenerHeaders(true),

        body: JSON.stringify(
          usuario
        ),
      }
    );

    return procesarRespuesta(
      respuesta
    );
  };