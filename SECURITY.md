# Seguridad — Videoteca Ácrata Punto de Ignición

Sitio estático (HTML, CSS y JavaScript) que corre entero en el navegador. No
hay backend, cuentas, base de datos ni formularios.

## Cómo reportar

Escribe a **antarquia@riseup.net** con la URL, qué ocurre y cómo reproducirlo.

Si el fallo permite ejecutar código en el navegador de otra persona, no abras un
issue público: manda el correo primero.

## Medidas vigentes

- **Sin terceros en tiempo de ejecución.** No se carga ninguna CDN: los estilos,
  el JavaScript y las tipografías son archivos locales.
- **CSP estricta** en `index.html` y en la cabecera HTTP (`_headers`):
  `default-src 'self'`, `script-src 'self'`, `style-src 'self'`,
  `object-src 'none'`, `frame-ancestors 'none'` y `form-action 'none'`. Solo se
  permite media desde `archive.org` porque el reproductor carga el video
  original.
- **Cabeceras HTTP de endurecimiento** (`_headers`): `X-Content-Type-Options:
  nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy:
  strict-origin-when-cross-origin`, `Permissions-Policy` sin cámara, micrófono,
  geolocalización ni USB, `Cross-Origin-Opener-Policy: same-origin`,
  `Cross-Origin-Resource-Policy: same-origin` y HSTS de un año.
- **Sin `eval`, `new Function` ni manejadores `on*=` inline.** El catálogo se
  pinta con `createElement` y `textContent`, no con `innerHTML`.
- **Enlaces externos** con `target="_blank"` y `rel="noopener noreferrer"`.
- **`referrer`** limitado a `strict-origin-when-cross-origin`.
- **Descargas y video** apuntan a Internet Archive; el sitio no aloja copias.
- **Preferencia local mínima.** El selector de estilo guarda solo
  `vapi-tema` en `localStorage`; no se usan cookies ni identificadores y el
  valor nunca se envía por red.
- **Beta fuera de buscadores**: `npm run build:beta` añade `X-Robots-Tag:
  noindex, nofollow` y un `robots.txt` cerrado.
- **CI** (`.github/workflows/ci.yml`): valida datos, carteles, HTML y sintaxis de
  JavaScript, comprueba que no se reintroduzcan CDNs y escanea secretos con
  gitleaks. **CodeQL** analiza el JavaScript en cada push y semanalmente.

## Red

La página no hace peticiones de red salvo:

1. La carga del propio `datos/peliculas.json` desde el mismo origen.
2. El video de `archive.org`, y solo después de pulsar «Proyectar».
3. Los enlaces externos que la persona decida abrir.

## Alcance

Entra: XSS, inyección de datos en las fichas, manipulación de archivos locales,
fugas de datos por red.
No entra: disponibilidad o exactitud del catálogo de Internet Archive, enlaces
caídos, disputas sobre la licencia de una obra (se corrigen desde la ficha y el
JSON), ni ataques que requieran control del dispositivo de la víctima.
