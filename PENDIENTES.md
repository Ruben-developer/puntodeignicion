# Pendientes

## Contenido

- [ ] Revisar una por una las licencias en la ficha de Internet Archive antes de
      dar el catálogo por cerrado. La licencia puede variar según el país y la
      digitalización concreta.
- [ ] Añadir subtítulos en español a las obras que hoy no los incluyen. No se
      deben enlazar subtítulos de dudosa procedencia.
- [ ] Ampliar el catálogo con más documentales, noticiarios y cine de animación,
      siempre con fuente y licencia verificables.
- [ ] Incorporar un campo de "notas de la copia" (restauración, intertítulos,
      calidad) para separar la información de la obra de la del archivo.

## Producto

- [ ] Añadir búsqueda por año y por país, además de la búsqueda libre actual.
- [ ] Guardar filtros en la URL (`?q=…&cat=…`) para compartir una vista concreta.
- [ ] Añadir una vista de "obra anterior / siguiente" dentro de la ficha.
- [ ] Valorar una página de fuentes y otra de licencias, enlazadas desde el pie.

## Calidad

- [ ] Auditoría con lector de pantalla (NVDA o VoiceOver) en escritorio y móvil.
- [ ] Revisar contraste de los textos pequeños sobre el fondo sepia.
- [ ] Pruebas en navegadores antiguos: comprobar `dialog`, `aspect-ratio`,
      `line-clamp` y `backdrop-filter`.
- [ ] Añadir un flujo programado que compruebe enlaces de Internet Archive y
      avise de los que devuelvan error.
- [ ] Añadir pruebas de extremo a extremo para buscar, filtrar y abrir una ficha.

## Operación

- [ ] Configurar GitHub Pages con Source: GitHub Actions.
- [ ] Activar la rama `main` como protegida y exigir el CI de `develop`.
- [ ] Revisar el certificado y la URL canónica si se mueve el repositorio.
