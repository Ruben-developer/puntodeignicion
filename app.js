/* Videoteca Ácrata Punto de Ignición — lógica del catálogo.
   Los datos viven en datos/peliculas.json. Este archivo se limita a
   cargarlos, filtrarlos, pintarlos y abrir la ficha de cada obra. */

(() => {
  'use strict';

  const $ = (selector, raiz = document) => raiz.querySelector(selector);
  const $$ = (selector, raiz = document) => [...raiz.querySelectorAll(selector)];

  const SVG = 'http://www.w3.org/2000/svg';
  const formateador = new Intl.NumberFormat('es');

  const estado = {
    peliculas: [],
    categoria: 'Todas',
    busqueda: '',
    orden: 'recientes',
    abierta: null
  };

  const normalizar = (valor) => String(valor ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const texto = (valor) => String(valor ?? '').trim();

  function icono(id) {
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('class', 'icono');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const uso = document.createElementNS(SVG, 'use');
    uso.setAttribute('href', `#${id}`);
    svg.append(uso);
    return svg;
  }

  /* ----------------------------------------------------------
     Carga y normalización de datos
     ---------------------------------------------------------- */

  function normalizarPelicula(pelicula) {
    const campos = [
      pelicula.titulo,
      pelicula.tituloOriginal,
      pelicula.categoria,
      pelicula.director,
      pelicula.pais,
      pelicula.sinopsis,
      pelicula.descripcion,
      pelicula.idioma,
      pelicula.licencia,
      pelicula.anio
    ];
    return {
      ...pelicula,
      busqueda: normalizar(campos.join(' '))
    };
  }

  async function cargarPeliculas() {
    const respuesta = await fetch('datos/peliculas.json', { cache: 'no-cache' });
    if (!respuesta.ok) throw new Error(`datos/peliculas.json: HTTP ${respuesta.status}`);
    const datos = await respuesta.json();
    if (!Array.isArray(datos)) throw new Error('datos/peliculas.json: se esperaba una lista');
    return datos.map(normalizarPelicula);
  }

  /* ----------------------------------------------------------
     Cifras de cabecera
     ---------------------------------------------------------- */

  function pintarEstadisticas() {
    const total = estado.peliculas.length;
    const categorias = new Set(estado.peliculas.map((p) => p.categoria));
    const libres = estado.peliculas.filter((p) => /dominio público|^cc\b/i.test(texto(p.licencia))).length;
    const anios = estado.peliculas
      .map((p) => Number(p.anio))
      .filter((anio) => Number.isInteger(anio));

    const obras = $('#statObras');
    const cats = $('#statCategorias');
    const lics = $('#statLicencias');
    const periodo = $('#statPeriodo');

    if (obras) obras.textContent = formateador.format(total);
    if (cats) cats.textContent = formateador.format(categorias.size);
    if (lics) lics.textContent = formateador.format(libres);
    if (periodo) {
      periodo.textContent = anios.length
        ? `${Math.min(...anios)}–${Math.max(...anios)}`
        : '—';
    }
  }

  /* ----------------------------------------------------------
     Filtros
     ---------------------------------------------------------- */

  function renderizarFiltros() {
    const contenedor = $('#filtros');
    if (!contenedor) return;
    contenedor.replaceChildren();

    const cuentas = new Map();
    for (const pelicula of estado.peliculas) {
      cuentas.set(pelicula.categoria, (cuentas.get(pelicula.categoria) || 0) + 1);
    }

    const categorias = ['Todas', ...[...cuentas.keys()].sort((a, b) => a.localeCompare(b, 'es'))];

    for (const categoria of categorias) {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'filtro';
      boton.dataset.categoria = categoria;
      boton.setAttribute('aria-pressed', String(categoria === estado.categoria));

      const nombre = document.createElement('span');
      nombre.textContent = categoria;

      const cuenta = document.createElement('span');
      cuenta.className = 'filtro-cuenta';
      cuenta.setAttribute('aria-hidden', 'true');
      cuenta.textContent = String(categoria === 'Todas' ? estado.peliculas.length : cuentas.get(categoria));

      boton.append(nombre, cuenta);
      contenedor.append(boton);
    }
  }

  function marcarFiltros() {
    $$('.filtro').forEach((boton) => {
      boton.setAttribute('aria-pressed', String(boton.dataset.categoria === estado.categoria));
    });
  }

  /* ----------------------------------------------------------
     Catálogo
     ---------------------------------------------------------- */

  function seleccionarPeliculas() {
    const consulta = normalizar(estado.busqueda.trim());
    const terminos = consulta.split(/\s+/).filter(Boolean);

    let lista = estado.peliculas;
    if (estado.categoria !== 'Todas') {
      lista = lista.filter((p) => p.categoria === estado.categoria);
    }
    if (terminos.length) {
      lista = lista.filter((p) => terminos.every((termino) => p.busqueda.includes(termino)));
    }

    const ordenadas = [...lista];
    ordenadas.sort((a, b) => {
      if (estado.orden === 'titulo') {
        return a.titulo.localeCompare(b.titulo, 'es', { sensitivity: 'base' });
      }
      const anioA = Number(a.anio) || 0;
      const anioB = Number(b.anio) || 0;
      const diferencia = estado.orden === 'antiguas' ? anioA - anioB : anioB - anioA;
      if (diferencia !== 0) return diferencia;
      return a.titulo.localeCompare(b.titulo, 'es', { sensitivity: 'base' });
    });
    return ordenadas;
  }

  function crearTarjeta(pelicula) {
    const articulo = document.createElement('article');
    articulo.className = 'tarjeta';

    const portada = document.createElement('button');
    portada.type = 'button';
    portada.className = 'tarjeta-portada';
    portada.dataset.abrir = pelicula.id;
    portada.setAttribute('aria-label', `Abrir la ficha de ${pelicula.titulo}`);

    const imagen = document.createElement('img');
    imagen.src = pelicula.poster;
    imagen.alt = '';
    imagen.width = 600;
    imagen.height = 900;
    imagen.loading = 'lazy';
    imagen.decoding = 'async';

    const anio = document.createElement('span');
    anio.className = 'tarjeta-anio';
    anio.textContent = Number.isInteger(pelicula.anio) ? String(pelicula.anio) : 's. f.';

    const senal = document.createElement('span');
    senal.className = 'tarjeta-play';
    senal.append(icono('i-play'));

    portada.append(imagen, anio, senal);

    const cuerpo = document.createElement('div');
    cuerpo.className = 'tarjeta-cuerpo';

    const categoria = document.createElement('p');
    categoria.className = 'tarjeta-cat';
    categoria.textContent = pelicula.categoria;

    const titulo = document.createElement('h3');
    titulo.className = 'tarjeta-titulo';
    const botonTitulo = document.createElement('button');
    botonTitulo.type = 'button';
    botonTitulo.className = 'tarjeta-boton';
    botonTitulo.dataset.abrir = pelicula.id;
    botonTitulo.textContent = pelicula.titulo;
    titulo.append(botonTitulo);

    const meta = document.createElement('p');
    meta.className = 'tarjeta-meta';
    meta.textContent = [pelicula.director, pelicula.pais].filter(Boolean).join(' · ');

    const sinopsis = document.createElement('p');
    sinopsis.className = 'tarjeta-sinopsis';
    sinopsis.textContent = pelicula.sinopsis;

    const pie = document.createElement('div');
    pie.className = 'tarjeta-pie';

    const licencia = document.createElement('span');
    licencia.className = 'tarjeta-licencia';
    licencia.textContent = pelicula.licencia;

    const descarga = document.createElement('a');
    descarga.className = 'tarjeta-descarga';
    descarga.href = pelicula.descarga;
    descarga.target = '_blank';
    descarga.rel = 'noopener noreferrer';
    descarga.setAttribute('aria-label', `Descargar ${pelicula.titulo} desde Internet Archive`);
    descarga.append(document.createTextNode('Descargar'), icono('i-download'));

    pie.append(licencia, descarga);
    cuerpo.append(categoria, titulo, meta, sinopsis, pie);
    articulo.append(portada, cuerpo);
    return articulo;
  }

  function renderizarCatalogo() {
    const rejilla = $('#catalogoGrid');
    const info = $('#resultadoInfo');
    const vacio = $('#sinResultados');
    if (!rejilla) return;

    const lista = seleccionarPeliculas();
    const total = estado.peliculas.length;
    const fragmento = document.createDocumentFragment();
    for (const pelicula of lista) fragmento.append(crearTarjeta(pelicula));
    rejilla.replaceChildren(fragmento);

    if (info) {
      if (!lista.length) {
        info.textContent = 'Sin coincidencias';
      } else if (lista.length === total && estado.categoria === 'Todas' && !estado.busqueda.trim()) {
        info.textContent = `${formateador.format(total)} obras en el archivo`;
      } else {
        info.textContent = `${formateador.format(lista.length)} de ${formateador.format(total)} obras`;
      }
    }

    if (vacio) vacio.hidden = lista.length !== 0;
    rejilla.hidden = lista.length === 0;
  }

  /* ----------------------------------------------------------
     Ficha y reproductor
     ---------------------------------------------------------- */

  const ficha = $('#ficha');
  const reproductor = $('#reproductor');
  const portadaReproductor = $('#reproductorPortada');
  const portadaImagen = $('#portadaReproductor');
  const errorReproductor = $('#reproductorError');
  const enlaceError = $('#enlaceError');

  function asignarTexto(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = texto(valor) || '—';
  }

  function limpiarReproductor() {
    if (!reproductor) return;
    reproductor.pause();
    reproductor.removeAttribute('src');
    reproductor.load();
    if (portadaReproductor) portadaReproductor.hidden = false;
    if (errorReproductor) errorReproductor.hidden = true;
  }

  function pintarFicha(pelicula) {
    asignarTexto('fichaCategoria', pelicula.categoria);
    asignarTexto('fichaTitulo', pelicula.titulo);

    const original = $('#fichaOriginal');
    if (original) {
      const distinto = texto(pelicula.tituloOriginal)
        && normalizar(pelicula.tituloOriginal) !== normalizar(pelicula.titulo);
      original.textContent = distinto ? pelicula.tituloOriginal : '';
      original.hidden = !distinto;
    }

    asignarTexto('fichaMeta', [pelicula.anio, pelicula.duracion, pelicula.pais].filter(Boolean).join(' · '));
    asignarTexto('fichaSinopsis', pelicula.sinopsis);
    asignarTexto('fichaDescripcion', pelicula.descripcion);
    asignarTexto('fichaDirector', pelicula.director);
    asignarTexto('fichaAnio', pelicula.anio);
    asignarTexto('fichaDuracion', pelicula.duracion);
    asignarTexto('fichaPais', pelicula.pais);
    asignarTexto('fichaIdioma', pelicula.idioma);
    asignarTexto('fichaSubtitulos', pelicula.subtitulos);
    asignarTexto('fichaTamano', pelicula.tamano);

    const licencia = $('#fichaLicencia');
    if (licencia) {
      licencia.href = pelicula.licenciaUrl;
      licencia.textContent = pelicula.licencia;
    }

    const descarga = $('#fichaDescarga');
    if (descarga) descarga.href = pelicula.descarga;

    const fuente = $('#fichaFuente');
    if (fuente) fuente.href = pelicula.fuente;

    let fuenteTexto = pelicula.fuente;
    try {
      const url = new URL(pelicula.fuente);
      fuenteTexto = `${url.hostname}${url.pathname}`;
    } catch {
      /* Se conserva el texto original. */
    }
    asignarTexto('fichaFuenteTexto', fuenteTexto);

    if (portadaImagen) {
      portadaImagen.src = pelicula.poster;
      portadaImagen.alt = `Cartel de ${pelicula.titulo}`;
    }
    if (enlaceError) enlaceError.href = pelicula.fuente;

    limpiarReproductor();

    const panel = $('.modal-panel', ficha);
    if (panel) panel.scrollTop = 0;
  }

  function abrirFicha(id) {
    if (!ficha) return;
    const pelicula = estado.peliculas.find((p) => p.id === id);
    if (!pelicula) return;

    if (estado.abierta && estado.abierta.id !== pelicula.id) limpiarReproductor();
    estado.abierta = pelicula;
    pintarFicha(pelicula);

    if (!ficha.open) ficha.showModal();
  }

  function proyectar() {
    const pelicula = estado.abierta;
    if (!pelicula || !reproductor) return;

    if (errorReproductor) errorReproductor.hidden = true;
    if (portadaReproductor) portadaReproductor.hidden = true;
    if (enlaceError) enlaceError.href = pelicula.fuente;

    reproductor.src = pelicula.video;
    reproductor.load();

    const intento = reproductor.play();
    if (intento && typeof intento.catch === 'function') {
      intento.catch(() => {
        /* Si el navegador bloquea la reproducción, quedan los controles
           nativos para que la persona pulse play. */
      });
    }
  }

  /* ----------------------------------------------------------
     Aviso flotante y enlace
     ---------------------------------------------------------- */

  let temporizadorAviso = 0;

  function avisar(mensaje) {
    const aviso = $('#aviso');
    if (!aviso) return;
    aviso.textContent = mensaje;
    aviso.hidden = false;
    window.clearTimeout(temporizadorAviso);
    window.requestAnimationFrame(() => aviso.classList.add('visible'));
    temporizadorAviso = window.setTimeout(() => {
      aviso.classList.remove('visible');
      window.setTimeout(() => { aviso.hidden = true; }, 260);
    }, 3200);
  }

  function enlaceDeFicha(pelicula) {
    const url = new URL(window.location.href);
    url.hash = `p=${encodeURIComponent(pelicula.id)}`;
    return url.href;
  }

  async function copiarEnlace() {
    const pelicula = estado.abierta;
    if (!pelicula) return;
    const enlace = enlaceDeFicha(pelicula);

    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error('sin portapapeles');
      await navigator.clipboard.writeText(enlace);
      avisar('Enlace de la ficha copiado. Compártelo donde haga falta.');
    } catch {
      const area = document.createElement('textarea');
      area.className = 'textarea-copia';
      area.value = enlace;
      area.setAttribute('readonly', '');
      document.body.append(area);
      area.select();
      let copiado = false;
      try {
        copiado = document.execCommand('copy');
      } catch {
        copiado = false;
      }
      area.remove();
      avisar(copiado
        ? 'Enlace de la ficha copiado. Compártelo donde haga falta.'
        : 'No se pudo copiar automáticamente. El enlace está en la barra del navegador al abrir la ficha.');
    }
  }

  /* ----------------------------------------------------------
     Enlaces profundos (#p=<id>)
     ---------------------------------------------------------- */

  function leerHash() {
    const coincidencia = /^#p=([a-z0-9-]+)$/i.exec(window.location.hash);
    if (!coincidencia) return;
    let id = coincidencia[1];
    try {
      id = decodeURIComponent(id);
    } catch {
      /* Se usa el valor tal cual. */
    }
    abrirFicha(id);
  }

  /* ----------------------------------------------------------
     Eventos
     ---------------------------------------------------------- */

  function conectarEventos() {
    document.addEventListener('click', (evento) => {
      const objetivo = evento.target instanceof Element ? evento.target : null;
      if (!objetivo) return;

      const botonAbrir = objetivo.closest('[data-abrir]');
      if (botonAbrir) {
        evento.preventDefault();
        abrirFicha(botonAbrir.dataset.abrir);
        return;
      }

      const botonFiltro = objetivo.closest('[data-categoria]');
      if (botonFiltro) {
        estado.categoria = botonFiltro.dataset.categoria || 'Todas';
        marcarFiltros();
        renderizarCatalogo();
      }
    });

    const buscador = $('#buscador');
    if (buscador) {
      buscador.addEventListener('input', () => {
        estado.busqueda = buscador.value;
        renderizarCatalogo();
      });
    }

    const orden = $('#orden');
    if (orden) {
      orden.addEventListener('change', () => {
        estado.orden = orden.value;
        renderizarCatalogo();
      });
    }

    const limpiar = $('#limpiarFiltros');
    if (limpiar) {
      limpiar.addEventListener('click', () => {
        estado.categoria = 'Todas';
        estado.busqueda = '';
        estado.orden = 'recientes';
        if (buscador) buscador.value = '';
        if (orden) orden.value = 'recientes';
        marcarFiltros();
        renderizarCatalogo();
        if (buscador) buscador.focus();
      });
    }

    if (ficha) {
      const cerrar = $('#cerrarFicha');
      if (cerrar) cerrar.addEventListener('click', () => ficha.close());

      ficha.addEventListener('click', (evento) => {
        if (evento.target === ficha) ficha.close();
      });

      ficha.addEventListener('close', () => {
        const abierta = estado.abierta;
        limpiarReproductor();
        estado.abierta = null;
        if (abierta && window.location.hash === `#p=${encodeURIComponent(abierta.id)}`) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      });
    }

    const proyectarBoton = $('#proyectar');
    if (proyectarBoton) proyectarBoton.addEventListener('click', proyectar);

    if (reproductor) {
      reproductor.addEventListener('error', () => {
        if (!estado.abierta) return;
        if (!reproductor.getAttribute('src')) return;
        if (errorReproductor) errorReproductor.hidden = false;
        if (enlaceError) enlaceError.href = estado.abierta.fuente;
      });
    }

    const copiar = $('#fichaCopiar');
    if (copiar) copiar.addEventListener('click', copiarEnlace);

    window.addEventListener('hashchange', leerHash);

    document.addEventListener('keydown', (evento) => {
      if (evento.key !== '/' || evento.defaultPrevented || evento.metaKey || evento.ctrlKey || evento.altKey) return;
      if (ficha && ficha.open) return;
      const objetivo = evento.target;
      if (objetivo instanceof HTMLElement
        && (objetivo.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(objetivo.tagName))) {
        return;
      }
      const buscadorCampo = $('#buscador');
      if (!buscadorCampo) return;
      evento.preventDefault();
      buscadorCampo.focus();
    });
  }

  /* ----------------------------------------------------------
     Arranque
     ---------------------------------------------------------- */

  async function iniciar() {
    const estadoCatalogo = $('#estadoCatalogo');
    conectarEventos();

    try {
      estado.peliculas = await cargarPeliculas();
      pintarEstadisticas();
      renderizarFiltros();
      renderizarCatalogo();
      if (estadoCatalogo) estadoCatalogo.hidden = true;
      leerHash();
    } catch (error) {
      console.error(error);
      if (estadoCatalogo) {
        estadoCatalogo.hidden = false;
        estadoCatalogo.classList.add('estado-error');
        estadoCatalogo.replaceChildren();
        estadoCatalogo.append('No se pudo cargar el archivo de películas. ');
        const enlace = document.createElement('a');
        enlace.href = 'datos/peliculas.json';
        enlace.textContent = 'Revisa datos/peliculas.json';
        estadoCatalogo.append(enlace, ' y sirve el sitio por HTTP (no abras index.html con file://).');
      }
      const info = $('#resultadoInfo');
      if (info) info.textContent = 'Archivo no disponible';
    }
  }

  iniciar();
})();
