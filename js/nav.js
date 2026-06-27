/* =========================================================================
   nav.js — Renderiza la barra de navegación según la sesión activa.
   Equivalente al bloque {% if 'user_id' in session %} de layout.html.
   Cada página debe tener un <div id="navbar-container"></div> y llamar a
   renderNavbar() después de cargar db.js.
   ========================================================================= */

function renderNavbar() {
  const contenedor = document.getElementById("navbar-container");
  if (!contenedor) return;

  const sesion = getSession();

  let botonesDerecha;
  if (sesion) {
    const linkPanel =
      sesion.rol === "Cliente"
        ? `<a class="btn btn-outline-light me-2" href="portal_cliente.html">Mi Portal</a>`
        : `<a class="btn btn-outline-light me-2" href="dashboard.html">Panel Operativo</a>`;
    botonesDerecha = `
      ${linkPanel}
      <a class="btn btn-danger" href="#" onclick="logout(); return false;">Salir</a>
    `;
  } else {
    botonesDerecha = `
      <a class="nav-link text-white me-4 mt-2" href="login_cliente.html">Portal Ciudadano</a>
      <a class="btn btn-outline-light" href="login.html">Acceso Personal</a>
    `;
  }

  contenedor.innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark mb-4 shadow">
      <div class="container">
        <a class="navbar-brand fw-bold" href="index.html">⚖️ Notaría 105</a>
        <div class="d-flex flex-wrap gap-1">
          ${botonesDerecha}
        </div>
      </div>
    </nav>
  `;
}
