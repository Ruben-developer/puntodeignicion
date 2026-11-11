// Genera los carteles SVG de cada obra a partir de datos/peliculas.json.
// Nitrato es la sala base y sus carteles viven en la raíz de assets/posters/;
// las demás salas usan su propia subcarpeta.
// Uso:
//   node scripts/generar-posters.mjs          # escribe las ocho salas
//   node scripts/generar-posters.mjs --check  # falla si algún cartel está desactualizado
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const raiz = new URL('../', import.meta.url);
const rutaDatos = new URL('datos/peliculas.json', raiz);
const soloCheck = process.argv.includes('--check');

const peliculas = JSON.parse(readFileSync(rutaDatos, 'utf8'));

const TEMAS = [
  'nitrato',
  'nitrato-rojo',
  'plata',
  'cianotipo',
  'ambar',
  'consigna',
  'trinchera',
  'bloque'
];
const CARPETAS = {
  nitrato: '',
  'nitrato-rojo': 'nitrato-rojo/',
  plata: 'plata/',
  cianotipo: 'cianotipo/',
  ambar: 'ambar/',
  consigna: 'consigna/',
  trinchera: 'trinchera/',
  bloque: 'bloque/'
};

const esc = (valor) => String(valor)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

/* Anchos por carácter (en em) de las fuentes de reserva más anchas
   (Liberation Serif y Liberation Sans, equivalentes a Times y Arial).
   Los carteles se sirven como <img>, así que no cargan las tipografías
   del sitio: conviene medir con la reserva ancha para que el texto quepa
   en cualquier sistema. */
const ANCHOS = {"serif":{"!":0.333,"\"":0.555,"#":0.5,"%":1,"&":0.833,"'":0.278,"(":0.333,")":0.333,",":0.25,"-":0.333,".":0.25,"/":0.278,"0":0.5,"1":0.5,"2":0.5,"3":0.5,"4":0.5,"5":0.5,"6":0.5,"7":0.5,"8":0.5,"9":0.5,":":0.333,";":0.333,"?":0.5,"A":0.722,"B":0.667,"C":0.722,"D":0.722,"E":0.667,"F":0.611,"G":0.778,"H":0.778,"I":0.389,"J":0.5,"K":0.778,"L":0.667,"M":0.944,"N":0.722,"O":0.778,"P":0.611,"Q":0.778,"R":0.722,"S":0.556,"T":0.667,"U":0.722,"V":0.722,"Y":0.722,"[":0.333,"]":0.333,"a":0.5,"b":0.556,"c":0.444,"d":0.556,"e":0.444,"f":0.333,"g":0.5,"h":0.556,"i":0.278,"j":0.333,"k":0.556,"l":0.278,"m":0.833,"n":0.556,"o":0.5,"p":0.556,"q":0.556,"r":0.444,"s":0.389,"t":0.333,"u":0.556,"v":0.5,"w":0.722,"x":0.5,"y":0.5,"z":0.444,"¡":0.333,"«":0.5,"·":0.334,"»":0.5,"¿":0.5,"É":0.667,"Ó":0.778,"×":0.57,"á":0.5,"è":0.444,"é":0.444,"í":0.278,"ñ":0.556,"ó":0.5,"ú":0.556,"–":0.5,"—":1,"“":0.5,"”":0.5,"…":1," ":0.28,"W":1.0},"sans":{"!":0.333,"\"":0.474,"#":0.556,"%":0.889,"&":0.722,"'":0.238,"(":0.333,")":0.333,",":0.278,"-":0.333,".":0.278,"/":0.278,"0":0.556,"1":0.556,"2":0.556,"3":0.556,"4":0.556,"5":0.556,"6":0.556,"7":0.556,"8":0.556,"9":0.556,":":0.333,";":0.333,"?":0.611,"A":0.722,"B":0.722,"C":0.722,"D":0.722,"E":0.667,"F":0.611,"G":0.778,"H":0.722,"I":0.278,"J":0.556,"K":0.722,"L":0.611,"M":0.833,"N":0.722,"O":0.778,"P":0.667,"Q":0.778,"R":0.722,"S":0.667,"T":0.611,"U":0.722,"V":0.667,"Y":0.667,"[":0.333,"]":0.333,"a":0.556,"b":0.611,"c":0.556,"d":0.611,"e":0.556,"f":0.333,"g":0.611,"h":0.611,"i":0.278,"j":0.278,"k":0.556,"l":0.278,"m":0.889,"n":0.611,"o":0.611,"p":0.611,"q":0.611,"r":0.389,"s":0.556,"t":0.333,"u":0.611,"v":0.556,"w":0.778,"x":0.556,"y":0.556,"z":0.5,"¡":0.333,"«":0.556,"·":0.333,"»":0.556,"¿":0.611,"É":0.667,"Ó":0.778,"×":0.584,"á":0.556,"è":0.556,"é":0.556,"í":0.278,"ñ":0.611,"ó":0.611,"ú":0.611,"–":0.556,"—":1,"“":0.5,"”":0.5,"…":1," ":0.28,"W":0.94}};

/* Los rótulos en caja alta de Trinchera y Bloque introducen vocales
   acentuadas que la tabla original no medía; se añaden con los mismos
   anchos que sus versales sin tilde. */
Object.assign(ANCHOS.serif, {
  'Á': 0.722, 'É': 0.667, 'Í': 0.389, 'Ó': 0.778, 'Ú': 0.722, 'Ñ': 0.722, 'Ü': 0.722
});
Object.assign(ANCHOS.sans, {
  'Á': 0.722, 'É': 0.667, 'Í': 0.278, 'Ó': 0.778, 'Ú': 0.722, 'Ñ': 0.722, 'Ü': 0.722
});

const ANCHO_POR_DEFECTO = { serif: 0.72, sans: 0.62 };

function anchoTexto(texto, estilo = 'serif') {
  const mapa = ANCHOS[estilo] || ANCHOS.serif;
  let total = 0;
  for (const caracter of texto) {
    total += mapa[caracter] ?? ANCHO_POR_DEFECTO[estilo] ?? 0.65;
  }
  return total;
}

function envolver(texto, tamano, ancho, estilo, espaciado) {
  const palabras = texto.split(/\s+/).filter(Boolean);
  if (!palabras.length) return [''];
  const lineas = [];
  let linea = '';
  for (const palabra of palabras) {
    const candidata = linea ? `${linea} ${palabra}` : palabra;
    const mide = anchoTexto(candidata, estilo) * tamano + espaciado * candidata.length;
    if (mide <= ancho || !linea) {
      linea = candidata;
    } else {
      lineas.push(linea);
      linea = palabra;
    }
  }
  if (linea) lineas.push(linea);
  return lineas;
}

function ajustarTitulo(titulo, opciones = {}) {
  const {
    ancho = 500,
    maximo = 60,
    minimo = 24,
    maxLineas = 3,
    estilo = 'serif',
    espaciado = 0
  } = opciones;
  const texto = titulo.toUpperCase();
  const palabraMasLarga = texto.split(/\s+/).reduce((maximoPalabra, palabra) =>
    anchoTexto(palabra, estilo) > anchoTexto(maximoPalabra, estilo) ? palabra : maximoPalabra, '');
  let tamano = titulo.length <= 18 ? maximo : titulo.length <= 34 ? Math.round(maximo * 0.84) : Math.round(maximo * 0.7);
  const disponible = ancho * 0.97;
  let lineas = envolver(texto, tamano, disponible, estilo, espaciado);
  while (
    (lineas.length > maxLineas || anchoTexto(palabraMasLarga, estilo) * tamano + espaciado * palabraMasLarga.length > disponible) &&
    tamano > minimo
  ) {
    tamano -= 1;
    lineas = envolver(texto, tamano, disponible, estilo, espaciado);
  }
  return { tamano, lineas, interlineado: Math.round(tamano * 1.08) };
}

