// Genera el cartel SVG de cada obra a partir de datos/peliculas.json.
// La Videoteca usa una única sala, Nitrato rojo, y sus carteles viven en la
// raíz de assets/posters/.
// Uso:
//   node scripts/generar-posters.mjs          # escribe los carteles
//   node scripts/generar-posters.mjs --check  # falla si algún cartel está desactualizado
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const raiz = new URL('../', import.meta.url);
const rutaDatos = new URL('datos/peliculas.json', raiz);
const soloCheck = process.argv.includes('--check');

const peliculas = JSON.parse(readFileSync(rutaDatos, 'utf8'));

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

/* Los títulos en caja alta pueden introducir vocales acentuadas que la
   tabla original no medía; se añaden con los mismos anchos que sus
   versales sin tilde. */
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
   Nitrato rojo: tira fílmica de Nitrato con la paleta de Consigna
   ------------------------------------------------------------ */

const PALETA = {
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

function crearPoster(pelicula) {
  const p = PALETA;
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
  <desc id="desc-${id}">Cartel de ${esc(pelicula.titulo)}, ${anio}, dirigida por ${director}.</desc>
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
   Escritura y comprobación
   ------------------------------------------------------------ */

let errores = 0;
let escritos = 0;

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

  const ruta = new URL(pelicula.poster, raiz);
  const contenido = crearPoster(pelicula);

  if (soloCheck) {
    if (!existsSync(fileURLToPath(ruta))) {
      console.error(`✗ falta ${pelicula.poster}`);
      errores++;
      continue;
    }
    const actual = readFileSync(ruta, 'utf8');
    if (actual !== contenido) {
      console.error(`✗ ${pelicula.poster} está desactualizado; ejecuta node scripts/generar-posters.mjs`);
      errores++;
    }
  } else {
    writeFileSync(ruta, contenido);
    escritos++;
  }
}

if (soloCheck) {
  if (errores) {
    console.error(`\n✗ ${errores} cartel(es) con problemas.`);
    process.exit(1);
  }
  console.log(`✓ ${peliculas.length} carteles al día.`);
} else {
  if (errores) {
    console.error(`\n✗ ${errores} cartel(es) con problemas.`);
    process.exit(1);
  }
  console.log(`\n✓ ${escritos} carteles generados (${peliculas.length} obras).`);
}
