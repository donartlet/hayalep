// Basit statik kontrol 1: bir modülün fonksiyonunu kullanıyorsan import'unu yazmış mısın?
// Basit statik kontrol 2: hiçbir yerde tanımlı olmayan bir ad kullanılmış mı?
// Kullanım:  node tools/eksik-import.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const JS_KOK = path.join(KOK, 'js');

/* Tarayıcı/JS global'ları — bunlar tanım aranmaz. */
const GLOBAL = new Set([
  'if', 'for', 'while', 'switch', 'catch', 'return', 'typeof', 'await', 'new', 'delete', 'void', 'in', 'of',
  'function', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Promise', 'Math', 'JSON', 'Date', 'Set', 'Map',
  'Intl', 'Error', 'URL', 'URLSearchParams', 'Blob', 'File', 'FileReader', 'Image', 'CustomEvent', 'Event',
  'HashChangeEvent', 'IntersectionObserver', 'createImageBitmap', 'fetch', 'atob', 'btoa', 'setTimeout',
  'clearTimeout', 'setInterval', 'clearInterval', 'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'encodeURIComponent',
  'decodeURIComponent', 'console', 'document', 'window', 'navigator', 'location', 'history', 'localStorage',
  'sessionStorage', 'indexedDB', 'getComputedStyle', 'requestAnimationFrame', 'ResizeObserver', 'FormData',
  'structuredClone', 'queueMicrotask', 'performance', 'crypto', 'globalThis', 'self', 'this', 'arguments', 'async', 'await',
]);

async function dosyalaraBul(klasor) {
  const cikti = [];
  for (const ad of await fs.readdir(klasor)) {
    const yol = path.join(klasor, ad);
    const bilgi = await fs.stat(yol);
    if (bilgi.isDirectory()) cikti.push(...await dosyalaraBul(yol));
    else if (ad.endsWith('.js')) cikti.push(yol);
  }
  return cikti;
}

/**
 * Yorumları ve metinleri boşlukla değiştirir; SATIR SAYISI korunur.
 * (Sıra önemli: önce yorum sonra metin temizlemek 'https://' içeren
 *  metinleri yutuyordu. Tek geçişli bir tarayıcı kullanıyoruz.)
 */
function temizle(icerik) {
  let out = '';
  let i = 0;
  const n = icerik.length;
  const bosluk = (ch) => (ch === '\n' ? '\n' : ' ');
  while (i < n) {
    const c = icerik[i];
    const s = icerik[i + 1];
    // yorumlar
    if (c === '/' && s === '/') {
      while (i < n && icerik[i] !== '\n') { out += bosluk(icerik[i]); i += 1; }
      continue;
    }
    if (c === '/' && s === '*') {
      out += '  '; i += 2;
      while (i < n && !(icerik[i] === '*' && icerik[i + 1] === '/')) { out += bosluk(icerik[i]); i += 1; }
      out += '  '; i += 2;
      continue;
    }
    // metinler
    if (c === "'" || c === '"' || c === '`') {
      const tirnak = c;
      out += tirnak; i += 1;
      while (i < n) {
        if (icerik[i] === '\\') { out += bosluk(icerik[i]); out += bosluk(icerik[i + 1] || ' '); i += 2; continue; }
        if (icerik[i] === tirnak) { out += tirnak; i += 1; break; }
        out += bosluk(icerik[i]); i += 1;
      }
      continue;
    }
    out += c;
    i += 1;
  }
  return out;
}

function disaAktarilan(icerik) {
  const adlar = new Set();
  for (const m of icerik.matchAll(/export\s+(?:async\s+)?(?:function|const|let|class)\s+([A-Za-z0-9_$]+)/g)) adlar.add(m[1]);
  for (const m of icerik.matchAll(/export\s*\{([^}]+)\}/g)) {
    for (const parca of m[1].split(',')) {
      const ad = (parca.trim().split(/\s+as\s+/)[1] || parca.trim()).trim();
      if (ad) adlar.add(ad);
    }
  }
  return adlar;
}