/* Ajusta una línea secundaria (título original, créditos) al ancho disponible. */
function ajustarLinea(texto, opciones = {}) {
  const { ancho = 460, maximo = 15, minimo = 9, estilo = 'serif', espaciado = 0 } = opciones;
  let tamano = maximo;
  while (tamano > minimo && anchoTexto(texto, estilo) * tamano + espaciado * texto.length > ancho) {
    tamano -= 1;
  }
  return tamano;
}

function generarLineasTitulo(lineas, tamano, interlineado, primeraLinea) {
  return lineas.map((linea, i) =>
    `<tspan x="300" y="${primeraLinea + i * interlineado}">${esc(linea)}</tspan>`
  ).join('');
}

function motivo(categoria, rojo, oro, x = 300, y = 320, escala = 1) {
  const trazo = `fill="none" stroke="${rojo}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"`;
  const relleno = `fill="${oro}" opacity=".14"`;
  let dibujo = `
    <g>
      <circle cx="0" cy="0" r="120" ${relleno}/>
      <circle cx="0" cy="0" r="120" ${trazo}/>
      <path d="M0 -85 L25 -25 L90 -25 L38 12 L58 75 L0 38 L-58 75 L-38 12 L-90 -25 L-25 -25 Z" ${trazo}/>
    </g>`;

  if (categoria === 'Propaganda y Revuelta') {
    dibujo = `
      <g>
        <path d="M-120 -55 L15 -110 L15 110 L-120 55 Z" ${relleno}/>
        <path d="M-120 -55 L15 -110 L15 110 L-120 55 Z" ${trazo}/>
        <path d="M-80 55 L-55 55 L-55 140 L-80 140 Z" ${trazo}/>
        <path d="M-25 30 L-25 90" ${trazo}/>
        <path d="M50 -55 Q100 -55 100 0 Q100 55 50 55" ${trazo}/>
        <path d="M80 -90 Q150 -90 150 0 Q150 90 80 90" ${trazo} opacity=".55"/>
        <circle cx="45" cy="-45" r="8" fill="${oro}"/>
        <circle cx="45" cy="45" r="8" fill="${oro}"/>
      </g>`;
  } else if (categoria === 'Memoria Obrera') {
    dibujo = `
      <g>
        <path d="M-125 55 L-125 125 L125 125 L125 55 L75 20 L25 55 L-25 20 L-75 55 Z" ${relleno}/>
        <path d="M-125 55 L-125 125 L125 125 L125 55 L75 20 L25 55 L-25 20 L-75 55 Z" ${trazo}/>
        <path d="M-95 55 L-95 -75 L-65 -75 L-65 55" ${trazo}/>
        <path d="M-15 55 L-15 -115 L15 -115 L15 55" ${trazo}/>
        <path d="M65 55 L65 -60 L95 -60 L95 55" ${trazo}/>
        <path d="M-65 125 L-65 70 M0 125 L0 70 M65 125 L65 70" ${trazo} opacity=".65"/>
        <circle cx="-95" cy="-105" r="18" ${trazo} opacity=".7"/>
        <circle cx="-50" cy="-115" r="12" ${trazo} opacity=".5"/>
        <circle cx="0" cy="-150" r="22" ${trazo} opacity=".7"/>
        <circle cx="55" cy="-155" r="14" ${trazo} opacity=".5"/>
      </g>`;
  } else if (categoria === 'Revueltas Históricas') {
    dibujo = `
      <g>
        <path d="M0 -145 C55 -60 90 -20 90 35 C90 100 48 145 0 145 C-48 145 -90 100 -90 35 C-90 -20 -55 -60 0 -145 Z" ${relleno}/>
        <path d="M0 -145 C55 -60 90 -20 90 35 C90 100 48 145 0 145 C-48 145 -90 100 -90 35 C-90 -20 -55 -60 0 -145 Z" ${trazo}/>
        <path d="M0 -45 C28 5 42 28 42 58 C42 95 22 112 0 112 C-22 112 -42 95 -42 58 C-42 28 -28 5 0 -45 Z" ${trazo}/>
        <path d="M-160 95 L-115 95 M115 95 L160 95 M-150 45 L-118 45 M118 45 L150 45" ${trazo} opacity=".5"/>
        <circle cx="0" cy="35" r="6" fill="${oro}"/>
      </g>`;
  } else if (categoria === 'Ficción Subversiva') {
    dibujo = `
      <g>
        <path d="M-165 0 Q0 -115 165 0 Q0 115 -165 0 Z" ${relleno}/>
        <path d="M-165 0 Q0 -115 165 0 Q0 115 -165 0 Z" ${trazo}/>
        <circle cx="0" cy="0" r="62" ${trazo}/>
        <circle cx="0" cy="0" r="24" fill="${rojo}" opacity=".75"/>
        <circle cx="18" cy="-18" r="8" fill="${oro}"/>
        <path d="M-190 105 L-165 105 L-165 145 L-190 145 Z M-130 105 L-105 105 L-105 145 L-130 145 Z M-70 105 L-45 105 L-45 145 L-70 145 Z M-10 105 L15 105 L15 145 L-10 145 Z M50 105 L75 105 L75 145 L50 145 Z M110 105 L135 105 L135 145 L110 145 Z" ${trazo}/>
      </g>`;
  } else if (categoria === 'Documentales Libres') {
    dibujo = `
      <g>
        <rect x="-145" y="-55" width="250" height="145" rx="10" ${relleno}/>
        <rect x="-145" y="-55" width="250" height="145" rx="10" ${trazo}/>
        <path d="M-100 -55 L-100 -100 L-40 -100 L-40 -55" ${trazo}/>
        <circle cx="55" cy="18" r="58" ${trazo}/>
        <circle cx="55" cy="18" r="26" ${trazo}/>
        <circle cx="-75" cy="-110" r="30" ${trazo}/>
        <circle cx="10" cy="-115" r="24" ${trazo}/>
        <path d="M-105 90 L-105 145 M105 90 L105 145" ${trazo}/>
        <path d="M-45 125 L115 125" ${trazo} opacity=".55"/>
      </g>`;
  }

  return `<g transform="translate(${x} ${y}) scale(${escala})">${dibujo}</g>`;
}

/* ------------------------------------------------------------
   Sala 1 · Nitrato (base): cine mudo, ivory sobre negro, tira fílmica.
   La misma plantilla sirve para Nitrato rojo cambiando solo la paleta.
   ------------------------------------------------------------ */

const PALETA_NITRATO = {
  sala: 'Nitrato',
  fondo: '#0a0a09',
  tira: '#151513',
  agujero: '#060605',
  panel: '#0d0d0c',
  tinta: '#efe8d8',
  titulo: '#f2ecdc',
  rojo: '#a33124',
  rojoClaro: '#c8563f',
  media: '#cfc7b4',
  tenue: '#948c79'
};

const PALETA_NITRATO_ROJO = {
  sala: 'Nitrato rojo',
  fondo: '#0a0908',
  tira: '#161110',
  agujero: '#040303',
  panel: '#12100e',
  tinta: '#f1e3c8',
  titulo: '#f1e3c8',
  rojo: '#d02b16',
  rojoClaro: '#ef5a35',
  media: '#dcd0b8',
  tenue: '#b0a48c'
};

