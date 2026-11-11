/* Selector de estilo visual de la Videoteca.
   Se carga en el <head>, antes de las hojas de estilo, para aplicar el tema
   guardado sin parpadeo. No usa dependencias ni eval. */
(() => {
  'use strict';

  const CLAVE = 'vapi-tema';
  const TEMAS = ['taquilla', 'nitrato', 'incendio'];
  const NOMBRES = {
    taquilla: 'Taquilla',
    nitrato: 'Nitrato',
    incendio: 'Incendio'
  };
  const COLORES = {
    taquilla: '#0c1a17',
    nitrato: '#0b0b0a',
    incendio: '#0d0806'
  };
  const CARPETAS = {
    taquilla: '',
    nitrato: 'nitrato/',
    incendio: 'incendio/'
  };

  const raiz = document.documentElement;
  let actual = 'taquilla';

  function leerPreferencia() {
    try {
      const guardado = window.localStorage.getItem(CLAVE);
      if (TEMAS.includes(guardado)) return guardado;
    } catch {
      /* Sin almacenamiento: se usa el tema por defecto. */
    }
    try {
      const parametro = new URLSearchParams(window.location.search).get('tema');
      if (TEMAS.includes(parametro)) return parametro;
    } catch {
      /* Sin URL válida: se usa el tema por defecto. */
    }
    return 'taquilla';
  }

  /* Devuelve la ruta del cartel del tema pedido a partir de la ruta base
     (assets/posters/<id>.svg). */
  function cartel(ruta, tema = actual) {
    const base = 'assets/posters/';
    if (typeof ruta !== 'string' || !ruta.startsWith(base)) return ruta;
    const archivo = ruta.slice(base.length);
    if (!archivo || archivo.includes('/')) return ruta;
    return `${base}${CARPETAS[tema] || ''}${archivo}`;
  }

  function aplicar(tema, opciones = {}) {
    const siguiente = TEMAS.includes(tema) ? tema : 'taquilla';
    const anterior = actual;
    actual = siguiente;
    raiz.dataset.tema = siguiente;

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', COLORES[siguiente]);

    if (opciones.persistir !== false) {
      try {
        window.localStorage.setItem(CLAVE, siguiente);
      } catch {
        /* El tema sigue activo aunque no se pueda recordar. */
      }
    }

    if (anterior !== siguiente) {
      document.dispatchEvent(new CustomEvent('vapi:tema', {
        detail: { tema: siguiente, anterior }
      }));
    }

    return siguiente;
  }

  window.VAPITema = {
    TEMAS,
    NOMBRES,
    actual: () => actual,
    aplicar,
    cartel
  };

  aplicar(leerPreferencia(), { persistir: false });
})();
