// Valida el catálogo y los recursos locales antes de publicar.
// Uso: node scripts/validar.mjs
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const raiz = new URL('../', import.meta.url);
const errores = [];

const leerTexto = (ruta) => {
  try {
    return readFileSync(new URL(ruta, raiz), 'utf8');
  } catch (error) {
    errores.push(`${ruta}: no se pudo leer (${error.message})`);
    return '';
  }
};

const existe = (ruta) => existsSync(fileURLToPath(new URL(ruta, raiz)));

const esTexto = (valor) => typeof valor === 'string' && valor.trim().length > 0;

const esEntero = (valor, minimo, maximo) =>
  Number.isInteger(valor) && valor >= minimo && valor <= maximo;

const urlSegura = (valor) => {
  try {
    return new URL(valor);
  } catch {
    return null;
  }
};

// Rutas locales: sin protocolo, sin «..» y dentro del repositorio.
const rutaLocal = (valor, donde, campo) => {
  if (!esTexto(valor)) {
    errores.push(`${donde}: falta «${campo}»`);
    return;
  }
  if (/^https?:\/\//i.test(valor)) {
    errores.push(`${donde}: «${campo}» debe ser una ruta local, no una URL`);
    return;
  }
  if (valor.startsWith('/') || valor.split('/').includes('..')) {
    errores.push(`${donde}: «${campo}» debe ser una ruta relativa dentro del repositorio («${valor}»)`);
    return;
  }
  if (!existe(valor)) errores.push(`${donde}: no existe el archivo «${valor}»`);
};

const campoUrl = (valor, donde, campo, host, prefijo) => {
  if (!esTexto(valor)) {
    errores.push(`${donde}: falta «${campo}»`);
    return;
  }
  const url = urlSegura(valor);
  if (!url) {
    errores.push(`${donde}: «${campo}» no es una URL válida («${valor}»)`);
    return;
  }
  if (url.protocol !== 'https:') {
    errores.push(`${donde}: «${campo}» debe usar https («${valor}»)`);
  }
  if (host && url.hostname !== host) {
    errores.push(`${donde}: «${campo}» debe apuntar a ${host} («${url.hostname}»)`);
  }
  if (prefijo && !url.pathname.startsWith(prefijo)) {
    errores.push(`${donde}: «${campo}» debe empezar por ${prefijo} («${url.pathname}»)`);
  }
};

const unicos = (lista, campo, archivo) => {
  const vistos = new Set();
  lista.forEach((item, indice) => {
    const valor = item[campo];
    if (!esTexto(valor)) return;
    if (vistos.has(valor)) errores.push(`${archivo}[${indice}]: «${campo}» repetido («${valor}»)`);
    vistos.add(valor);
  });
};

/* ------------------------------------------------------------
   Catálogo
   ------------------------------------------------------------ */

const rutaDatos = 'datos/peliculas.json';
let peliculas = [];

try {
  peliculas = JSON.parse(readFileSync(new URL(rutaDatos, raiz), 'utf8'));
  if (!Array.isArray(peliculas)) {
    errores.push(`${rutaDatos}: debe ser una lista ([ ... ])`);
    peliculas = [];
  }
} catch (error) {
  errores.push(`${rutaDatos}: no es JSON válido (${error.message})`);
}

if (!peliculas.length && !errores.length) {
  errores.push(`${rutaDatos}: el catálogo está vacío`);
}

const anioActual = new Date().getFullYear();
const obligatorios = [
  'id',
  'titulo',
  'tituloOriginal',
  'categoria',
  'duracion',
  'director',
  'pais',
  'sinopsis',
  'descripcion',
  'tamano',
  'licencia',
  'idioma',
  'subtitulos'
];