function crearNitrato(pelicula, paleta = PALETA_NITRATO) {
  const p = paleta;
  const { tamano, lineas, interlineado } = ajustarTitulo(pelicula.titulo, {
    ancho: 440,
    maximo: 56,
    minimo: 22,
    maxLineas: 4,
    estilo: 'serif',
    espaciado: 1.5
  });
  const primeraLinea = 662 - (lineas.length - 1) * interlineado;
  const titulo = generarLineasTitulo(lineas, tamano, interlineado, primeraLinea);
  const anio = Number.isInteger(pelicula.anio) ? String(pelicula.anio) : 's. f.';
  const categoria = esc(pelicula.categoria.toUpperCase());
  const licencia = esc(pelicula.licencia);
  const duracion = esc(pelicula.duracion);
  const director = esc(pelicula.director);
  const tituloOriginal = esc(pelicula.tituloOriginal);
  const id = esc(pelicula.id);

  const agujeros = Array.from({ length: 34 }, (_, i) =>
    `<circle cx="18" cy="${13 + i * 26}" r="4.2"/><circle cx="582" cy="${13 + i * 26}" r="4.2"/>`
  ).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900" width="600" height="900" role="img" aria-labelledby="titulo-${id} desc-${id}">
  <title id="titulo-${id}">Cartel de ${esc(pelicula.titulo)}</title>
  <desc id="desc-${id}">Cartel de la sala ${p.sala} para ${esc(pelicula.titulo)}, ${anio}, dirigida por ${director}.</desc>
  <defs>
    <pattern id="grano-n" width="8" height="8" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1" fill="${p.titulo}" opacity=".14"/>
    </pattern>
    <radialGradient id="vineta-n" cx=".5" cy=".42" r=".78">
      <stop offset="52%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity=".72"/>
    </radialGradient>
  </defs>

  <rect width="600" height="900" fill="${p.fondo}"/>
  <rect x="0" y="0" width="36" height="900" fill="${p.tira}"/>
  <rect x="564" y="0" width="36" height="900" fill="${p.tira}"/>
  <g fill="${p.agujero}">${agujeros}</g>

  <rect x="46" y="26" width="508" height="848" fill="${p.panel}" stroke="${p.tinta}" stroke-width="2" stroke-opacity=".55"/>
  <rect x="54" y="34" width="492" height="832" fill="none" stroke="${p.tinta}" stroke-width="1" stroke-opacity=".18"/>
  <rect x="54" y="34" width="492" height="832" fill="url(#grano-n)" opacity=".7"/>

  <g stroke="${p.tinta}" stroke-opacity=".055" stroke-width="1">
    <path d="M118 34V866"/>
    <path d="M171 34V866"/>
    <path d="M302 34V866"/>
    <path d="M417 34V866"/>
    <path d="M470 34V866"/>
  </g>
  <rect x="46" y="26" width="508" height="848" fill="url(#vineta-n)"/>

  <text x="300" y="68" text-anchor="middle" font-family="'Courier Prime', 'Courier New', monospace" font-size="15" letter-spacing="5" fill="${p.tinta}">VIDEOTECA ÁCRATA</text>
  <text x="300" y="90" text-anchor="middle" font-family="'Courier Prime', 'Courier New', monospace" font-size="9" letter-spacing="3" fill="${p.rojo}">PUNTO DE IGNICIÓN · ARCHIVO FÍLMICO LIBRE</text>
  <path d="M86 106 L514 106" stroke="${p.tinta}" stroke-width="1" stroke-opacity=".42"/>

  <text x="300" y="596" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="210" fill="none" stroke="${p.tinta}" stroke-width="2" stroke-opacity=".09">${anio}</text>
  ${motivo(pelicula.categoria, p.tinta, p.rojoClaro, 300, 322, 0.8)}

  <text x="300" y="476" text-anchor="middle" font-family="'Courier Prime', 'Courier New', monospace" font-size="12" letter-spacing="4" fill="${p.rojoClaro}">${categoria}</text>
  <text text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="${tamano}" letter-spacing="1.5" fill="${p.titulo}">${titulo}</text>
  <text x="300" y="712" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="${ajustarLinea(pelicula.tituloOriginal, { ancho: 420, maximo: 14, estilo: 'serif' })}" fill="${p.media}" opacity=".8">${tituloOriginal}</text>

  <path d="M80 732 L520 732" stroke="${p.tinta}" stroke-width="1" stroke-opacity=".5"/>
  <text x="80" y="762" font-family="'Courier Prime', 'Courier New', monospace" font-size="12" letter-spacing="2" fill="${p.tinta}">${anio} · ${duracion}</text>
  <text x="520" y="762" text-anchor="end" font-family="'Courier Prime', 'Courier New', monospace" font-size="10" letter-spacing="1" fill="${p.media}">${licencia}</text>
  <text x="80" y="796" font-family="Georgia, 'Times New Roman', serif" font-size="17" fill="${p.tinta}">Dir. ${director}</text>
  <text x="520" y="796" text-anchor="end" font-family="'Courier Prime', 'Courier New', monospace" font-size="10" letter-spacing="2" fill="${p.rojoClaro}">ARCHIVO FÍLMICO</text>

  <text x="300" y="846" text-anchor="middle" font-family="'Courier Prime', 'Courier New', monospace" font-size="9" letter-spacing="3" fill="${p.tenue}">PUNTO DE IGNICIÓN · SIN PATRONES</text>
</svg>
`;
}

/* ------------------------------------------------------------
   Sala 2 · Plata: copia en gelatina de plata, grises fríos y líneas finas
   ------------------------------------------------------------ */

function crearPlata(pelicula) {
  const { tamano, lineas, interlineado } = ajustarTitulo(pelicula.titulo, {
    ancho: 462,
    maximo: 62,
    minimo: 20,
    estilo: 'sans',
    espaciado: 0.5
  });
  const primeraLinea = 728 - (lineas.length - 1) * interlineado;
  const titulo = lineas.map((linea, i) =>
    `<tspan x="58" y="${primeraLinea + i * interlineado}">${esc(linea)}</tspan>`
  ).join('');
  const anio = Number.isInteger(pelicula.anio) ? String(pelicula.anio) : 's. f.';
  const categoria = esc(pelicula.categoria.toUpperCase());
  const licencia = esc(pelicula.licencia);
  const duracion = esc(pelicula.duracion);
  const director = esc(pelicula.director);
  const tituloOriginal = esc(pelicula.tituloOriginal);
  const id = esc(pelicula.id);

  const esquina = (x, y, dx, dy) =>
    `<path d="M${x} ${y + dy * 24} L${x} ${y} L${x + dx * 24} ${y}" fill="none" stroke="#1a2225" stroke-width="2"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900" width="600" height="900" role="img" aria-labelledby="titulo-${id} desc-${id}">
  <title id="titulo-${id}">Cartel de ${esc(pelicula.titulo)}</title>
  <desc id="desc-${id}">Cartel de la sala Plata para ${esc(pelicula.titulo)}, ${anio}, dirigida por ${director}.</desc>
  <defs>
    <linearGradient id="plata-foto-${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f2f6f6"/>
      <stop offset=".45" stop-color="#c9d3d3"/>
      <stop offset="1" stop-color="#8d9c9e"/>
    </linearGradient>
    <linearGradient id="plata-copia-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e4eae9"/>
      <stop offset="1" stop-color="#ccd5d4"/>
    </linearGradient>
    <pattern id="plata-trama-${id}" width="6" height="6" patternUnits="userSpaceOnUse">
      <circle cx="1.5" cy="1.5" r=".7" fill="#1a2225" opacity=".1"/>
    </pattern>
  </defs>

  <rect width="600" height="900" fill="#0c1214"/>
  <text x="36" y="30" font-family="'Bebas Neue', 'Arial Narrow', 'Helvetica Neue', Arial, sans-serif" font-size="15" letter-spacing="5" fill="#dbe3e3">VIDEOTECA ÁCRATA</text>
  <text x="564" y="30" text-anchor="end" font-family="'Courier Prime', 'Courier New', monospace" font-size="9" letter-spacing="2" fill="#93a4a8">COPIA DE ARCHIVO</text>
  <path d="M36 44 L564 44" stroke="#dbe3e3" stroke-width="1" stroke-opacity=".35"/>

  <rect x="36" y="58" width="528" height="804" fill="url(#plata-copia-${id})"/>
  <rect x="36" y="58" width="528" height="804" fill="url(#plata-trama-${id})"/>
  <rect x="36" y="58" width="528" height="804" fill="none" stroke="#0a0f11" stroke-width="1.5"/>

  <rect x="56" y="78" width="488" height="392" fill="url(#plata-foto-${id})"/>
  <g stroke="#2c3a3d" stroke-opacity=".16" stroke-width="1">
    <path d="M56 178 H544"/>
    <path d="M56 278 H544"/>
    <path d="M56 378 H544"/>
  </g>
  <circle cx="300" cy="274" r="128" fill="none" stroke="#2c3a3d" stroke-width="1" stroke-opacity=".45"/>
  <circle cx="300" cy="274" r="152" fill="none" stroke="#2c3a3d" stroke-width="1" stroke-opacity=".2"/>
  ${motivo(pelicula.categoria, '#2c3a3d', '#7f9296', 300, 274, 0.72)}
  <rect x="56" y="78" width="488" height="392" fill="none" stroke="#1a2225" stroke-width="1.5"/>
  ${esquina(56, 78, 1, 1)}${esquina(544, 78, -1, 1)}${esquina(56, 470, 1, -1)}${esquina(544, 470, -1, -1)}

  <text x="56" y="496" font-family="'Courier Prime', 'Courier New', monospace" font-size="9" letter-spacing="2.5" fill="#46565a">FOTOGRAMA · COPIA EN GELATINA DE PLATA</text>
  <text x="544" y="496" text-anchor="end" font-family="'Courier Prime', 'Courier New', monospace" font-size="9" letter-spacing="2" fill="#6b7c80">${anio}</text>

  <text x="58" y="${primeraLinea - tamano - 16}" font-family="'Courier Prime', 'Courier New', monospace" font-size="11" letter-spacing="4" fill="#6b7c80">${categoria}</text>
  <text text-anchor="start" font-family="'Bebas Neue', 'Arial Narrow', 'Helvetica Neue', Arial, sans-serif" font-weight="700" font-size="${tamano}" letter-spacing=".5" fill="#141a1c">${titulo}</text>
  <text x="58" y="${primeraLinea + (lineas.length - 1) * interlineado + 30}" font-family="'Playfair Display', Georgia, 'Times New Roman', serif" font-style="italic" font-size="${ajustarLinea(pelicula.tituloOriginal, { ancho: 480, maximo: 15, estilo: 'serif' })}" fill="#46565a">${tituloOriginal}</text>

  <path d="M58 772 L542 772" stroke="#1a2225" stroke-width="1" stroke-opacity=".45"/>
  <text x="58" y="800" font-family="'Courier Prime', 'Courier New', monospace" font-size="13" letter-spacing="1.5" fill="#1a2225">${anio} · ${duracion}</text>
  <text x="542" y="800" text-anchor="end" font-family="'Courier Prime', 'Courier New', monospace" font-size="10" letter-spacing="1" fill="#46565a">${licencia}</text>
  <text x="58" y="828" font-family="'Playfair Display', Georgia, 'Times New Roman', serif" font-size="17" fill="#1a2225">Dir. ${director}</text>
  <text x="542" y="828" text-anchor="end" font-family="'Courier Prime', 'Courier New', monospace" font-size="9" letter-spacing="2" fill="#6b7c80">ARCHIVO FÍLMICO</text>

  <text x="300" y="888" text-anchor="middle" font-family="'Courier Prime', 'Courier New', monospace" font-size="9" letter-spacing="3" fill="#6b7c80">PUNTO DE IGNICIÓN · SIN PATRONES</text>
</svg>
`;
}

/* ------------------------------------------------------------
   Sala 3 · Cianotipo: azul de Prusia, retícula y dibujo técnico
   ------------------------------------------------------------ */

function crearCianotipo(pelicula) {
  const { tamano, lineas, interlineado } = ajustarTitulo(pelicula.titulo, {
    ancho: 452,
    maximo: 58,
    minimo: 20,
    estilo: 'sans',
    espaciado: 1
  });
  const primeraLinea = 700 - (lineas.length - 1) * interlineado;
  const titulo = generarLineasTitulo(lineas, tamano, interlineado, primeraLinea);
  const anio = Number.isInteger(pelicula.anio) ? String(pelicula.anio) : 's. f.';
  const categoria = esc(pelicula.categoria.toUpperCase());
  const licencia = esc(pelicula.licencia);
  const duracion = esc(pelicula.duracion);
  const director = esc(pelicula.director);
  const tituloOriginal = esc(pelicula.tituloOriginal);
  const id = esc(pelicula.id);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900" width="600" height="900" role="img" aria-labelledby="titulo-${id} desc-${id}">
  <title id="titulo-${id}">Cartel de ${esc(pelicula.titulo)}</title>
  <desc id="desc-${id}">Cartel de la sala Cianotipo para ${esc(pelicula.titulo)}, ${anio}, dirigida por ${director}.</desc>
  <defs>
    <pattern id="cian-ret-${id}" width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M30 0H0V30" fill="none" stroke="#9fdcf0" stroke-width=".6" stroke-opacity=".16"/>
      <path d="M15 0V30M0 15H30" fill="none" stroke="#9fdcf0" stroke-width=".4" stroke-opacity=".07"/>
    </pattern>
    <radialGradient id="cian-luz-${id}" cx=".5" cy=".3" r=".7">
      <stop offset="0" stop-color="#5fc8e6" stop-opacity=".16"/>
      <stop offset="1" stop-color="#5fc8e6" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="600" height="900" fill="#061a2b"/>
  <rect width="600" height="900" fill="url(#cian-luz-${id})"/>
  <rect width="600" height="900" fill="url(#cian-ret-${id})"/>

  <rect x="24" y="24" width="552" height="852" fill="none" stroke="#9fdcf0" stroke-width="1.5" stroke-opacity=".5" stroke-dasharray="14 7"/>
  <rect x="36" y="36" width="528" height="828" fill="none" stroke="#9fdcf0" stroke-width=".8" stroke-opacity=".26"/>

  <text x="300" y="74" text-anchor="middle" font-family="'Bebas Neue', 'Arial Narrow', 'Helvetica Neue', Arial, sans-serif" font-size="21" letter-spacing="8" fill="#dff2fa">VIDEOTECA ÁCRATA</text>
  <text x="300" y="95" text-anchor="middle" font-family="'Courier Prime', 'Courier New', monospace" font-size="9" letter-spacing="3" fill="#9fdcf0">PUNTO DE IGNICIÓN · LÁMINA TÉCNICA</text>
  <g stroke="#9fdcf0" stroke-width="1" stroke-opacity=".45">
    <path d="M62 110 H538"/>
    <path d="M62 106V114M120 106V114M180 106V114M240 106V114M300 106V114M360 106V114M420 106V114M480 106V114M538 106V114"/>
  </g>

  <text x="300" y="340" text-anchor="middle" font-family="'Bebas Neue', 'Arial Narrow', 'Helvetica Neue', Arial, sans-serif" font-size="220" fill="none" stroke="#9fdcf0" stroke-width="2" stroke-opacity=".07">${anio}</text>
  <rect x="76" y="134" width="448" height="330" fill="none" stroke="#9fdcf0" stroke-width=".8" stroke-opacity=".3" stroke-dasharray="4 6"/>
  <g stroke="#9fdcf0" stroke-width="1" stroke-opacity=".55">
    <path d="M76 449V134H391"/>
    <path d="M76 134h-6M76 449h-6M391 134v-6"/>
  </g>
  <circle cx="300" cy="299" r="158" fill="none" stroke="#9fdcf0" stroke-width=".8" stroke-opacity=".2"/>
  ${motivo(pelicula.categoria, '#9fdcf0', '#9fdcf0', 300, 299, 0.76)}

  <text x="76" y="484" font-family="'Courier Prime', 'Courier New', monospace" font-size="8" letter-spacing="2" fill="#86a7b8">FIG. 01 · ${categoria}</text>
  <text x="524" y="484" text-anchor="end" font-family="'Courier Prime', 'Courier New', monospace" font-size="8" letter-spacing="2" fill="#86a7b8">PLACA / ${anio}</text>

  <text x="300" y="${primeraLinea - tamano - 18}" text-anchor="middle" font-family="'Courier Prime', 'Courier New', monospace" font-size="11" letter-spacing="4" fill="#9fdcf0">[ ${categoria} ]</text>
  <text text-anchor="middle" font-family="'Bebas Neue', 'Arial Narrow', 'Helvetica Neue', Arial, sans-serif" font-weight="700" font-size="${tamano}" letter-spacing="1" fill="#dff2fa">${titulo}</text>
  <text x="300" y="${primeraLinea + (lineas.length - 1) * interlineado + 28}" text-anchor="middle" font-family="'Playfair Display', Georgia, 'Times New Roman', serif" font-style="italic" font-size="${ajustarLinea(pelicula.tituloOriginal, { ancho: 440, maximo: 14, estilo: 'serif' })}" fill="#b0cfdd">${tituloOriginal}</text>

  <path d="M74 756 H526" stroke="#9fdcf0" stroke-width="1" stroke-opacity=".4" stroke-dasharray="2 6"/>
  <text x="300" y="784" text-anchor="middle" font-family="'Courier Prime', 'Courier New', monospace" font-size="11" letter-spacing="2" fill="#b0cfdd">${anio} · ${duracion} · ${licencia}</text>
  <text x="300" y="808" text-anchor="middle" font-family="'Courier Prime', 'Courier New', monospace" font-size="11" letter-spacing="2" fill="#dff2fa">DIR. ${director.toUpperCase()}</text>
  <text x="300" y="836" text-anchor="middle" font-family="'Courier Prime', 'Courier New', monospace" font-size="9" letter-spacing="3" fill="#86a7b8">ESCALA 1:1 · ARCHIVO FÍLMICO LIBRE</text>
</svg>
`;
}

