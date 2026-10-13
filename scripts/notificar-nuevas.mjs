import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const SITE = (process.env.SITE_URL || '').replace(/\/$/, '');
const SECRET = process.env.NOTIFY_SECRET;
if (!SITE || !SECRET) { console.error('Faltan SITE_URL o NOTIFY_SECRET'); process.exit(1); }

const parse = html => {
  const m = html.match(/const PRODUCTOS = (\[[\s\S]*?\n\]);/);
  if (!m) throw new Error('No se encontró el arreglo PRODUCTOS en index.html');
  return new Function('return ' + m[1])();
};

async function enviar(p) {
  const r = await fetch(`${SITE}/api/notify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-notify-secret': SECRET },
    body: JSON.stringify({
      tituloPolera: p.nombre,
      descripcion: p.desc,
      precio: p.precio,
      imagenUrl: p.img ? (p.img.startsWith('http') ? p.img : `${SITE}/${p.img}`) : ''
    })
  });
  console.log(p.nombre, '->', r.status, await r.text());
  if (!r.ok) process.exitCode = 1;
}

// Modo manual
if (process.env.MANUAL_TITULO) {
  await enviar({
    nombre: process.env.MANUAL_TITULO,
    desc: process.env.MANUAL_DESC || '',
    precio: process.env.MANUAL_PRECIO || '',
    img: process.env.MANUAL_IMG || ''
  });
  process.exit();
}

// Modo automático al hacer push
const before = process.env.BEFORE_SHA || '';
if (!before || /^0+$/.test(before)) { console.log('Sin commit previo, nada que comparar.'); process.exit(); }

let oldIds;
try {
  oldIds = new Set(parse(execSync(`git show ${before}:index.html`, { encoding: 'utf8' })).map(p => p.id));
} catch { console.log('No se pudo leer index.html anterior.'); process.exit(); }

const nuevas = parse(readFileSync('index.html', 'utf8')).filter(p => !oldIds.has(p.id)).sort((a, b) => a.id - b.id);
if (!nuevas.length) { console.log('No hay prendas nuevas.'); process.exit(); }

for (const p of nuevas) { await enviar(p); await new Promise(r => setTimeout(r, 1500)); }
