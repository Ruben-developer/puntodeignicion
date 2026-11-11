# Pendientes

## Contenido

- [ ] Revisar una por una las licencias en la ficha de Internet Archive antes de
      dar el catálogo por cerrado. La licencia puede variar según el país y la
      digitalización concreta.
- [ ] Valorar si se reincorpora «Sal de la tierra» (1954), bilingüe en inglés y
      español; quedó fuera del criterio actual de audio íntegramente en español.
- [ ] Ampliar el catálogo con más documentales, noticiarios y cine con audio
      íntegramente en español, siempre con fuente y licencia verificables.
- [ ] Incorporar un campo de "notas de la copia" (restauración, intertítulos,
      calidad) para separar la información de la obra de la del archivo.

## Producto

- [ ] Añadir búsqueda por año y por país, además de la búsqueda libre actual.
- [ ] Guardar filtros en la URL (`?q=…&cat=…`) para compartir una vista concreta.
- [ ] Añadir una vista de "obra anterior / siguiente" dentro de la ficha.
- [ ] Valorar una página de fuentes y otra de licencias, enlazadas desde el pie.
- [ ] Probar en beta los tres estilos (Taquilla, Nitrato e Incendio) y decidir si
      se mantienen todos, se ajusta alguno o queda uno como definitivo.

## Calidad

- [ ] Auditoría con lector de pantalla (NVDA o VoiceOver) en escritorio y móvil.
- [ ] Repetir la auditoría de contraste (WCAG AA) al añadir textos pequeños en
      cualquiera de los tres estilos; la última pasada dejó Taquilla, Nitrato e
      Incendio por encima de 4,5:1.
- [ ] Pruebas en navegadores antiguos: comprobar `dialog`, `aspect-ratio`,
      `line-clamp` y `backdrop-filter`.
- [ ] Añadir un flujo programado que compruebe enlaces de Internet Archive y
      avise de los que devuelvan error.
- [ ] Añadir pruebas de extremo a extremo para buscar, filtrar y abrir una ficha.

## Operación

- [x] Publicar la beta en Cloudflare Workers (`puntodeignicion-beta.antarquia.cl`).
- [ ] Publicar producción en `puntodeignicion.antarquia.cl` (merge a `main`).
- [x] Añadir cabeceras de seguridad, CodeQL y `404.html`.
- [ ] Retirar GitHub Pages una vez validada la producción.
- [ ] Rotar el token de Cloudflare compartido durante la migración.
- [ ] Activar la rama `main` como protegida y exigir el CI de `develop`.
- [ ] Revisar el certificado y la URL canónica si se mueve el repositorio.
