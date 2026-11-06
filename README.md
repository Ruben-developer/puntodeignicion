# Videoteca Ácrata Punto de Ignición

Archivo fílmico libre dedicado al cine obrero, las revueltas, los documentales
políticos y la memoria anarquista. Sitio estático pensado para GitHub Pages:
sin cuentas, sin rastreo, sin publicidad y sin dependencias externas en tiempo
de ejecución.

**URL de producción:** <https://ruben-developer.github.io/puntodeignicion/>

## Qué contiene

- Catálogo de 12 películas, documentales y noticiarios alojados en Internet
  Archive, con enlaces reales de reproducción y descarga.
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

## Desarrollo local

El catálogo se carga con `fetch`, así que hace falta servirlo por HTTP (abrir
`index.html` con `file://` no funciona):

```bash
npm ci
npm run servir
```

Abre <http://localhost:8000>.

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
4. `npx html-validate@9 index.html` — validación del HTML.

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
├── styles.css
├── app.js
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
│   ├── validar.mjs
│   └── generar-posters.mjs
├── .github/
│   ├── workflows/ci.yml
│   ├── workflows/deploy.yml
│   └── dependabot.yml
├── LICENSE
├── SECURITY.md
├── THIRD-PARTY-NOTICES.md
├── PENDIENTES.md
├── robots.txt
└── sitemap.xml
```

## Despliegue

GitHub Actions publica en GitHub Pages al hacer `push` a `main`. El flujo
`.github/workflows/deploy.yml` valida el catálogo, comprueba los carteles y sube
el sitio como artefacto. `develop` es la rama de revisión: el flujo de CI se
ejecuta en cada pull request y en cada push a esa rama.

En el repositorio de GitHub hay que configurar **Settings → Pages → Source:
GitHub Actions**.

## Licencias

- El código de este sitio se publica bajo licencia MIT; ver [`LICENSE`](LICENSE).
- Cada película conserva su propia licencia. Las fichas enlazan a la licencia y
  a la fuente original. Ver [`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md).
- Las tipografías son SIL Open Font License 1.1 y Apache 2.0; los textos están
  en `assets/fonts/`.

## Seguridad

El sitio es estático y no recibe datos. La CSP limita los recursos al propio
origen y los videos a `archive.org`. Para reportar un problema, consulta
[`SECURITY.md`](SECURITY.md).
