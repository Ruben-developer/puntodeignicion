# Videoteca Ácrata Punto de Ignición

Archivo fílmico libre dedicado al cine obrero, las revueltas, los documentales
políticos y la memoria anarquista. Sitio estático publicado en Cloudflare
Workers: sin cuentas, sin rastreo, sin publicidad y sin dependencias externas en
tiempo de ejecución.

**Producción:** <https://puntodeignicion.antarquia.cl/>
**Beta:** <https://puntodeignicion-beta.antarquia.cl/>

## Qué contiene

- Catálogo de **30 obras** con audio íntegramente en español, alojadas en
  Internet Archive, con enlaces reales de reproducción y descarga. Abarcan de
  1936 a 2026; las obras mudas, en inglés o bilingües quedan fuera de este
  criterio. El idioma se comprobó con reconocimiento automático del habla sobre
  muestras de cada película, no solo con las etiquetas de metadatos.
- Fichas con dirección, año, país, idioma, subtítulos, tamaño, licencia y fuente
  original.
- Buscador por título, dirección, país, tema o sinopsis; filtros por categoría
  y orden por año o título.
- Reproductor que carga el video de Internet Archive solo cuando se pulsa
  «Proyectar».
- Enlaces profundos a cada ficha (`#p=<id>`) y botón para copiar el enlace.
- Carteles SVG generados de forma determinista desde `datos/peliculas.json`.
- Interfaz responsive, navegación por teclado, foco visible, `prefers-reduced-motion`
  y estilos de impresión.
- CSP estricta, sin `eval`, sin manejadores inline y sin CDNs.

> Este sitio **no aloja copias de las películas**. Enlaza a los archivos públicos
> de Internet Archive y muestra la licencia de cada obra. No se inventan enlaces
> magnet ni se simulan descargas.

## Dónde se reproducen y descargan

El catálogo reúne 30 obras entre 1936 y 2026. Cada ficha enlaza al MP4 alojado
en Internet Archive y al mismo archivo para su descarga:

| Categoría | Obras |
| --- | ---: |
| Documentales Libres | 14 |
| Memoria Obrera | 9 |
| Revueltas Históricas | 4 |
| Propaganda y Revuelta | 3 |

La lista completa, con título, año, duración, licencia y enlaces, está en
[`datos/peliculas.json`](datos/peliculas.json). Al pulsar «Proyectar», el
navegador solicita el MP4 directamente a `archive.org`, que redirige a un nodo
de descarga `dn*.us.archive.org`. El botón «Descargar» apunta al mismo archivo.
En ambos casos la copia vive en Internet Archive, no en este sitio.

## Desarrollo local

El catálogo se carga con `fetch`, así que hace falta servirlo por HTTP (abrir
`index.html` con `file://` no funciona):

```bash
npm ci
npm run servir          # servidor simple sobre el código fuente
npm run dev             # build + wrangler dev (réplica de Workers)
```

Abre <http://localhost:8000> o la URL que indique `wrangler dev`.

## Validación

```bash
npm test
```

El comando ejecuta:

1. `node scripts/validar.mjs` — campos obligatorios, IDs únicos, años, rutas
   locales, carteles existentes y enlaces `https://archive.org/download/…` o
   `/details/…`.
2. `node scripts/generar-posters.mjs --check` — comprueba que los carteles SVG
   coinciden con los datos.
3. `node --check app.js` — sintaxis del JavaScript.
4. `npx html-validate@9 index.html 404.html` — validación del HTML.

Para regenerar los carteles después de cambiar el catálogo:

```bash
npm run posters
```

## Datos

Todas las obras viven en [`datos/peliculas.json`](datos/peliculas.json). Cada
entrada usa estos campos:

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `id` | texto | Slug único; también nombra el cartel y el enlace profundo |
| `titulo` | texto | Título en español |
| `tituloOriginal` | texto | Título original |
| `categoria` | texto | Una de las categorías del catálogo |
| `anio` | entero | Año de producción |
| `duracion` | texto | Duración legible |
| `director` | texto | Dirección o realización |
| `pais` | texto | País de producción |
| `sinopsis` | texto | Resumen breve para la tarjeta |
| `descripcion` | texto | Texto largo de la ficha |
| `poster` | texto | Ruta local `assets/posters/<id>.svg` |
| `video` | URL | Archivo de video en `archive.org/download/` |
| `descarga` | URL | Archivo de descarga en `archive.org/download/` |
| `tamano` | texto | Tamaño del archivo |
| `fuente` | URL | Ficha original en `archive.org/details/` |
| `licencia` | texto | Licencia legible |
| `licenciaUrl` | URL | Texto de la licencia |
| `idioma` | texto | Idioma o condición del audio |
| `subtitulos` | texto | Disponibilidad de subtítulos |

El cartel debe llamarse exactamente como el `id` y generarse con
`npm run posters`; la validación falla si no coinciden.

## Estructura

```text
├── index.html
├── 404.html
├── styles.css
├── app.js
├── _headers               # cabeceras de seguridad de Workers
├── assets/
│   ├── fonts.css          # tipografías auto-hospedadas
│   ├── fonts/             # WOFF2 + textos de licencia
│   ├── posters/           # carteles SVG generados
│   ├── logo-vapi.png
│   ├── favicon.png
│   └── apple-touch-icon.png
├── datos/
│   └── peliculas.json
├── scripts/
│   ├── build.mjs          # copia lo publicable a dist/
│   ├── validar.mjs
│   └── generar-posters.mjs
├── .github/
│   ├── workflows/ci.yml
│   ├── workflows/deploy-beta.yml
│   ├── workflows/deploy-workers.yml
│   ├── workflows/codeql.yml
│   └── dependabot.yml
├── wrangler.jsonc         # Worker de producción
├── wrangler.beta.jsonc    # Worker de beta
├── LICENSE
├── SECURITY.md
├── THIRD-PARTY-NOTICES.md
├── PENDIENTES.md
├── robots.txt
└── sitemap.xml
```

## Despliegue

| Rama | Destino | Workflow |
| --- | --- | --- |
| `develop` | `puntodeignicion-beta.antarquia.cl` | `deploy-beta.yml` |
| `main` | `puntodeignicion.antarquia.cl` | `deploy-workers.yml` |

Ambos flujos ejecutan `npm test`, construyen `dist/` y despliegan con
`wrangler`. La beta se construye con `npm run build:beta`, que añade
`X-Robots-Tag: noindex` y cierra `robots.txt` para que no se indexe.

Los dominios se declaran en `wrangler.jsonc` y `wrangler.beta.jsonc` con
`custom_domain: true`: Cloudflare crea el registro DNS y el certificado al
desplegar. No hay que tocar el panel de DNS a mano.

El sitio no usa rutas por `pathname` (las fichas son `#p=<id>`), así que el
Worker sirve `404.html` para cualquier ruta inexistente en vez de devolver la
portada.

## Licencias

- El código de este sitio se publica bajo licencia MIT; ver [`LICENSE`](LICENSE).
- Cada película conserva su propia licencia. Las fichas enlazan a la licencia y
  a la fuente original. Ver [`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md).
- Las tipografías son SIL Open Font License 1.1 y Apache 2.0; los textos están
  en `assets/fonts/`.

## Seguridad

El sitio es estático y no recibe datos. La CSP limita los recursos al propio
origen y los videos a `archive.org`. Las cabeceras HTTP (`_headers`) añaden
`frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`,
`Cross-Origin-*` y HSTS. CodeQL analiza el JavaScript en cada push. Para reportar
un problema, consulta [`SECURITY.md`](SECURITY.md).