peliculas.forEach((pelicula, indice) => {
  const donde = `${rutaDatos}[${indice}]${esTexto(pelicula.id) ? ` (${pelicula.id})` : ''}`;

  if (!pelicula || typeof pelicula !== 'object' || Array.isArray(pelicula)) {
    errores.push(`${donde}: cada entrada debe ser un objeto`);
    return;
  }

  for (const campo of obligatorios) {
    if (!esTexto(pelicula[campo])) errores.push(`${donde}: falta «${campo}»`);
  }

  if (esTexto(pelicula.id) && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pelicula.id)) {
    errores.push(`${donde}: «id» debe ser un slug en minúsculas (a-z, 0-9 y guiones)`);
  }

  if (!esEntero(pelicula.anio, 1888, anioActual + 1)) {
    errores.push(`${donde}: «anio» debe ser un entero entre 1888 y ${anioActual + 1}`);
  }

  if (esTexto(pelicula.poster)) {
    const esperado = `assets/posters/${pelicula.id}.svg`;
    if (pelicula.poster !== esperado) {
      errores.push(`${donde}: «poster» debe ser ${esperado} («${pelicula.poster}»)`);
    }
    rutaLocal(pelicula.poster, donde, 'poster');
  } else {
    errores.push(`${donde}: falta «poster»`);
  }

  campoUrl(pelicula.video, donde, 'video', 'archive.org', '/download/');
  campoUrl(pelicula.descarga, donde, 'descarga', 'archive.org', '/download/');
  campoUrl(pelicula.fuente, donde, 'fuente', 'archive.org', '/details/');

  if (esTexto(pelicula.video) && !/\.(mp4|m4v|webm|ogv)$/i.test(pelicula.video)) {
    errores.push(`${donde}: «video» debe apuntar a un archivo de video (.mp4, .m4v, .webm u .ogv)`);
  }

  if (esTexto(pelicula.licenciaUrl)) {
    const licencia = urlSegura(pelicula.licenciaUrl);
    if (!licencia || licencia.protocol !== 'https:') {
      errores.push(`${donde}: «licenciaUrl» debe ser una URL https válida`);
    }
  } else {
    errores.push(`${donde}: falta «licenciaUrl»`);
  }
});

unicos(peliculas, 'id', rutaDatos);
unicos(peliculas, 'titulo', rutaDatos);
unicos(peliculas, 'video', rutaDatos);

/* ------------------------------------------------------------
   Recursos del sitio
   ------------------------------------------------------------ */

const requeridos = [
  'index.html',
  'styles.css',
  'app.js',
  'assets/fonts.css',
  'assets/logo-vapi.png',
  'assets/favicon.png',
  'assets/apple-touch-icon.png',
  'robots.txt',
  'sitemap.xml'
];

for (const ruta of requeridos) {
  if (!existe(ruta)) errores.push(`falta el recurso «${ruta}»`);
}

const fuentesCss = leerTexto('assets/fonts.css');
if (fuentesCss) {
  const fuentes = [...fuentesCss.matchAll(/url\(['"]?([^'")]+)['"]?\)/g)].map((coincidencia) => coincidencia[1]);
  if (!fuentes.length) errores.push('assets/fonts.css: no declara ninguna tipografía');
  for (const fuente of fuentes) {
    if (/^https?:\/\//i.test(fuente) || fuente.startsWith('data:')) {
      errores.push(`assets/fonts.css: la fuente «${fuente}» no debe ser externa`);
      continue;
    }
    rutaLocal(`assets/${fuente}`, 'assets/fonts.css', 'src');
  }
}

const indexHtml = leerTexto('index.html');
if (indexHtml) {
  for (const recurso of ['assets/fonts.css', 'styles.css', 'app.js']) {
    if (!indexHtml.includes(recurso)) errores.push(`index.html: no referencia «${recurso}»`);
  }
  if (/<script\b[^>]+src=["']https?:\/\//i.test(indexHtml)) {
    errores.push('index.html: no debe cargar scripts externos');
  }
  const etiquetasLink = indexHtml.match(/<link\b[^>]*>/gi) || [];
  for (const etiqueta of etiquetasLink) {
    if (/rel=["'][^"']*stylesheet/i.test(etiqueta) && /href=["']https?:\/\//i.test(etiqueta)) {
      errores.push('index.html: no debe cargar hojas de estilo externas');
    }
  }
  if (/\sstyle=["']/i.test(indexHtml)) {
    errores.push('index.html: no debe usar atributos style en línea (la CSP solo permite CSS propio)');
  }
}

/* ------------------------------------------------------------
   Resultado
   ------------------------------------------------------------ */

if (errores.length) {
  console.error(`\n✗ ${errores.length} problema(s) en el archivo:\n`);
  errores.forEach((error) => console.error(`  - ${error}`));
  process.exit(1);
}

const categorias = new Set(peliculas.map((p) => p.categoria));
const anios = peliculas.map((p) => p.anio);
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

console.log(
  `✓ Catálogo válido: ${plural(peliculas.length, 'obra', 'obras')}, `
  + `${plural(categorias.size, 'categoría', 'categorías')} y `
  + `${Math.min(...anios)}–${Math.max(...anios)}. `
  + 'Todos los carteles y las rutas locales existen.'
);
