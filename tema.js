/* Selector de estilo visual de la Videoteca.
   Se carga en el <head>, antes de las hojas de estilo, para aplicar el tema
   guardado sin parpadeo. No usa dependencias ni eval. */
(() => {
  'use strict';

  const CLAVE = 'vapi-tema';
  const TEMAS = ['nitrato', 'plata', 'cianotipo', 'ambar', 'consigna'];
  const NOMBRES = {
    nitrato: 'Nitrato',
    plata: 'Plata',
    cianotipo: 'Cianotipo',
    ambar: 'Ámbar',
    consigna: 'Consigna'
  };
  const COLORES = {
    nitrato: '#0b0b0a',
    plata: '#11171a',
    cianotipo: '#061a2b',
    ambar: '#17100a',
    consigna: '#0a0908'
  };
  const CARPETAS = {
    nitrato: '',
    plata: 'plata/',
    cianotipo: 'cianotipo/',
    ambar: 'ambar/',
    consigna: 'consigna/'
  };

  const raiz = document.documentElement;
  let actual = 'nitrato';

  function leerPreferencia() {
    /* El parámetro ?tema= sirve para previsualizar una sala sin tocar la
       preferencia guardada; por eso gana sobre localStorage. */
    try {
      const parametro = new URLSearchParams(window.location.search).get('tema');
      if (TEMAS.includes(parametro)) return parametro;
    } catch {
      /* Sin URL válida: se sigue con la preferencia guardada. */
    }
    try {
      const guardado = window.localStorage.getItem(CLAVE);
      if (TEMAS.includes(guardado)) return guardado;
    } catch {
      /* Sin almacenamiento: se usa el tema por defecto. */
    }
    return 'nitrato';
  }

  /* Devuelve la ruta del cartel del tema pedido a partir de la ruta base
     (assets/posters/<id>.svg). Nitrato vive en la raíz; las demás salas,
     en su propia carpeta. */
  function cartel(ruta, tema = actual) {
    const base = 'assets/posters/';
    if (typeof ruta !== 'string' || !ruta.startsWith(base)) return ruta;
    const archivo = ruta.slice(base.length);
    if (!archivo || archivo.includes('/')) return ruta;
    return `${base}${CARPETAS[tema] || ''}${archivo}`;
  }

  function aplicar(tema, opciones = {}) {
    const siguiente = TEMAS.includes(tema) ? tema : 'nitrato';
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
