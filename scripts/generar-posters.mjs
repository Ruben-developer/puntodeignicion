// Genera los tres carteles SVG de cada obra a partir de datos/peliculas.json.
// Uso:
//   node scripts/generar-posters.mjs          # escribe las tres salas
//   node scripts/generar-posters.mjs --check  # falla si algún cartel está desactualizado
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const raiz = new URL('../', import.meta.url);
const rutaDatos = new URL('datos/peliculas.json', raiz);
const soloCheck = process.argv.includes('--check');

const peliculas = JSON.parse(readFileSync(rutaDatos, 'utf8'));

const TEMAS = ['taquilla', 'nitrato', 'incendio'];
const CARPETAS = { taquilla: '', nitrato: 'nitrato/', incendio: 'incendio/' };

const paletas = {
  'Propaganda y Revuelta': { fondo: '#2a0e0b', papel: '#e6d4b4', tinta: '#241a15', rojo: '#8b261b', oro: '#c59b27' },
  'Memoria Obrera': { fondo: '#241a12', papel: '#dcc7a6', tinta: '#251b15', rojo: '#8b261b', oro: '#b98a24' },
  'Revueltas Históricas': { fondo: '#1b140f', papel: '#e5d3b3', tinta: '#2c221e', rojo: '#8b261b', oro: '#c59b27' },
  'Ficción Subversiva': { fondo: '#17131c', papel: '#e5d3b3', tinta: '#241d25', rojo: '#7c1f1a', oro: '#c59b27' },
  'Documentales Libres': { fondo: '#151d19', papel: '#e5d3b3', tinta: '#1d2a24', rojo: '#8b261b', oro: '#c59b27' }
};

const paletaPorDefecto = { fondo: '#1b140f', papel: '#e5d3b3', tinta: '#2c221e', rojo: '#8b261b', oro: '#c59b27' };

const esc = (valor) => String(valor)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

