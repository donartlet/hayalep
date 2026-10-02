// Her şeyi tek komutla kontrol et.
// Kullanım:  node tools/kontrol.mjs
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const node = process.execPath;
let hataVar = false;

function baslik(m) { console.log(`\n=== ${m} ===`); }
function calistir(komut, args, { kodDeger = 0 } = {}) {
  const sonuc = spawnSync(komut, args, { cwd: KOK, encoding: 'utf8', shell: false });
  const cikti = `${sonuc.stdout || ''}${sonuc.stderr || ''}`.trim();
  if (cikti) console.log(cikti);
  if (sonuc.status !== kodDeger) { hataVar = true; console.log('  ✗ BAŞARISIZ'); }
  return sonuc.status === kodDeger;
}

/* 1) Sözdizimi */
baslik('1/4 Sözdizimi kontrolü');
const gecici = path.join(KOK, 'tools', '_syntax');
await fs.rm(gecici, { recursive: true, force: true });
await fs.mkdir(gecici, { recursive: true });
const jsDosyalari = [];
async function topla(klasor) {
  for (const ad of await fs.readdir(klasor)) {
    const yol = path.join(klasor, ad);
    const b = await fs.stat(yol);
    if (b.isDirectory()) await topla(yol);
    else if (ad.endsWith('.js')) jsDosyalari.push(yol);
  }
}
await topla(path.join(KOK, 'js'));
jsDosyalari.push(path.join(KOK, 'sw.js'));
for (const d of jsDosyalari) {
  await fs.copyFile(d, path.join(gecici, `${path.basename(path.dirname(d))}_${path.basename(d)}.mjs`));
}
for (const ad of await fs.readdir(gecici)) {
  const sonuc = spawnSync(node, ['--check', path.join(gecici, ad)], { encoding: 'utf8' });
  if (sonuc.status !== 0) { hataVar = true; console.log(`  ✗ ${ad}: ${sonuc.stderr.trim().split('\n')[0]}`); }
}
console.log(`  ${jsDosyalari.length} dosya kontrol edildi${hataVar ? '' : ' — hepsi geçerli'}`);
await fs.rm(gecici, { recursive: true, force: true });

/* 2) Eksik import / tanımsız kullanım */
baslik('2/4 Import kontrolü');
calistir(node, ['tools/eksik-import.mjs']);

/* 3) Birim testleri */
baslik('3/4 Birim testleri');
calistir(node, ['--test', 'tools/testler/puanlama.test.mjs', 'tools/testler/arastirma.test.mjs']);

/* 4) PWA dosyaları yerinde mi */
baslik('4/4 PWA dosyaları');
const gerekli = [
  'index.html', 'manifest.webmanifest', 'sw.js',
  'ikonlar/apple-touch-icon.png', 'ikonlar/icon-192.png', 'ikonlar/icon-512.png', 'ikonlar/maskable-512.png',
  'css/tema.css', 'css/temel.css', 'css/ekranlar.css',
];
const swIcerik = await fs.readFile(path.join(KOK, 'sw.js'), 'utf8');
for (const dosya of gerekli) {
  try {
    await fs.access(path.join(KOK, dosya));
    // sw.js kendisini önbelleğe almaz (tarayıcı yönetir)
    if (dosya !== 'sw.js' && swIcerik && !swIcerik.includes(dosya.split('/').pop())) {
      console.log(`  ! sw.js önbellek listesinde yok: ${dosya}`);
      hataVar = true;
    }
  } catch { console.log(`  ✗ eksik: ${dosya}`); hataVar = true; }
}
console.log(`  ${gerekli.length} dosya kontrol edildi`);

console.log(`\n${hataVar ? 'SONUÇ: Sorun var (yukarıya bak).' : 'SONUÇ: Her şey geçerli ✓'}`);
process.exit(hataVar ? 1 : 0);