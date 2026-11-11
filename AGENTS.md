# AGENTS.md — Punto de Ignición

## Qué es

Videoteca Ácrata Punto de Ignición: catálogo de cine obrero, revueltas,
documentales y memoria anarquista, con enlaces a Internet Archive.

- **Producción:** <https://puntodeignicion.antarquia.cl/> (`main`)
- **Beta:** <https://puntodeignicion-beta.antarquia.cl/> (`develop`)

## Stack

HTML, CSS y JavaScript vanilla. Sin framework, sin CDNs y sin fuentes externas.
El catálogo vive en `datos/peliculas.json`; los carteles se generan como SVG en
`assets/posters/`.

## Comandos

```bash
npm test             # validar + carteles + JS + HTML
npm run build        # dist/ de producción
npm run build:beta   # dist/ con noindex
npm run dev
npm run deploy:beta
npm run deploy       # solo con OK
```

## Rutas y hosting

- Las fichas usan `#p=<id>`. **No introduzcas rutas por `pathname`** ni hash
  routing nuevo: el hash actual es parte del diseño.
- Workers con `not_found_handling: 404-page`; `404.html` es la página real.
- `_headers` define la CSP y las cabeceras. Si cambias una, cambia también la
  meta CSP de `index.html` para que no se bloqueen entre sí.

## Reglas

- No alojas copias de las películas: solo enlazas a Archive.
- `poster` debe ser `assets/posters/<id>.svg` y generarse con `npm run posters`.
- `video` y `descarga` deben ser `https://archive.org/download/...` con
  extensión de video; `fuente`, `https://archive.org/details/...`.
- La beta debe seguir con `X-Robots-Tag: noindex` y `robots.txt` cerrado.
- Actualiza `README.md`, `SECURITY.md` y `PENDIENTES.md` si cambia el modelo.

## Agentes y skills

- Skill `antarquia-sitios`: convenciones, Workers, cabeceras y verificación.
- Skill `antarquia-contenido`: esquema del catálogo y licencias.
- `antarquia-qa` para revisar; `antarquia-ops` para desplegar.
