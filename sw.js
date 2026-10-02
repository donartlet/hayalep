/* Çevrimdışı önbellek. Uygulama dosyaları bir kez indirilir, sonra telefondan açılır.
   Kullanıcının verisi IndexedDB'de zaten cihazda durur; burada hiçbir veri gönderilmez. */
const SURUM = 'v7';

// Önbellek adına kurulum yolu eklenir: aynı alan adında birden fazla dağıtım
// (ör. GitHub Pages'te /kullanici/repo1/ ve /kullanici/repo2/) birbirinin
// önbelleğini silmesin diye.
const KOK_YOL = new URL('./', self.location.href).pathname;
const ONBELLEK = `hayal-atolyesi@${KOK_YOL.replace(/[^a-z0-9]/gi, '_')}@${SURUM}`;

const DOSYALAR = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/tema.css',
  './css/temel.css',
  './css/ekranlar.css',
  './js/ana.js',
  './js/veri/depo.js',
  './js/veri/sema.js',
  './js/veri/puanlama.js',
  './js/veri/yedek.js',
  './js/ui/bilesen.js',
  './js/ui/geri.js',
  './js/ui/bolum.js',
  './js/ui/gorsel.js',
  './js/arastirma/sema.js',
  './js/arastirma/komut.js',
  './js/arastirma/birlestir.js',
  './js/ekranlar/liste.js',
  './js/ekranlar/detay.js',
  './js/ekranlar/duzenle.js',
  './js/ekranlar/sozluk.js',
  './js/ekranlar/ayarlar.js',
  './js/ekranlar/arastirma.js',
  './docs/ornek-veriler/koltuk-boyama.arastirma.json',
  './docs/ornek-veriler/ispnakli-pogaca.arastirma.json',
  './ikonlar/apple-touch-icon.png',
  './ikonlar/icon-192.png',
  './ikonlar/icon-512.png',
  './ikonlar/maskable-512.png',
];

self.addEventListener('install', (olay) => {
  olay.waitUntil(
    caches.open(ONBELLEK)
      .then((onbellek) => onbellek.addAll(DOSYALAR))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (olay) => {
  // Yalnızca BU dağıtımın eski sürüm önbellekleri silinir; başka dağıtımlar korunur.
  const benimOnek = `hayal-atolyesi@${KOK_YOL.replace(/[^a-z0-9]/gi, '_')}@`;
  olay.waitUntil(
    caches.keys()
      .then((anahtarlar) => Promise.all(
        anahtarlar
          .filter((a) => a.startsWith(benimOnek) && a !== ONBELLEK)
          .map((a) => caches.delete(a)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (olay) => {
  const istek = olay.request;
  if (istek.method !== 'GET') return;
  const adres = new URL(istek.url);
  if (adres.origin !== self.location.origin) return;

  // Sayfa açılışı: yalnızca uygulamanın kendi sayfası için kabuk sunulur.
  // (tools/ altındaki test sayfaları gibi diğer HTML dosyaları gizlenmez.)
  const uygulamaSayfasi = adres.pathname === KOK_YOL || adres.pathname === `${KOK_YOL}index.html`;
  if (istek.mode === 'navigate' && uygulamaSayfasi) {
    olay.respondWith(
      caches.match('./index.html').then((onbellekteki) => {
        const agdan = fetch(istek)
          .then((yanit) => {
            if (yanit && yanit.ok) {
              const kopya = yanit.clone();
              caches.open(ONBELLEK).then((o) => o.put('./index.html', kopya));
            }
            return yanit;
          })
          .catch(() => null);
        if (onbellekteki) { agdan.catch(() => {}); return onbellekteki; }
        return agdan.then((yanit) => yanit || caches.match('./index.html').then((r) => r || Response.error()));
      }),
    );
    return;
  }

  // Diğer dosyalar: önce önbellek (hızlı + çevrimdışı), arka planda tazele
  olay.respondWith(
    caches.match(istek).then((onbellekteki) => {
      const agdan = fetch(istek).then((yanit) => {
        if (yanit && yanit.status === 200 && yanit.type === 'basic') {
          const kopya = yanit.clone();
          caches.open(ONBELLEK).then((o) => o.put(istek, kopya));
        }
        return yanit;
      }).catch(() => null);
      if (onbellekteki) { agdan.catch(() => {}); return onbellekteki; }
      return agdan.then((yanit) => yanit || Response.error());
    }),
  );
});

self.addEventListener('message', (olay) => {
  if (olay.data === 'surum') {
    olay.source.postMessage({ surum: SURUM });
  }
});