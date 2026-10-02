// Uygulama çekirdeği: başlatma, yönlendirme, üst bar, alt menü, tema.
'use strict';
import { el, temizle } from './ui/bilesen.js';
import { bildir } from './ui/geri.js';
import * as depo from './veri/depo.js';
import { VARSAYILAN_AYARLAR, demoIsleri, demoSozluk } from './veri/sema.js';
import { listeEkrani } from './ekranlar/liste.js';
import { detayEkrani } from './ekranlar/detay.js';
import { duzenleEkrani } from './ekranlar/duzenle.js';
import { sozlukEkrani } from './ekranlar/sozluk.js';
import { ayarlarEkrani } from './ekranlar/ayarlar.js';
import { arastirmaEkrani } from './ekranlar/arastirma.js';

export const durum = { ayarlar: { ...VARSAYILAN_AYARLAR }, ekran: null, yenidenCiz: () => {} };

const ust = () => document.getElementById('ust');
const ana = () => document.getElementById('ana');
const alt = () => document.getElementById('alt');

/* ---------------- Tema ---------------- */
export function temayiUygula(tema) {
  const secim = tema || 'otomatik';
  let koyu = false;
  if (secim === 'koyu') koyu = true;
  else if (secim === 'acik') koyu = false;
  else koyu = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.tema = koyu ? 'koyu' : 'acik';
}

/* ---------------- Üst bar ve alt menü ---------------- */
export function ustCiz({ baslik, altBaslik, geri, sagEylemler }) {
  const u = temizle(ust());
  if (geri) {
    u.appendChild(el('button', {
      class: 'ust__eylem', type: 'button', 'aria-label': 'Geri',
      onclick: () => { if (window.history.length > 1) window.history.back(); else git('#/hayaller'); },
    }, '‹ Geri'));
  }
  u.appendChild(el('div', { class: 'ust__baslik' },
    el('div', { text: baslik }),
    altBaslik ? el('span', { class: 'ust__alt', text: altBaslik }) : null));
  for (const eylem of sagEylemler || []) u.appendChild(eylem);
  u.style.paddingLeft = geri ? '8px' : '';
}

export function altCiz(aktif) {
  const n = temizle(alt());
  const ogeler = [
    { kod: 'hayaller', simge: '🎯', ad: 'Hayallerim', yol: '#/hayaller' },
    { kod: 'sozluk', simge: '📖', ad: 'Sözlüğüm', yol: '#/sozluk' },
    { kod: 'ayarlar', simge: '⚙️', ad: 'Ayarlar', yol: '#/ayarlar' },
  ];
  for (const oge of ogeler) {
    n.appendChild(el('button', {
      class: 'alt__ogesi', type: 'button',
      'aria-current': oge.kod === aktif ? 'page' : null,
      onclick: () => git(oge.yol),
    },
      el('span', { class: 'alt__simge', text: oge.simge, 'aria-hidden': 'true' }),
      el('span', { text: oge.ad }),
    ));
  }
}

/* ---------------- Yönlendirme ---------------- */
export function git(yol) {
  if (location.hash === yol) ciz();
  else location.hash = yol;
}

function yoluCoz(hash) {
  const temiz = (hash || '#/hayaller').replace(/^#/, '');
  const [yol, sorgu] = temiz.split('?');
  const parcalar = yol.split('/').filter(Boolean);
  const q = {};
  for (const [k, v] of new URLSearchParams(sorgu || '')) q[k] = v;
  return { parcalar, q };
}

async function ciz() {
  const { parcalar, q } = yoluCoz(location.hash);
  const kok = parcalar[0] || 'hayaller';
  durum.yenidenCiz = () => ciz();

  try {
    if (kok === 'hayal' && parcalar[1] === 'yeni') {
      durum.ekran = await duzenleEkrani(null);
    } else if (kok === 'hayal' && parcalar[2] === 'duzenle') {
      durum.ekran = await duzenleEkrani(parcalar[1]);
    } else if (kok === 'hayal' && parcalar[2] === 'arastirma') {
      durum.ekran = await arastirmaEkrani(parcalar[1]);
    } else if (kok === 'hayal' && parcalar[1]) {
      durum.ekran = await detayEkrani(parcalar[1], q.sekme || 'ozet');
    } else if (kok === 'sozluk') {
      durum.ekran = await sozlukEkrani();
    } else if (kok === 'ayarlar') {
      durum.ekran = await ayarlarEkrani();
    } else {
      durum.ekran = await listeEkrani();
    }
  } catch (hata) {
    console.error('Ekran açılamadı:', hata);
    const a = temizle(ana());
    a.appendChild(el('div', { class: 'bos' },
      el('div', { class: 'bos__simge', text: '⚠️' }),
      el('p', { class: 'bos__baslik', text: 'Bir sorun oluştu' }),
      el('p', { class: 'bos__metin', text: String(hata && hata.message ? hata.message : hata) }),
      el('button', { class: 'dugme dugme--ana', type: 'button', onclick: () => git('#/hayaller') }, 'Ana ekrana dön')));
    altCiz('hayaller');
  }
  ana().scrollTop = 0;
  window.scrollTo(0, 0);
}

/* ---------------- Başlatma ---------------- */
async function demoKur() {
  const kurulmus = await depo.metaGet('demoKuruldu', false);
  if (kurulmus) return;
  const mevcut = await depo.hepsi('isler');
  if (!mevcut.length) {
    await depo.yazToplu('isler', demoIsleri());
    const sozluk = await depo.hepsi('sozluk');
    if (!sozluk.length) await depo.yazToplu('sozluk', demoSozluk());
  }
  await depo.metaYaz('demoKuruldu', true);
}

async function baslat() {
  await depo.ac();
  const kayitli = (await depo.ayarGet('genel', null)) || {};
  durum.ayarlar = { ...VARSAYILAN_AYARLAR, ...kayitli, agirliklar: { ...VARSAYILAN_AYARLAR.agirliklar, ...(kayitli.agirliklar || {}) } };
  temayiUygula(durum.ayarlar.tema);
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if ((durum.ayarlar.tema || 'otomatik') === 'otomatik') temayiUygula('otomatik');
    });
  }
  await demoKur();

  window.addEventListener('hashchange', ciz);
  await ciz();

  // Eski sürüm önbelleğini temizle
  if ('serviceWorker' in navigator) {
    try {
      const kayit = await navigator.serviceWorker.register(new URL('sw.js', location.href));
      kayit.addEventListener('updatefound', () => {
        const yeni = kayit.installing;
        if (!yeni) return;
        yeni.addEventListener('statechange', () => {
          if (yeni.state === 'installed' && navigator.serviceWorker.controller) {
            bildir('Yeni sürüm indirildi. Tamamen kapatıp yeniden açınca güncellenir.', { sure: 8000 });
          }
        });
      });
    } catch (hata) {
      console.warn('Service Worker kaydedilemedi (geliştirme modu olabilir):', hata);
    }
  }
}

baslat();