const dosyalar = await dosyalaraBul(JS_KOK);
const icerikler = new Map();
for (const d of dosyalar) icerikler.set(d, await fs.readFile(d, 'utf8'));

const kaynak = new Map();
for (const [d, icerik] of icerikler) {
  for (const ad of disaAktarilan(icerik)) {
    if (!kaynak.has(ad)) kaynak.set(ad, new Set());
    kaynak.get(ad).add(d);
  }
}

const yerel = new Map();
for (const [d, icerik] of icerikler) {
  const kume = new Set();
  const temiz = temizle(icerik);
  for (const m of temiz.matchAll(/(?:^|[\s({[,;])(?:async\s+)?function\s+([A-Za-z0-9_$]+)/g)) kume.add(m[1]);
  for (const m of temiz.matchAll(/(?:^|[\s({[,;])(?:const|let|var)\s+([A-Za-z0-9_$]+)/g)) kume.add(m[1]);
  for (const m of temiz.matchAll(/\{\s*([^}]*)\}\s*=/g)) {
    for (const parca of m[1].split(',')) {
      const ad = parca.trim().split(':').pop().split('=')[0].trim();
      if (/^[A-Za-z0-9_$]+$/.test(ad)) kume.add(ad);
    }
  }
  for (const m of temiz.matchAll(/(?:function|=>)\s*([A-Za-z0-9_$]+)\s*\{/g)) kume.add(m[1]);
  for (const m of temiz.matchAll(/\(([^()]*)\)\s*=>/g)) {
    for (const parca of m[1].split(',')) {
      const ad = parca.trim().replace(/[{}\[\].]/g, '').split(/[=:]/)[0].trim();
      if (/^[A-Za-z0-9_$]+$/.test(ad)) kume.add(ad);
    }
  }
  // normal fonksiyon parametreleri: function ad(a, b) {
  for (const m of temiz.matchAll(/function\s+[A-Za-z0-9_$]+\s*\(([^()]*)\)/g)) {
    for (const parca of m[1].split(',')) {
      const ad = parca.trim().replace(/[{}\[\].]/g, '').split(/[=:]/)[0].trim();
      if (/^[A-Za-z0-9_$]+$/.test(ad)) kume.add(ad);
    }
  }
  // for..of / for..in değişkenleri
  for (const m of temiz.matchAll(/for\s*\(\s*(?:const|let|var)\s+([A-Za-z0-9_$]+)/g)) kume.add(m[1]);
  for (const m of temiz.matchAll(/\bcatch\s*\(\s*([A-Za-z0-9_$]+)/g)) kume.add(m[1]);
  for (const m of temiz.matchAll(/(?:^|\W)([A-Za-z0-9_$]+)\s*=>/g)) kume.add(m[1]);
  yerel.set(d, kume);
}

let hata = 0;
for (const [d, icerik] of icerikler) {
  const satirlar = temizle(icerik).split('\n');
  const importEdilen = new Set();
  for (const m of icerik.matchAll(/import\s*\{([^}]+)\}\s*from/g)) {
    for (const parca of m[1].split(',')) {
      const ad = parca.trim().split(/\s+as\s+/).pop().trim();
      if (ad) importEdilen.add(ad);
    }
  }
  satirlar.forEach((satir, i) => {
    if (/^\s*import\b/.test(satir)) return;
    for (const m of satir.matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(/g)) {
      const ad = m[1];
      if (importEdilen.has(ad) || yerel.get(d).has(ad) || GLOBAL.has(ad)) continue;
      hata += 1;
      const kaynaklar = kaynak.get(ad);
      const nerede = kaynaklar
        ? `(başka modülde tanımlı: ${[...kaynaklar].map((k) => path.basename(k)).join(', ')})`
        : '(HİÇBİR YERDE TANIMLI DEĞİL)';
      console.log(`EKSİK/TANIMSIZ  ${path.relative(KOK, d)}:${i + 1}  ->  ${ad}()  ${nerede}`);
    }
  });
}

console.log(hata === 0 ? '\nSorun yok.' : `\n${hata} sorun bulundu.`);
process.exit(hata === 0 ? 0 : 1);