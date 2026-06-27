/* =========================================================================
   db.js — "Base de datos" en localStorage para Notaría 105 (versión estática)
   -------------------------------------------------------------------------
   Sustituye a database.py + PostgreSQL. Cada tabla SQL original se modela
   como un arreglo dentro de un único objeto JSON guardado en localStorage.
   ========================================================================= */

const DB_KEY = "notaria_db";
const SESSION_KEY = "notaria_session";

/* ----------------------------- Persistencia ----------------------------- */

function getDB() {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("DB corrupta, reiniciando:", e);
    return null;
  }
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function dbVacia() {
  return {
    personas: [],
    correos: [],
    empleados: [],
    clientes: [],
    bienes: [],
    escrituras: [],
    testamentos: [],
    fe_hechos: [],
    actas: [],
    compraventas: [],
    participaciones: [],
    pagos: [],
    next_id_persona: 1,
    next_id_bien: 1,
  };
}

/* -------------------------------- Hashing -------------------------------- */
/* OJO: esto es SOLO para pruebas/demo locales sin servidor.
   No es un sustituto real de werkzeug.security en producción. */

async function hashPassword(texto) {
  const buffer = new TextEncoder().encode(texto);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/* --------------------------------- Seed ---------------------------------- */
/* Precarga cuentas demo en segundo plano (sin mostrarlas en la interfaz)
   si la "base de datos" está vacía, para que el login funcione de inmediato. */

async function seedSiVacia() {
  let db = getDB();
  if (db && db.personas && db.personas.length > 0) return; // ya tiene datos

  db = dbVacia();

  // --- Persona 1: Notario Titular ---
  const idNotario = db.next_id_persona++;
  db.personas.push({
    id_persona: idNotario,
    nombre: "Roberto",
    apellidos: "Gómez Bolaños",
    rfc: "GOBR800101AAA",
    curp: "GOBR800101HDFMLN01",
  });
  db.correos.push({ id_persona: idNotario, correo: "notario@notaria105.com" });
  db.empleados.push({
    id_persona: idNotario,
    no_cedula: "CED-0001",
    contrasena_hash: await hashPassword("notario123"),
    rol_sistema: "Notario",
  });

  // --- Persona 2: Abogado Auxiliar ---
  const idAbogado = db.next_id_persona++;
  db.personas.push({
    id_persona: idAbogado,
    nombre: "Laura",
    apellidos: "Méndez Ruiz",
    rfc: "MERL900202BBB",
    curp: "MERL900202MDFNZR02",
  });
  db.correos.push({ id_persona: idAbogado, correo: "abogado@notaria105.com" });
  db.empleados.push({
    id_persona: idAbogado,
    no_cedula: "CED-0002",
    contrasena_hash: await hashPassword("abogado123"),
    rol_sistema: "Abogado",
  });

  // --- Persona 3: Cliente / Ciudadano de prueba ---
  const idCliente = db.next_id_persona++;
  db.personas.push({
    id_persona: idCliente,
    nombre: "Juan",
    apellidos: "Pérez López",
    rfc: "PELJ850303CCC",
    curp: "PELJ850303HDFRPN03",
  });
  db.correos.push({ id_persona: idCliente, correo: "cliente@example.com" });
  db.clientes.push({
    id_persona: idCliente,
    ine: "PELJ850303HDFRPN00",
    estado_civil: "Casado",
    ocupacion: "Ingeniero",
  });

  // --- Bien inmueble de ejemplo ---
  const idBien = db.next_id_bien++;
  db.bienes.push({
    id_bien: idBien,
    direccion: "Av. Reforma 123, CDMX",
    folio_real: "FR-2026-0001",
    valor_catastral: 2500000.0,
  });

  // --- Escritura de ejemplo ya en curso, para que el dashboard no esté vacío ---
  const folioEjemplo = "ESC-2026-1001";
  db.escrituras.push({
    no_escritura: folioEjemplo,
    id_empleado: idNotario,
    fecha_apertura: new Date().toISOString().slice(0, 10),
    estado: "En redaccion",
    costo_total: 5000.0,
    texto_legal: "",
    firma_b64: null,
  });
  db.participaciones.push({
    id_persona: idCliente,
    no_escritura: folioEjemplo,
    tipo_participante: "Solicitante Principal",
  });
  db.fe_hechos.push({
    no_escritura: folioEjemplo,
    lugar_hechos: "Oficinas de la Notaría 105",
  });

  saveDB(db);
}

/* ------------------------------- Sesión ---------------------------------- */

function getSession() {
  const raw = sessionStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

function setSession(sesion) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(sesion));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

/* Redirige a login si no hay sesión, o si el rol no está autorizado.
   rolesPermitidos = null  -> solo exige estar logeado (cualquier rol)
   rolesPermitidos = []    -> exige estar logeado con CUALQUIER rol de la lista */
function requireAuth(rolesPermitidos, loginUrl = "login.html") {
  const sesion = getSession();
  if (!sesion) {
    window.location.href = loginUrl;
    return null;
  }
  if (rolesPermitidos && !rolesPermitidos.includes(sesion.rol)) {
    // El destino depende del rol: un Cliente va a su portal, no al dashboard de staff.
    window.location.href = sesion.rol === "Cliente" ? "portal_cliente.html" : "dashboard.html";
    return null;
  }
  return sesion;
}

/* ------------------------------- Helpers --------------------------------- */

function getCorreo(db, idPersona) {
  const c = db.correos.find((c) => c.id_persona === idPersona);
  return c ? c.correo : "";
}

function getPersona(db, idPersona) {
  return db.personas.find((p) => p.id_persona === idPersona) || null;
}

function getTipoTramite(db, no_escritura) {
  if (db.testamentos.find((t) => t.no_escritura === no_escritura)) return "Testamento";
  if (db.fe_hechos.find((f) => f.no_escritura === no_escritura)) return "Fe de Hechos";
  if (db.actas.find((a) => a.no_escritura === no_escritura)) return "Acta Constitutiva";
  if (db.compraventas.find((c) => c.no_escritura === no_escritura)) return "Compraventa";
  return "Instrumento General";
}

function getSolicitantePrincipal(db, no_escritura) {
  const part = db.participaciones.find(
    (p) => p.no_escritura === no_escritura && p.tipo_participante === "Solicitante Principal"
  );
  if (!part) return null;
  return getPersona(db, part.id_persona);
}

function generarFolio(db) {
  let folio;
  do {
    const n = Math.floor(1000 + Math.random() * 9000);
    folio = `ESC-2026-${n}`;
  } while (db.escrituras.find((e) => e.no_escritura === folio));
  return folio;
}

function formatoMoneda(valor) {
  const n = Number(valor || 0);
  return n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* --------------------------- Autenticación -------------------------------- */

/* Equivalente a la ruta /login (personal: Notario/Abogado) */
async function loginPersonal(correo, password) {
  const db = getDB();
  const correoRow = db.correos.find((c) => c.correo === correo);
  if (!correoRow) return { ok: false, error: "Acceso denegado. Revisa tus datos." };

  const empleado = db.empleados.find((e) => e.id_persona === correoRow.id_persona);
  if (!empleado) return { ok: false, error: "Acceso denegado. Revisa tus datos." };

  const hash = await hashPassword(password);
  if (hash !== empleado.contrasena_hash) {
    return { ok: false, error: "Acceso denegado. Revisa tus datos." };
  }

  const persona = getPersona(db, empleado.id_persona);
  setSession({
    user_id: persona.id_persona,
    rol: empleado.rol_sistema,
    nombre: persona.nombre,
  });
  return { ok: true };
}

/* Equivalente a la ruta /login_cliente (Portal Ciudadano: correo + CURP) */
function loginCliente(correo, curp) {
  const db = getDB();
  const correoRow = db.correos.find((c) => c.correo === correo);
  if (!correoRow) return { ok: false, error: "Datos no encontrados. Verifica tu correo y CURP." };

  const persona = getPersona(db, correoRow.id_persona);
  if (!persona || persona.curp.toUpperCase() !== curp.toUpperCase()) {
    return { ok: false, error: "Datos no encontrados. Verifica tu correo y CURP." };
  }

  const cliente = db.clientes.find((c) => c.id_persona === persona.id_persona);
  if (!cliente) return { ok: false, error: "Datos no encontrados. Verifica tu correo y CURP." };

  setSession({
    user_id: persona.id_persona,
    rol: "Cliente",
    nombre: persona.nombre,
  });
  return { ok: true };
}

function logout() {
  clearSession();
  window.location.href = "index.html";
}