function envolver(texto, maximo) {
  const palabras = texto.split(/\s+/).filter(Boolean);
  if (!palabras.length) return [''];
  const lineas = [];
  let linea = '';
  for (const palabra of palabras) {
    const candidata = linea ? `${linea} ${palabra}` : palabra;
    if (candidata.length <= maximo || !linea) {
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
  const { ancho = 500, factor = 0.56, maximo = 60, minimo = 30 } = opciones;
  let tamano = titulo.length <= 18 ? maximo : titulo.length <= 34 ? Math.round(maximo * 0.84) : Math.round(maximo * 0.7);
  let limite = Math.max(8, Math.floor(ancho / (tamano * factor)));
  let lineas = envolver(titulo.toUpperCase(), limite);
  while (lineas.length > 3 && tamano > minimo) {
    tamano -= 2;
    limite = Math.max(8, Math.floor(ancho / (tamano * factor)));
    lineas = envolver(titulo.toUpperCase(), limite);
  }
  return { tamano, lineas, interlineado: Math.round(tamano * 1.08) };
}

function generarLineasTitulo(lineas, tamano, interlineado, primeraLinea) {
  return lineas.map((linea, i) =>
    `<tspan x="300" y="${primeraLinea + i * interlineado}">${esc(linea)}</tspan>`
  ).join('');
}

function aleatorio(semilla) {
  let estado = semilla % 2147483647;
  if (estado <= 0) estado += 2147483646;
  return () => {
    estado = (estado * 16807) % 2147483647;
    return (estado - 1) / 2147483646;
  };
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
   Sala 1 · Taquilla: papel, boleto y verde de sala
   ------------------------------------------------------------ */

function crearTaquilla(pelicula) {
  const paleta = paletas[pelicula.categoria] || paletaPorDefecto;
  const { fondo, papel, tinta, rojo, oro } = paleta;
  const { tamano, lineas, interlineado } = ajustarTitulo(pelicula.titulo);
  const primeraLinea = 720 - (lineas.length - 1) * interlineado;
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
  <desc id="desc-${id}">Cartel generado para la Videoteca Ácrata Punto de Ignición: ${esc(pelicula.titulo)}, ${anio}, dirigida por ${director}.</desc>
  <defs>
    <pattern id="trama" width="10" height="10" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.2" fill="${tinta}" opacity=".18"/>
    </pattern>
    <filter id="grano" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" stitchTiles="stitch" result="ruido"/>
      <feColorMatrix in="ruido" type="saturate" values="0" result="gris"/>
      <feComponentTransfer in="gris" result="tenue">
        <feFuncA type="table" tableValues="0 .12"/>
      </feComponentTransfer>
      <feBlend in="SourceGraphic" in2="tenue" mode="multiply"/>
    </filter>
  </defs>

  <rect width="600" height="900" fill="${fondo}"/>
  <rect x="20" y="20" width="560" height="860" fill="${papel}"/>
  <rect x="20" y="20" width="560" height="860" fill="url(#trama)" opacity=".7"/>
  <rect x="32" y="32" width="536" height="836" fill="none" stroke="${rojo}" stroke-width="2" opacity=".9"/>
  <rect x="40" y="40" width="520" height="820" fill="none" stroke="${tinta}" stroke-width="1" opacity=".35"/>

  <text x="300" y="62" text-anchor="middle" font-family="'Special Elite', 'Courier New', monospace" font-size="15" letter-spacing="4" fill="${tinta}">VIDEOTECA ÁCRATA</text>
  <text x="300" y="84" text-anchor="middle" font-family="'Special Elite', 'Courier New', monospace" font-size="10" letter-spacing="3" fill="${rojo}">PUNTO DE IGNICIÓN · ARCHIVO FÍLMICO LIBRE</text>
  <path d="M70 102 L530 102" stroke="${rojo}" stroke-width="2" opacity=".7"/>

  <text x="300" y="500" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="235" fill="none" stroke="${rojo}" stroke-width="2" opacity=".12">${anio}</text>
  <rect x="65" y="125" width="470" height="405" fill="url(#trama)" opacity=".4"/>
  ${motivo(pelicula.categoria, rojo, oro)}

  <text x="300" y="${primeraLinea - tamano - 18}" text-anchor="middle" font-family="'Special Elite', 'Courier New', monospace" font-size="12" letter-spacing="2" fill="${rojo}">${categoria}</text>
  <text text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="${tamano}" letter-spacing="1" fill="${tinta}">${titulo}</text>
  <text x="300" y="742" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="15" fill="${tinta}" opacity=".75">${tituloOriginal}</text>

  <path d="M60 758 L540 758" stroke="${rojo}" stroke-width="2"/>
  <text x="60" y="786" font-family="'Special Elite', 'Courier New', monospace" font-size="13" letter-spacing="2" fill="${rojo}">${anio} · ${duracion}</text>
  <text x="540" y="786" text-anchor="end" font-family="'Special Elite', 'Courier New', monospace" font-size="11" letter-spacing="1" fill="${tinta}" opacity=".8">${licencia}</text>
  <text x="60" y="816" font-family="Georgia, 'Times New Roman', serif" font-size="17" fill="${tinta}">Dir. ${director}</text>
  <text x="540" y="816" text-anchor="end" font-family="'Special Elite', 'Courier New', monospace" font-size="10" letter-spacing="2" fill="${rojo}">DESCARGA LIBRE</text>
  <g transform="translate(300 846)">
    <path d="M-135 0 L135 0" stroke="${tinta}" stroke-width="1" opacity=".4"/>
    <circle cx="0" cy="0" r="3" fill="${rojo}"/>
  </g>
  <rect x="20" y="20" width="560" height="860" fill="none" stroke="${tinta}" stroke-width="1" opacity=".2" filter="url(#grano)"/>
</svg>
`;
}

/* ------------------------------------------------------------
   Sala 2 · Nitrato: cine mudo, ivory sobre negro y tira fílmica
   ------------------------------------------------------------ */

function crearNitrato(pelicula) {
  const { tamano, lineas, interlineado } = ajustarTitulo(pelicula.titulo, {
    ancho: 460,
    factor: 0.62,
    maximo: 56,
    minimo: 24
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
  <desc id="desc-${id}">Cartel de la sala Nitrato para ${esc(pelicula.titulo)}, ${anio}, dirigida por ${director}.</desc>
  <defs>
    <pattern id="grano-n" width="8" height="8" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1" fill="#f2ecdc" opacity=".14"/>
    </pattern>
    <radialGradient id="vineta-n" cx=".5" cy=".42" r=".78">
      <stop offset="52%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity=".72"/>
    </radialGradient>
  </defs>

  <rect width="600" height="900" fill="#0a0a09"/>
  <rect x="0" y="0" width="36" height="900" fill="#151513"/>
  <rect x="564" y="0" width="36" height="900" fill="#151513"/>
  <g fill="#060605">${agujeros}</g>

  <rect x="46" y="26" width="508" height="848" fill="#0d0d0c" stroke="#efe8d8" stroke-width="2" stroke-opacity=".55"/>
  <rect x="54" y="34" width="492" height="832" fill="none" stroke="#efe8d8" stroke-width="1" stroke-opacity=".18"/>
  <rect x="54" y="34" width="492" height="832" fill="url(#grano-n)" opacity=".7"/>

  <g stroke="#efe8d8" stroke-opacity=".055" stroke-width="1">
    <path d="M118 34V866"/>
    <path d="M171 34V866"/>
    <path d="M302 34V866"/>
    <path d="M417 34V866"/>
    <path d="M470 34V866"/>
  </g>
  <rect x="46" y="26" width="508" height="848" fill="url(#vineta-n)"/>

  <text x="300" y="68" text-anchor="middle" font-family="'Courier Prime', 'Courier New', monospace" font-size="15" letter-spacing="5" fill="#efe8d8">VIDEOTECA ÁCRATA</text>
  <text x="300" y="90" text-anchor="middle" font-family="'Courier Prime', 'Courier New', monospace" font-size="9" letter-spacing="3" fill="#a33124">PUNTO DE IGNICIÓN · ARCHIVO FÍLMICO LIBRE</text>
  <path d="M86 106 L514 106" stroke="#efe8d8" stroke-width="1" stroke-opacity=".42"/>

  <text x="300" y="596" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="210" fill="none" stroke="#efe8d8" stroke-width="2" stroke-opacity=".09">${anio}</text>
  ${motivo(pelicula.categoria, '#efe8d8', '#c8563f', 300, 322, 0.8)}

  <text x="300" y="476" text-anchor="middle" font-family="'Courier Prime', 'Courier New', monospace" font-size="12" letter-spacing="4" fill="#c8563f">${categoria}</text>
  <text text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="${tamano}" letter-spacing="1.5" fill="#f2ecdc">${titulo}</text>
  <text x="300" y="712" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="14" fill="#cfc7b4" opacity=".8">${tituloOriginal}</text>

  <path d="M80 732 L520 732" stroke="#efe8d8" stroke-width="1" stroke-opacity=".5"/>
  <text x="80" y="762" font-family="'Courier Prime', 'Courier New', monospace" font-size="12" letter-spacing="2" fill="#efe8d8">${anio} · ${duracion}</text>
  <text x="520" y="762" text-anchor="end" font-family="'Courier Prime', 'Courier New', monospace" font-size="10" letter-spacing="1" fill="#cfc7b4">${licencia}</text>
  <text x="80" y="796" font-family="Georgia, 'Times New Roman', serif" font-size="17" fill="#efe8d8">Dir. ${director}</text>
  <text x="520" y="796" text-anchor="end" font-family="'Courier Prime', 'Courier New', monospace" font-size="10" letter-spacing="2" fill="#c8563f">ARCHIVO FÍLMICO</text>

  <text x="300" y="846" text-anchor="middle" font-family="'Courier Prime', 'Courier New', monospace" font-size="9" letter-spacing="3" fill="#948c79">PUNTO DE IGNICIÓN · SIN PATRONES</text>
</svg>
`;
}

/* ------------------------------------------------------------
   Sala 3 · Incendio: carbón, brasas y cartel incendiario
   ------------------------------------------------------------ */

function crearIncendio(pelicula) {
  const { tamano, lineas, interlineado } = ajustarTitulo(pelicula.titulo, {
    ancho: 600,
    factor: 0.55,
    maximo: 64,
    minimo: 28
  });
  const primeraLinea = 660 - (lineas.length - 1) * interlineado;
  const titulo = generarLineasTitulo(lineas, tamano, interlineado, primeraLinea);
  const anio = Number.isInteger(pelicula.anio) ? String(pelicula.anio) : 's. f.';
  const categoria = esc(pelicula.categoria.toUpperCase());
  const licencia = esc(pelicula.licencia);
  const duracion = esc(pelicula.duracion);
  const director = esc(pelicula.director);
  const tituloOriginal = esc(pelicula.tituloOriginal);
  const id = esc(pelicula.id);

  const azar = aleatorio([...pelicula.id].reduce((suma, letra) => suma + letra.charCodeAt(0), 7));
  const brasas = Array.from({ length: 26 }, () => {
    const x = Math.round(60 + azar() * 480);
    const y = Math.round(110 + azar() * 700);
    const r = (0.9 + azar() * 2.6).toFixed(1);
    const o = (0.18 + azar() * 0.55).toFixed(2);
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffb347" opacity="${o}"/>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900" width="600" height="900" role="img" aria-labelledby="titulo-${id} desc-${id}">
  <title id="titulo-${id}">Cartel de ${esc(pelicula.titulo)}</title>
  <desc id="desc-${id}">Cartel de la sala Incendio para ${esc(pelicula.titulo)}, ${anio}, dirigida por ${director}.</desc>
  <defs>
    <linearGradient id="brasa-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff3df"/>
      <stop offset=".45" stop-color="#ffb347"/>
      <stop offset="1" stop-color="#ff5a1e"/>
    </linearGradient>
    <radialGradient id="foco-${id}" cx=".5" cy=".46" r=".62">
      <stop offset="0" stop-color="#ff6a2a" stop-opacity=".22"/>
      <stop offset="1" stop-color="#ff6a2a" stop-opacity="0"/>
    </radialGradient>
    <filter id="hollin-${id}" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" stitchTiles="stitch" result="ruido"/>
      <feColorMatrix in="ruido" type="saturate" values="0" result="gris"/>
      <feComponentTransfer in="gris" result="tenue">
        <feFuncA type="table" tableValues="0 .1"/>
      </feComponentTransfer>
      <feBlend in="SourceGraphic" in2="tenue" mode="multiply"/>
    </filter>
  </defs>

  <rect width="600" height="900" fill="#0b0503"/>
  <rect width="600" height="900" fill="url(#foco-${id})"/>
  <g>${brasas}</g>

  <path d="M18 22 L582 16 L586 878 L14 884 Z" fill="none" stroke="#7d2b10" stroke-width="2" stroke-opacity=".85"/>
  <path d="M27 35 L573 29 L577 866 L23 872 Z" fill="none" stroke="#ff7a3c" stroke-width="1" stroke-opacity=".28"/>

  <text x="300" y="66" text-anchor="middle" font-family="'Arial Narrow', 'Helvetica Neue', Arial, sans-serif" font-weight="700" font-size="16" letter-spacing="6" fill="#ffb347">VIDEOTECA ÁCRATA</text>
  <text x="300" y="88" text-anchor="middle" font-family="'Arial Narrow', 'Helvetica Neue', Arial, sans-serif" font-size="10" letter-spacing="4" fill="#c7a98e">PUNTO DE IGNICIÓN · CINE EN LLAMAS</text>
  <path d="M72 106 L528 106" stroke="#7d2b10" stroke-width="2"/>

  <text x="300" y="590" text-anchor="middle" font-family="'Arial Narrow', 'Helvetica Neue', Arial, sans-serif" font-weight="700" font-size="225" fill="none" stroke="#ff7a3c" stroke-width="2" stroke-opacity=".08">${anio}</text>
  ${motivo(pelicula.categoria, '#ff7a3c', '#ffb347', 300, 320, 0.86)}

  <text x="300" y="478" text-anchor="middle" font-family="'Arial Narrow', 'Helvetica Neue', Arial, sans-serif" font-weight="700" font-size="14" letter-spacing="5" fill="#ff9a5c">${categoria}</text>
  <g transform="translate(300 0) scale(.86 1)">
    <text text-anchor="middle" font-family="'Arial Narrow', 'Helvetica Neue', Arial, sans-serif" font-weight="700" font-size="${tamano}" letter-spacing="1" fill="url(#brasa-${id})">${titulo}</text>
  </g>
  <text x="300" y="714" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="15" fill="#c7a98e" opacity=".8">${tituloOriginal}</text>

  <path d="M70 734 L530 734" stroke="#ff7a3c" stroke-width="1.5" stroke-opacity=".55"/>
  <text x="70" y="764" font-family="'Arial Narrow', 'Helvetica Neue', Arial, sans-serif" font-weight="700" font-size="15" letter-spacing="2" fill="#ffcf9a">${anio} · ${duracion}</text>
  <text x="530" y="764" text-anchor="end" font-family="'Arial Narrow', 'Helvetica Neue', Arial, sans-serif" font-size="11" letter-spacing="2" fill="#c7a98e">${licencia}</text>
  <text x="70" y="798" font-family="Georgia, 'Times New Roman', serif" font-size="18" fill="#f7e8d5">Dir. ${director}</text>
  <text x="530" y="798" text-anchor="end" font-family="'Arial Narrow', 'Helvetica Neue', Arial, sans-serif" font-weight="700" font-size="12" letter-spacing="3" fill="#ff7a3c">DESCARGA LIBRE</text>

  <text x="300" y="842" text-anchor="middle" font-family="'Arial Narrow', 'Helvetica Neue', Arial, sans-serif" font-size="10" letter-spacing="4" fill="#9a8070">NADA QUE ARDA DOS VECES</text>
  <path d="M0 900 L0 870 L22 878 L47 866 L74 875 L101 864 L130 876 L158 867 L188 878 L219 866 L247 875 L277 865 L306 877 L336 866 L365 876 L394 865 L424 877 L453 866 L482 875 L512 864 L541 876 L569 866 L600 874 L600 900 Z" fill="#050201"/>

  <rect x="20" y="20" width="560" height="860" fill="none" stroke="#f7e8d5" stroke-width="1" stroke-opacity=".12" filter="url(#hollin-${id})"/>
</svg>
`;
}

function crearPoster(pelicula, tema) {
  if (tema === 'nitrato') return crearNitrato(pelicula);
  if (tema === 'incendio') return crearIncendio(pelicula);
  return crearTaquilla(pelicula);
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
