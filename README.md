# Notaría 105 — Versión Estática (HTML + CSS + JS vainilla)

Esta es la conversión de tu proyecto Flask + PostgreSQL a una página
**100% estática**, sin servidor ni base de datos real. Toda la información
se guarda en el `localStorage` del navegador.

## ⚠️ Cómo probar el sistema (LEER ANTES DE ABRIR NADA)

**NUNCA abras los archivos `.html` con doble clic** (protocolo `file://`).

Los navegadores modernos (Chrome, Edge, y en menor medida Firefox) aplican
una política de origen que, bajo `file://`, trata **cada archivo HTML como
un origen distinto**. Esto aísla el `localStorage`: los datos que guardas
en `nuevo_cliente.html` no son visibles desde `crear_escritura.html`, aunque
el código sea correcto. Síntomas típicos de este problema:

- El `<select>` de clientes en `crear_escritura.html` aparece vacío.
- Los registros nuevos "no se guardan" al enviar un formulario.
- El login funciona en una página pero la sesión se pierde al navegar a otra.

Todo esto desaparece si sirves el proyecto desde un **mismo origen HTTP**.

### Opción A — Servidor local con Python (recomendado)

```bash
cd notaria-estatica
python -m http.server 8000
```

Abre **`http://localhost:8000/index.html`** en el navegador (no `file://`).

### Opción B — Live Server en VS Code

1. Instala la extensión **"Live Server"** (de Ritwick Dey) en VS Code.
2. Clic derecho sobre `index.html` → **"Open with Live Server"**.
3. Se abrirá automáticamente en `http://127.0.0.1:5500/...`.

### Opción C — GitHub Pages (despliegue real)

Si subes esta carpeta a un repositorio y activas **GitHub Pages**, el
problema de `file://` **no aplica en absoluto**: GitHub Pages sirve todo
bajo un único origen HTTPS (`https://tuusuario.github.io/...`), así que el
`localStorage` se comparte correctamente entre todas las páginas sin
necesidad de ningún servidor local. Esta es la forma ideal de entregar el
proyecto a tu profesor para que lo pruebe sin instalar nada.

## Cuentas de prueba precargadas (seed automático)

Al cargar `index.html` por primera vez (vía servidor, no `file://`), se
ejecuta en segundo plano un seed que precarga estas cuentas si no existen
datos guardados:

| Rol      | Correo                     | Contraseña / CURP         |
|----------|-----------------------------|----------------------------|
| Notario  | notario@notaria105.com      | notario123                 |
| Abogado  | abogado@notaria105.com      | abogado123                 |
| Cliente  | cliente@example.com         | CURP: PELJ850303HDFRPN03   |

También hay un trámite de ejemplo (`ESC-2026-1001`, Fe de Hechos) ya creado
para que el dashboard no se vea vacío al primer ingreso.

> Si necesitas borrar todo y volver a este estado inicial, abre la consola
> del navegador (F12) y ejecuta: `localStorage.removeItem('notaria_db')`,
> luego recarga la página.

## Mapeo de archivos (Flask → Estático)

| Original (Flask)                          | Estático                  |
|--------------------------------------------|----------------------------|
| `app.py` (rutas)                           | Cada `.html` + su `<script>` |
| `database.py` + PostgreSQL                 | `js/db.js` (localStorage) |
| `session` de Flask                         | `sessionStorage` (`notaria_session`) |
| `templates/layout.html`                    | `js/nav.js` (navbar dinámico) |
| `templates/*.html` (Jinja2)                | `*.html` (mismo nombre, HTML+JS) |
| `werkzeug.security` (hash de contraseña)   | `crypto.subtle` SHA-256 (⚠️ solo demo) |
| Parámetros de ruta (`<no_escritura>`)      | Query string `?folio=...` |

## Estructura de "tablas" en `localStorage`

Todo vive bajo la clave `notaria_db` como un único objeto JSON con arreglos
que imitan las tablas SQL originales: `personas`, `correos`, `empleados`,
`clientes`, `bienes`, `escrituras`, `testamentos`, `fe_hechos`, `actas`,
`compraventas`, `participaciones`, `pagos`. Ver los comentarios al inicio
de `js/db.js` para el detalle completo de cada campo.

## Limitaciones a tener en cuenta

- **No hay seguridad real.** El hash SHA-256 sin "salt" es solo para que el
  login se sienta parecido al original; no debe usarse en producción.
- **Los datos son por navegador (y por origen).** Si pruebas en Chrome y
  luego abres en Firefox, o cambias de `localhost:8000` a `127.0.0.1:5500`,
  verás datos distintos / vacíos, porque cada origen tiene su propio
  `localStorage`.
- **No hay concurrencia ni multiusuario real**: es una sola "base de
  datos" local, pensada para que una persona pruebe el flujo completo.
- Las validaciones de duplicados (RFC, CURP, correo, INE) se hacen en el
  cliente, igual que antes se hacían en la base de datos con `UNIQUE`.

## Estructura de carpetas

```
notaria-estatica/
├── index.html
├── login.html
├── login_cliente.html
├── dashboard.html
├── nuevo_empleado.html
├── nuevo_cliente.html
├── crear_escritura.html
├── editar_escritura.html
├── firmar_escritura.html
├── archivo.html
├── documento_oficial.html
├── portal_cliente.html
├── css/
│   └── styles.css
└── js/
    ├── db.js     (capa de datos + seed + auth)
    └── nav.js    (navbar dinámico)
```
