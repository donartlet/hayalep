// PNG ikon üretir (bağımlılık yok, Node'un zlib modülüyle).
// Kullanım:  node tools/ikon-uret.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CIKTI = path.join(KOK, 'ikonlar');
const ORNEK = 3; // her piksel için 3x3 örnek (kenar yumuşatma)

/* ---------- PNG yazıcı ---------- */
const CRC_TABLOSU = (() => {
  const tablo = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tablo[n] = c;
  }
  return tablo;
})();

function crc32(tampon) {
  let c = 0xffffffff;
  for (let i = 0; i < tampon.length; i += 1) c = CRC_TABLOSU[(c ^ tampon[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function parca(tur, veri) {
  const uzunluk = Buffer.alloc(4);
  uzunluk.writeUInt32BE(veri.length, 0);
  const govde = Buffer.concat([Buffer.from(tur, 'ascii'), veri]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(govde), 0);
  return Buffer.concat([uzunluk, govde, crc]);
}

function png(yen, yuk) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(yen, 0);
  ihdr.writeUInt32BE(yuk, 4);
  ihdr[8] = 8;   // bit derinliği
  ihdr[9] = 6;   // renk tipi: RGBA
  const ham = Buffer.alloc((yen * 4 + 1) * yuk);
  for (let y = 0; y < yuk; y += 1) {
    ham[y * (yen * 4 + 1)] = 0; // süzgeç: none
    pikselVerisi.copy(ham, y * (yen * 4 + 1) + 1, y * yen * 4, (y + 1) * yen * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    parca('IHDR', ihdr),
    parca('IDAT', zlib.deflateSync(ham, { level: 9 })),
    parca('IEND', Buffer.alloc(0)),
  ]);
}
let pikselVerisi = Buffer.alloc(0);

/* ---------- Çizim ---------- */
const karistir = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

function yuvarlaIc(x, y, gx0, gy0, gx1, gy1) {
  const en = Math.min(gx1, 1) - Math.max(gx0, 0);
  const boy = Math.min(gy1, 1) - Math.max(gy0, 0);
  if (en <= 0 || boy <= 0) return 0;
  const cx = (Math.max(gx0, 0) + Math.min(gx1, 1)) / 2;
  const cy = (Math.max(gy0, 0) + Math.min(gy1, 1)) / 2;
  const yaricap = Math.min(en, boy) / 2;
  return (cx - gx0 >= yaricap && cy - gy0 >= yaricap && 1 - cx - gx0 >= yaricap && 1 - cy - gy0 >= yaricap) ? 1 : 0;
}

// Süperelips: üssü 1'den küçükse kenarlar içe kavislenir -> dört köşeli yıldız
function yildizIci(x, y, cx, cy, r, guc = 0.42) {
  const dx = Math.abs(x - cx) / r;
  const dy = Math.abs(y - cy) / r;
  return Math.pow(dx, guc) + Math.pow(dy, guc) <= 1;
}

// İki nokta arasında kalın çizgi (kapsül)
function kapsul(x, y, x0, y0, x1, y1, r = 0.02) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len2 = dx * dx + dy * dy || 1e-9;
  let t = ((x - x0) * dx + (y - y0) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(x - (x0 + t * dx), y - (y0 + t * dy)) <= r;
}

function tasla(x, y) {
  // zemin: dikey degrad
  let renk = karistir([0.22, 0.55, 0.41], [0.09, 0.30, 0.22], y);
  // merkezde hafif ışık
  const d = Math.hypot(x - 0.5, y - 0.44);
  const hale = Math.max(0, 1 - d / 0.5) ** 2 * 0.25;
  renk = karistir(renk, [1, 1, 1], hale * 0.45);

  // ana yıldız (amber)
  if (yildizIci(x, y, 0.5, 0.42, 0.31, 0.40)) renk = karistir(renk, [0.97, 0.74, 0.22], 1);

  // küçük yıldız
  if (yildizIci(x, y, 0.80, 0.24, 0.11, 0.45)) renk = karistir(renk, [0.99, 0.88, 0.58], 1);

  // altta iki liste çubuğu (kontrol listesi izlenimi)
  if (kapsul(x, y, 0.20, 0.755, 0.58, 0.755, 0.021)) renk = karistir(renk, [0.93, 0.97, 0.94], 1);
  if (kapsul(x, y, 0.20, 0.835, 0.46, 0.835, 0.021)) renk = karistir(renk, [0.93, 0.97, 0.94], 1);
  // onay işareti
  if (kapsul(x, y, 0.695, 0.755, 0.730, 0.800, 0.019)) renk = karistir(renk, [0.99, 0.88, 0.58], 1);
  if (kapsul(x, y, 0.730, 0.800, 0.805, 0.718, 0.019)) renk = karistir(renk, [0.99, 0.88, 0.58], 1);

  return renk;
}

function ikon(boyut, maskePayi = 0) {
  pikselVerisi = Buffer.alloc(boyut * boyut * 4);
  for (let py = 0; py < boyut; py += 1) {
    for (let px = 0; px < boyut; px += 1) {
      let r = 0; let g = 0; let b = 0; let a = 0;
      for (let sy = 0; sy < ORNEK; sy += 1) {
        for (let sx = 0; sx < ORNEK; sx += 1) {
          const x = (px + (sx + 0.5) / ORNEK) / boyut;
          const y = (py + (sy + 0.5) / ORNEK) / boyut;
          const p = maskePayi
            ? yuvarlaIc(x, y, maskePayi, maskePayi, 1 - maskePayi, 1 - maskePayi)
            : 1;
          if (!p) continue;
          const c = tasla(x, y);
          r += c[0] * p; g += c[1] * p; b += c[2] * p; a += p;
        }
      }
      const n = ORNEK * ORNEK;
      const i = (py * boyut + px) * 4;
      const kap = a / n;
      if (kap <= 0) {
        pikselVerisi[i] = 0; pikselVerisi[i + 1] = 0; pikselVerisi[i + 2] = 0; pikselVerisi[i + 3] = 0;
      } else {
        pikselVerisi[i] = Math.round((r / n / kap) * 255);
        pikselVerisi[i + 1] = Math.round((g / n / kap) * 255);
        pikselVerisi[i + 2] = Math.round((b / n / kap) * 255);
        pikselVerisi[i + 3] = Math.round(kap * 255);
      }
    }
  }
  return png(boyut, boyut);
}

await fs.mkdir(CIKTI, { recursive: true });
const dosyalar = [
  ['apple-touch-icon.png', 180, 0],
  ['icon-192.png', 192, 0],
  ['icon-512.png', 512, 0],
  ['maskable-512.png', 512, 0.13],
];
for (const [ad, boyut, maske] of dosyalar) {
  const veri = ikon(boyut, maske);
  await fs.writeFile(path.join(CIKTI, ad), veri);
  console.log(`✓ ${ad} (${boyut}×${boyut}, ${Math.round(veri.length / 1024)} KB)`);
}
console.log('\nİkonlar hazır.');