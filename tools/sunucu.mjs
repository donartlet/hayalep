// Yerel test sunucusu (yalnızca geliştirme için, bağımlılık yok).
// Kullanım:  node tools/sunucu.mjs [port]
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.argv[2] || 5173);

const TIPLER = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

const sunucu = http.createServer(async (istek, yanit) => {
  try {
    let yol = decodeURIComponent(new URL(istek.url, `http://${istek.headers.host}`).pathname);
    if (yol.endsWith('/')) yol += 'index.html';
    const dosya = path.join(KOK, path.normalize(yol).replace(/^([/\\])+/, ''));
    if (!dosya.startsWith(KOK)) { yanit.writeHead(403).end('Yasak'); return; }
    const veri = await fs.readFile(dosya);
    const tip = TIPLER[path.extname(dosya).toLowerCase()] || 'application/octet-stream';
    yanit.writeHead(200, {
      'Content-Type': tip,
      'Cache-Control': 'no-store',
      'Service-Worker-Allowed': '/',
    });
    yanit.end(veri);
  } catch {
    yanit.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Bulunamadı');
  }
});

sunucu.listen(PORT, () => {
  console.log(`\n  Hayal Atölyem çalışıyor:`);
  console.log(`  →  http://localhost:${PORT}`);
  console.log(`  →  aynı Wi-Fi'daki iPhone: http://<bu bilgisayarın IP adresi>:${PORT}`);
  console.log(`  Durdurmak için: Ctrl + C\n`);
});