/* ------------------------------------------------------------
   Sala 4 · Ámbar: papel cálido, arcos y serifas
   ------------------------------------------------------------ */

function crearAmbar(pelicula) {
  const { tamano, lineas, interlineado } = ajustarTitulo(pelicula.titulo, {
    ancho: 424,
    maximo: 56,
    minimo: 20,
    estilo: 'serif',
    espaciado: 0
  });
  const primeraLinea = 700 - (lineas.length - 1) * interlineado;
  const titulo = generarLineasTitulo(lineas, tamano, interlineado, primeraLinea);
  const anio = Number.isInteger(pelicula.anio) ? String(pelicula.anio) : 's. f.';
  const categoria = esc(pelicula.categoria.toUpperCase());
  const licencia = esc(pelicula.licencia);
  const duracion = esc(pelicula.duracion);
  const director = esc(pelicula.director);
  const tituloOriginal = esc(pelicula.tituloOriginal);
  const id = esc(pelicula.id);

  const marcas = Array.from({ length: 24 }, (_, i) => {
    const angulo = (i / 24) * Math.PI * 2;
    const x1 = (300 + Math.cos(angulo) * 66).toFixed(1);
    const y1 = (152 + Math.sin(angulo) * 66).toFixed(1);
    const x2 = (300 + Math.cos(angulo) * 73).toFixed(1);
    const y2 = (152 + Math.sin(angulo) * 73).toFixed(1);
    return `<path d="M${x1} ${y1} L${x2} ${y2}"/>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900" width="600" height="900" role="img" aria-labelledby="titulo-${id} desc-${id}">
  <title id="titulo-${id}">Cartel de ${esc(pelicula.titulo)}</title>
  <desc id="desc-${id}">Cartel de la sala Ámbar para ${esc(pelicula.titulo)}, ${anio}, dirigida por ${director}.</desc>
  <defs>
    <radialGradient id="ambar-luz-${id}" cx=".5" cy=".34" r=".72">
      <stop offset="0" stop-color="#d9a441" stop-opacity=".28"/>
      <stop offset="1" stop-color="#d9a441" stop-opacity="0"/>
    </radialGradient>
    <pattern id="ambar-grano-${id}" width="7" height="7" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r=".8" fill="#5d4830" opacity=".14"/>
    </pattern>
  </defs>

  <rect width="600" height="900" fill="#17100a"/>
  <rect width="600" height="900" fill="url(#ambar-luz-${id})"/>

  <path d="M36 862 L36 320 A264 264 0 0 1 564 320 L564 862 Z" fill="#ecd9b6"/>
  <path d="M36 862 L36 320 A264 264 0 0 1 564 320 L564 862 Z" fill="url(#ambar-grano-${id})"/>
  <path d="M36 862 L36 320 A264 264 0 0 1 564 320 L564 862 Z" fill="none" stroke="#d9a441" stroke-width="1.5" stroke-opacity=".7"/>
  <path d="M50 852 L50 322 A250 250 0 0 1 550 322 L550 852" fill="none" stroke="#2a1d12" stroke-width="1" stroke-opacity=".28"/>

  <text x="300" y="34" text-anchor="middle" font-family="'Playfair Display', Georgia, 'Times New Roman', serif" font-size="13" letter-spacing="6" fill="#d9a441">VIDEOTECA ÁCRATA</text>

  <circle cx="300" cy="152" r="58" fill="none" stroke="#b4551f" stroke-width="1.5" stroke-opacity=".75"/>
  <circle cx="300" cy="152" r="50" fill="none" stroke="#b4551f" stroke-width=".8" stroke-opacity=".4" stroke-dasharray="3 4"/>
  <g stroke="#b4551f" stroke-width="1" stroke-opacity=".55">${marcas}</g>
  <text x="300" y="164" text-anchor="middle" font-family="'Playfair Display', Georgia, 'Times New Roman', serif" font-weight="700" font-size="34" fill="#7d3712">${anio}</text>

  ${motivo(pelicula.categoria, '#b4551f', '#d9a441', 300, 380, 0.88)}

  <text x="300" y="${primeraLinea - tamano - 20}" text-anchor="middle" font-family="'Special Elite', 'Courier New', monospace" font-size="10" letter-spacing="4" fill="#9a3d12">${categoria}</text>
  <text text-anchor="middle" font-family="'Playfair Display', Georgia, 'Times New Roman', serif" font-weight="700" font-size="${tamano}" letter-spacing="0" fill="#2a1d12">${titulo}</text>
  <text x="300" y="${primeraLinea + (lineas.length - 1) * interlineado + 28}" text-anchor="middle" font-family="'Playfair Display', Georgia, 'Times New Roman', serif" font-style="italic" font-size="${ajustarLinea(pelicula.tituloOriginal, { ancho: 400, maximo: 15, estilo: 'serif' })}" fill="#5d4830">${tituloOriginal}</text>

  <path d="M190 750 H410" stroke="#9a3d12" stroke-width="1" stroke-opacity=".55"/>
  <circle cx="300" cy="750" r="3" fill="#9a3d12"/>
  <text x="300" y="778" text-anchor="middle" font-family="'Special Elite', 'Courier New', monospace" font-size="12" letter-spacing="1" fill="#4a3826">${anio} · ${duracion}</text>
  <text x="300" y="804" text-anchor="middle" font-family="'Playfair Display', Georgia, 'Times New Roman', serif" font-size="17" fill="#2a1d12">Dir. ${director}</text>
  <text x="300" y="828" text-anchor="middle" font-family="'Special Elite', 'Courier New', monospace" font-size="9" letter-spacing="2" fill="#5d4830">${licencia}</text>
  <text x="300" y="852" text-anchor="middle" font-family="'Special Elite', 'Courier New', monospace" font-size="8" letter-spacing="2" fill="#7a6142">SESIÓN · ARCHIVO FÍLMICO LIBRE</text>

  <text x="300" y="886" text-anchor="middle" font-family="'Special Elite', 'Courier New', monospace" font-size="9" letter-spacing="3" fill="#c9a86f">PUNTO DE IGNICIÓN · SIN PATRONES</text>
</svg>
`;
}

/* ------------------------------------------------------------
   Sala 5 · Consigna: cartel político, rojo y negro, diagonales
   ------------------------------------------------------------ */

function crearConsigna(pelicula) {
  const { tamano, lineas, interlineado } = ajustarTitulo(pelicula.titulo, {
    ancho: 512,
    maximo: 68,
    minimo: 24,
    estilo: 'sans',
    espaciado: 0.5
  });
  const primeraLinea = 706 - (lineas.length - 1) * interlineado;
  const titulo = lineas.map((linea, i) =>
    `<tspan x="40" y="${primeraLinea + i * interlineado}">${esc(linea)}</tspan>`
  ).join('');
  const anio = Number.isInteger(pelicula.anio) ? String(pelicula.anio) : 's. f.';
  const categoria = esc(pelicula.categoria.toUpperCase());
  const licencia = esc(pelicula.licencia);
  const duracion = esc(pelicula.duracion);
  const director = esc(pelicula.director);
  const tituloOriginal = esc(pelicula.tituloOriginal);
  const id = esc(pelicula.id);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900" width="600" height="900" role="img" aria-labelledby="titulo-${id} desc-${id}">
  <title id="titulo-${id}">Cartel de ${esc(pelicula.titulo)}</title>
  <desc id="desc-${id}">Cartel de la sala Consigna para ${esc(pelicula.titulo)}, ${anio}, dirigida por ${director}.</desc>
  <defs>
    <pattern id="consigna-grano-${id}" width="8" height="8" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r=".9" fill="#14100c" opacity=".12"/>
    </pattern>
  </defs>

  <rect width="600" height="900" fill="#0a0908"/>
  <polygon points="0,0 600,0 600,274 0,406" fill="#d02b16"/>
  <polygon points="0,406 600,274 600,304 0,436" fill="#8a190c"/>
  <rect width="600" height="900" fill="url(#consigna-grano-${id})"/>
  <rect x="0" y="0" width="14" height="900" fill="#d02b16"/>

  <text x="40" y="60" font-family="'Anton', 'Bebas Neue', 'Arial Narrow', Impact, sans-serif" font-size="22" letter-spacing="3" fill="#f8ead2">VIDEOTECA ÁCRATA</text>
  <text x="560" y="60" text-anchor="end" font-family="'Bebas Neue', 'Arial Narrow', Impact, sans-serif" font-size="12" letter-spacing="3" fill="#f1e3c8">ARCHIVO FÍLMICO LIBRE</text>
  <path d="M40 78 H560" stroke="#14100c" stroke-width="3"/>

  <text x="40" y="132" font-family="'Anton', 'Bebas Neue', 'Arial Narrow', Impact, sans-serif" font-size="42" letter-spacing="1" fill="#f8ead2">PUNTO DE IGNICIÓN</text>
  <rect x="40" y="158" width="330" height="30" fill="#14100c"/>
  <text x="52" y="180" font-family="'Bebas Neue', 'Arial Narrow', Impact, sans-serif" font-size="16" letter-spacing="3" fill="#f1e3c8">${categoria}</text>

  <g transform="translate(300 372)">
    <circle cx="0" cy="0" r="96" fill="none" stroke="#f1e3c8" stroke-width="7"/>
    <circle cx="0" cy="0" r="82" fill="none" stroke="#f1e3c8" stroke-width="1.5" stroke-opacity=".5"/>
    <path d="M-46 54 L0 -56 L46 54" fill="none" stroke="#f1e3c8" stroke-width="12" stroke-linecap="square"/>
    <path d="M-27 14 H27" fill="none" stroke="#f1e3c8" stroke-width="11"/>
    <path d="M0 -56 L0 58" fill="none" stroke="#d02b16" stroke-width="7"/>
  </g>
  <path d="M120 486 H480" stroke="#f1e3c8" stroke-width="1" stroke-opacity=".35"/>

  <text text-anchor="start" font-family="'Anton', 'Bebas Neue', 'Arial Narrow', Impact, sans-serif" font-weight="700" font-size="${tamano}" letter-spacing=".5" fill="#f1e3c8">${titulo}</text>
  <text x="40" y="${primeraLinea + (lineas.length - 1) * interlineado + 30}" font-family="'Playfair Display', Georgia, 'Times New Roman', serif" font-style="italic" font-size="${ajustarLinea(pelicula.tituloOriginal, { ancho: 510, maximo: 15, estilo: 'serif' })}" fill="#dcd0b8">${tituloOriginal}</text>

  <path d="M0 772 H600 V900 H0 Z" fill="#f1e3c8"/>
  <path d="M0 772 H600" stroke="#14100c" stroke-width="4"/>
  <rect x="40" y="792" width="12" height="12" fill="#d02b16"/>
  <text x="62" y="804" font-family="'Bebas Neue', 'Arial Narrow', Impact, sans-serif" font-size="17" letter-spacing="2" fill="#14100c">${anio} · ${duracion}</text>
  <text x="560" y="804" text-anchor="end" font-family="'Bebas Neue', 'Arial Narrow', Impact, sans-serif" font-size="14" letter-spacing="1.5" fill="#8a190c">${licencia}</text>
  <text x="40" y="840" font-family="'Playfair Display', Georgia, 'Times New Roman', serif" font-size="18" fill="#14100c">Dir. ${director}</text>
  <text x="560" y="840" text-anchor="end" font-family="'Bebas Neue', 'Arial Narrow', Impact, sans-serif" font-size="13" letter-spacing="2" fill="#14100c">DESCARGA LIBRE</text>
  <path d="M40 858 H560" stroke="#14100c" stroke-width="1" stroke-opacity=".35"/>
  <text x="40" y="880" font-family="'Bebas Neue', 'Arial Narrow', Impact, sans-serif" font-size="11" letter-spacing="3" fill="#4a3d2e">PUNTO DE IGNICIÓN · SIN PATRONES</text>
  <text x="560" y="880" text-anchor="end" font-family="'Bebas Neue', 'Arial Narrow', Impact, sans-serif" font-size="11" letter-spacing="3" fill="#b3261a">NI DIOS NI AMO</text>
</svg>
`;
}

/* ------------------------------------------------------------
   Sala 7 · Trinchera: afiche de la Guerra Civil, papel, sol radiante,
   franjas rojinegras y sellos girados.
   ------------------------------------------------------------ */

function crearTrinchera(pelicula) {
  const { tamano, lineas, interlineado } = ajustarTitulo(pelicula.titulo, {
    ancho: 520,
    maximo: 62,
    minimo: 24,
    maxLineas: 4,
    estilo: 'sans',
    espaciado: 1
  });
  const ultima = 686;
  const primeraLinea = ultima - (lineas.length - 1) * interlineado;
  const titulo = generarLineasTitulo(lineas, tamano, interlineado, primeraLinea);
  const anio = Number.isInteger(pelicula.anio) ? String(pelicula.anio) : 's. f.';
  const categoria = esc(pelicula.categoria.toUpperCase());
  const licencia = esc(pelicula.licencia);
  const duracion = esc(pelicula.duracion);
  const director = esc(pelicula.director);
  const tituloOriginal = esc(pelicula.tituloOriginal);
  const id = esc(pelicula.id);

  /* Sol radiante: rayos alternos de dos largos sobre el disco del carrete. */
  const rayos = Array.from({ length: 36 }, (_, i) => {
    const ancho = i % 2 ? 6 : 3;
    const largo = i % 2 ? 44 : 62;
    return `<rect x="${300 - ancho / 2}" y="90" width="${ancho}" height="${largo}" fill="#c2231a" transform="rotate(${i * 10} 300 240)"/>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900" width="600" height="900" role="img" aria-labelledby="titulo-${id} desc-${id}">
  <title id="titulo-${id}">Cartel de ${esc(pelicula.titulo)}</title>
  <desc id="desc-${id}">Cartel de la sala Trinchera para ${esc(pelicula.titulo)}, ${anio}, dirigida por ${director}.</desc>
  <defs>
    <pattern id="trinchera-grano-${id}" width="7" height="7" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r=".7" fill="#1a120c" opacity=".12"/>
    </pattern>
    <filter id="trinchera-sombra-${id}" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="6" dy="6" stdDeviation="0" flood-color="#c2231a" flood-opacity=".26"/>
    </filter>
  </defs>

  <rect width="600" height="900" fill="#e9d8b4"/>
  <rect width="600" height="900" fill="url(#trinchera-grano-${id})"/>
  <g fill="#1a120c">
    <rect x="40" y="0" width="40" height="14"/><rect x="120" y="0" width="40" height="14"/>
    <rect x="200" y="0" width="40" height="14"/><rect x="280" y="0" width="40" height="14"/>
    <rect x="360" y="0" width="40" height="14"/><rect x="440" y="0" width="40" height="14"/>
    <rect x="520" y="0" width="40" height="14"/>
  </g>
  <g fill="#c2231a">
    <rect x="0" y="0" width="40" height="14"/><rect x="80" y="0" width="40" height="14"/>
    <rect x="160" y="0" width="40" height="14"/><rect x="240" y="0" width="40" height="14"/>
    <rect x="320" y="0" width="40" height="14"/><rect x="400" y="0" width="40" height="14"/>
    <rect x="480" y="0" width="40" height="14"/><rect x="560" y="0" width="40" height="14"/>
  </g>
  <rect x="0" y="0" width="12" height="900" fill="#c2231a"/>

  <text x="40" y="64" font-family="'Bebas Neue', 'Arial Narrow', Impact, sans-serif" font-size="26" letter-spacing="4" fill="#1a120c">VIDEOTECA ÁCRATA</text>
  <text x="560" y="64" text-anchor="end" font-family="'Bebas Neue', 'Arial Narrow', Impact, sans-serif" font-size="11" letter-spacing="3" fill="#c2231a">ARCHIVO FÍLMICO LIBRE</text>
  <path d="M40 80 H560" stroke="#1a120c" stroke-width="3"/>
  <path d="M40 86 H560" stroke="#c2231a" stroke-width="1"/>

  <g transform="translate(466 128) rotate(-7)">
    <rect x="-70" y="-19" width="140" height="38" fill="none" stroke="#c2231a" stroke-width="2"/>
    <rect x="-64" y="-13" width="128" height="26" fill="none" stroke="#c2231a" stroke-width="1"/>
    <text x="0" y="4" text-anchor="middle" font-family="'Bebas Neue', 'Arial Narrow', Impact, sans-serif" font-size="13" letter-spacing="2" fill="#c2231a">ARCHIVO LIBRE</text>
  </g>

  ${rayos}
  <circle cx="300" cy="240" r="100" fill="#f7ecd4" stroke="#1a120c" stroke-width="5"/>
  <circle cx="300" cy="240" r="74" fill="none" stroke="#1a120c" stroke-width="7"/>
  <g fill="#c2231a">
    <circle cx="300" cy="194" r="13"/><circle cx="340" cy="217" r="13"/>
    <circle cx="340" cy="263" r="13"/><circle cx="300" cy="286" r="13"/>
    <circle cx="260" cy="263" r="13"/><circle cx="260" cy="217" r="13"/>
  </g>
  <circle cx="300" cy="240" r="17" fill="#1a120c"/>

  <rect x="0" y="462" width="600" height="34" fill="#1a120c"/>
  <text x="300" y="485" text-anchor="middle" font-family="'Bebas Neue', 'Arial Narrow', Impact, sans-serif" font-size="17" letter-spacing="5" fill="#f7ecd4">${categoria}</text>

  <text text-anchor="middle" font-family="'Bebas Neue', 'Arial Narrow', Impact, sans-serif" font-size="${tamano}" letter-spacing="1" fill="#1a120c" filter="url(#trinchera-sombra-${id})">${titulo}</text>
  <text x="300" y="722" text-anchor="middle" font-family="'Playfair Display', Georgia, 'Times New Roman', serif" font-style="italic" font-size="${ajustarLinea(pelicula.tituloOriginal, { ancho: 500, maximo: 15, estilo: 'serif' })}" fill="#5b4732">${tituloOriginal}</text>

  <rect x="0" y="756" width="600" height="144" fill="#f7ecd4"/>
  <path d="M0 756 H600" stroke="#1a120c" stroke-width="4"/>
  <text x="40" y="790" font-family="'Bebas Neue', 'Arial Narrow', Impact, sans-serif" font-size="18" letter-spacing="2" fill="#1a120c">${anio} · ${duracion}</text>
  <text x="560" y="790" text-anchor="end" font-family="'Bebas Neue', 'Arial Narrow', Impact, sans-serif" font-size="13" letter-spacing="1.5" fill="#b21c12">${licencia}</text>
  <text x="40" y="820" font-family="'Playfair Display', Georgia, 'Times New Roman', serif" font-size="17" fill="#1a120c">Dir. ${director}</text>

  <g transform="translate(462 818) rotate(-4)">
    <rect x="-76" y="-17" width="152" height="34" fill="none" stroke="#c2231a" stroke-width="2"/>
    <text x="0" y="5" text-anchor="middle" font-family="'Bebas Neue', 'Arial Narrow', Impact, sans-serif" font-size="12" letter-spacing="2" fill="#c2231a">ARCHIVO FÍLMICO</text>
  </g>

  <path d="M40 850 H560" stroke="#1a120c" stroke-width="1" stroke-opacity=".35"/>
  <text x="40" y="874" font-family="'Bebas Neue', 'Arial Narrow', Impact, sans-serif" font-size="11" letter-spacing="3" fill="#5b4732">PUNTO DE IGNICIÓN · SIN PATRONES</text>
  <text x="560" y="874" text-anchor="end" font-family="'Bebas Neue', 'Arial Narrow', Impact, sans-serif" font-size="11" letter-spacing="3" fill="#b21c12">ARCHIVO LIBRE</text>
</svg>
`;
}

/* ------------------------------------------------------------
   Sala 8 · Bloque: geometría, círculos concéntricos y módulos,
   monocromo sobre hueso, sombras duras y Bodoni.
   ------------------------------------------------------------ */

function crearBloque(pelicula) {
  const { tamano, lineas, interlineado } = ajustarTitulo(pelicula.titulo, {
    ancho: 496,
    maximo: 62,
    minimo: 22,
    maxLineas: 4,
    estilo: 'serif',
    espaciado: 0.5
  });
  const ultima = 636;
  const primeraLinea = ultima - (lineas.length - 1) * interlineado;
  const titulo = lineas.map((linea, i) =>
    `<tspan x="48" y="${primeraLinea + i * interlineado}">${esc(linea)}</tspan>`
  ).join('');
  const anio = Number.isInteger(pelicula.anio) ? String(pelicula.anio) : 's. f.';
  const categoria = esc(pelicula.categoria.toUpperCase());
  const licencia = esc(pelicula.licencia);
  const duracion = esc(pelicula.duracion);
  const director = esc(pelicula.director);
  const tituloOriginal = esc(pelicula.tituloOriginal);
  const id = esc(pelicula.id);

  const verticales = Array.from({ length: 8 }, (_, i) =>
    `<path d="M${60 + i * 60} 24V876"/>`
  ).join('');
  const horizontales = Array.from({ length: 13 }, (_, i) =>
    `<path d="M24 ${84 + i * 60}H576"/>`
  ).join('');
  const modulos = Array.from({ length: 9 }, (_, i) =>
    `<rect x="${48 + i * 56}" y="858" width="10" height="10" fill="${i < 5 ? '#111110' : '#f6f2e8'}" stroke="#f6f2e8" stroke-width="1"/>`
  ).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900" width="600" height="900" role="img" aria-labelledby="titulo-${id} desc-${id}">
  <title id="titulo-${id}">Cartel de ${esc(pelicula.titulo)}</title>
  <desc id="desc-${id}">Cartel de la sala Bloque para ${esc(pelicula.titulo)}, ${anio}, dirigida por ${director}.</desc>
  <defs>
    <pattern id="bloque-trama-${id}" width="12" height="12" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1" fill="#111110" opacity=".1"/>
    </pattern>
    <filter id="bloque-sombra-${id}" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="7" dy="7" stdDeviation="0" flood-color="#111110" flood-opacity=".2"/>
    </filter>
  </defs>

  <rect width="600" height="900" fill="#e7e2d4"/>
  <rect width="600" height="900" fill="url(#bloque-trama-${id})"/>
  <g stroke="#111110" stroke-width="1" stroke-opacity=".07">${verticales}${horizontales}</g>

  <rect x="24" y="24" width="552" height="852" fill="none" stroke="#111110" stroke-width="2"/>
  <rect x="18" y="18" width="12" height="12" fill="#111110"/>
  <rect x="570" y="18" width="12" height="12" fill="#111110"/>
  <rect x="18" y="870" width="12" height="12" fill="#111110"/>
  <rect x="570" y="870" width="12" height="12" fill="#111110"/>

  <rect x="392" y="176" width="120" height="120" fill="#111110" opacity=".08" transform="rotate(45 452 236)"/>
  <circle cx="452" cy="236" r="118" fill="none" stroke="#111110" stroke-width="2" stroke-opacity=".2"/>
  <circle cx="452" cy="236" r="92" fill="none" stroke="#111110" stroke-width="10" stroke-opacity=".14"/>
  <circle cx="452" cy="236" r="66" fill="none" stroke="#111110" stroke-width="2" stroke-opacity=".24" stroke-dasharray="7 7"/>
  <circle cx="452" cy="236" r="40" fill="none" stroke="#111110" stroke-width="10"/>
  <circle cx="452" cy="236" r="9" fill="#111110"/>

  <path d="M24 330 L576 258 L576 292 L24 364 Z" fill="#111110" opacity=".08"/>
  <rect x="48" y="128" width="8" height="118" fill="#111110"/>

  <text x="48" y="66" font-family="'Bodoni Moda', Didot, 'Times New Roman', serif" font-weight="700" font-size="22" letter-spacing="2" fill="#111110">VIDEOTECA ÁCRATA</text>
  <text x="552" y="66" text-anchor="end" font-family="'Courier Prime', 'Courier New', monospace" font-size="10" letter-spacing="3" fill="#3d3b34">ARCHIVO FÍLMICO LIBRE</text>
  <path d="M48 84 H552" stroke="#111110" stroke-width="2"/>

  <rect x="48" y="396" width="248" height="26" fill="#111110"/>
  <text x="60" y="414" font-family="'Courier Prime', 'Courier New', monospace" font-size="10" letter-spacing="2" fill="#f6f2e8">${categoria}</text>

  <text text-anchor="start" font-family="'Bodoni Moda', Didot, 'Times New Roman', serif" font-weight="700" font-size="${tamano}" letter-spacing=".5" fill="#111110" filter="url(#bloque-sombra-${id})">${titulo}</text>
  <text x="48" y="668" font-family="'Playfair Display', Georgia, 'Times New Roman', serif" font-style="italic" font-size="${ajustarLinea(pelicula.tituloOriginal, { ancho: 470, maximo: 15, estilo: 'serif' })}" fill="#4a473e">${tituloOriginal}</text>

  <path d="M48 694 H552" stroke="#111110" stroke-width="1" stroke-opacity=".45"/>
  <text x="48" y="722" font-family="'Courier Prime', 'Courier New', monospace" font-size="12" letter-spacing="1" fill="#111110">${anio} · ${duracion}</text>
  <text x="552" y="722" text-anchor="end" font-family="'Courier Prime', 'Courier New', monospace" font-size="11" letter-spacing="1" fill="#3d3b34">${licencia}</text>
  <text x="48" y="752" font-family="'Bodoni Moda', Didot, 'Times New Roman', serif" font-size="17" fill="#111110">Dir. ${director}</text>
  <text x="552" y="752" text-anchor="end" font-family="'Courier Prime', 'Courier New', monospace" font-size="9" letter-spacing="2" fill="#3d3b34">DESCARGA LIBRE</text>

  <rect x="0" y="792" width="600" height="108" fill="#111110"/>
  <text x="48" y="836" font-family="'Bodoni Moda', Didot, 'Times New Roman', serif" font-size="13" letter-spacing="3" fill="#f6f2e8">PUNTO DE IGNICIÓN</text>
  <text x="552" y="836" text-anchor="end" font-family="'Courier Prime', 'Courier New', monospace" font-size="10" letter-spacing="3" fill="#f6f2e8">SIN PATRONES</text>
  ${modulos}
</svg>
`;
}

function crearPoster(pelicula, tema) {
  if (tema === 'nitrato-rojo') return crearNitrato(pelicula, PALETA_NITRATO_ROJO);
  if (tema === 'plata') return crearPlata(pelicula);
  if (tema === 'cianotipo') return crearCianotipo(pelicula);
  if (tema === 'ambar') return crearAmbar(pelicula);
  if (tema === 'consigna') return crearConsigna(pelicula);
  if (tema === 'trinchera') return crearTrinchera(pelicula);
  if (tema === 'bloque') return crearBloque(pelicula);
  return crearNitrato(pelicula);
}

/* ------------------------------------------------------------
   Escritura y comprobación
   ------------------------------------------------------------ */

let errores = 0;
let escritos = 0;

for (const tema of TEMAS) {
  if (!soloCheck) mkdirSync(new URL(`assets/posters/${CARPETAS[tema]}`, raiz), { recursive: true });
}

for (const pelicula of peliculas) {
  if (!pelicula.poster || !pelicula.poster.startsWith('assets/posters/') || !pelicula.poster.endsWith('.svg')) {
    console.error(`✗ ${pelicula.id || '(sin id)'}: «poster» debe ser assets/posters/<id>.svg`);
    errores++;
    continue;
  }
  if (pelicula.poster.includes('..')) {
    console.error(`✗ ${pelicula.id}: ruta de cartel insegura`);
    errores++;
    continue;
  }

  const archivo = pelicula.poster.slice('assets/posters/'.length);

  for (const tema of TEMAS) {
    const rutaRel = `assets/posters/${CARPETAS[tema]}${archivo}`;
    const ruta = new URL(rutaRel, raiz);
    const contenido = crearPoster(pelicula, tema);

    if (soloCheck) {
      if (!existsSync(fileURLToPath(ruta))) {
        console.error(`✗ falta ${rutaRel}`);
        errores++;
        continue;
      }
      const actual = readFileSync(ruta, 'utf8');
      if (actual !== contenido) {
        console.error(`✗ ${rutaRel} está desactualizado; ejecuta node scripts/generar-posters.mjs`);
        errores++;
      }
    } else {
      writeFileSync(ruta, contenido);
      escritos++;
    }
  }
}

if (soloCheck) {
  if (errores) {
    console.error(`\n✗ ${errores} cartel(es) con problemas.`);
    process.exit(1);
  }
  console.log(`✓ ${peliculas.length * TEMAS.length} carteles al día (${TEMAS.length} salas).`);
} else {
  if (errores) {
    console.error(`\n✗ ${errores} cartel(es) con problemas.`);
    process.exit(1);
  }
  console.log(`\n✓ ${escritos} carteles generados (${peliculas.length} obras × ${TEMAS.length} salas).`);
}
