// Copia a dist/ solo los archivos que deben publicarse.
// El repositorio también contiene CI, scripts y documentación que no se sirven.
//
// Uso:
//   node scripts/build.mjs          -> build de producción
//   node scripts/build.mjs --beta   -> build de beta (noindex)
import { cp, mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const beta = process.argv.includes('--beta');

const entries = [
  'index.html',
  '404.html',
  'styles.css',
  'app.js',
  'tema.js',
  'robots.txt',
  'sitemap.xml',
  '_headers',
  'LICENSE',
  'SECURITY.md',
  'THIRD-PARTY-NOTICES.md',
  'assets',
  'datos'
];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const entry of entries) {
  const from = path.join(root, entry);
  if (!existsSync(from)) {
    console.error(`✗ falta «${entry}»: no se puede construir dist/`);
    process.exit(1);
  }
  await cp(from, path.join(dist, entry), { recursive: true });
}

if (beta) {
  // La beta no debe indexarse: cabecera para todo el sitio y robots cerrado.
  const headersPath = path.join(dist, '_headers');
  const headers = await readFile(headersPath, 'utf8');
  await writeFile(
    headersPath,
    `${headers.trimEnd()}\n\n# Beta: fuera de los buscadores\n/*\n  X-Robots-Tag: noindex, nofollow\n`
  );
  await writeFile(path.join(dist, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
}

console.log(`dist/ listo${beta ? ' (beta, noindex)' : ''}: ${entries.length} entradas`);
