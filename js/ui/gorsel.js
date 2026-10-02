// Fotoğraf: cihazda saklama. Yüklemeden önce küçültülür (boyut/yer tasarrufu).
// Görsel dosyalar sunucuya gitmez.
'use strict';
import * as depo from '../veri/depo.js';
import { kisaKim, para } from './bilesen.js';

const EN_FAZLA_KENAR = 1400;   // iPhone ekranı için fazlası gereksiz
const URL_ÖNBELLEK = new Map();

async function resmiAc(dosya) {
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(dosya, { imageOrientation: 'from-image' }); } catch { /* devam */ }
  }
  return new Promise((cozumle, reddet) => {
    const url = URL.createObjectURL(dosya);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); cozumle(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reddet(new Error('Görsel açılamadı')); };
    img.src = url;
  });
}

/** Seçilen dosyayı sıkıştırıp depoya yazar. -> {id} */
export async function gorselKaydet(dosya) {
  if (!dosya) return null;
  if (!/^image\//.test(dosya.type || '')) throw new Error('Sadece görsel dosyası seçebilirsin.');
  const kaynak = await resmiAc(dosya);
  const w = kaynak.width; const h = kaynak.height;
  const olcek = Math.min(1, EN_FAZLA_KENAR / Math.max(w, h));
  const yw = Math.max(1, Math.round(w * olcek));
  const yh = Math.max(1, Math.round(h * olcek));
  const tuval = document.createElement('canvas');
  tuval.width = yw; tuval.height = yh;
  const ctx = tuval.getContext('2d');
  ctx.drawImage(kaynak, 0, 0, yw, yh);
  if (kaynak.close) kaynak.close();
  const blob = await new Promise((c) => tuval.toBlob(c, 'image/jpeg', 0.82));
  if (!blob) throw new Error('Görsel işlenemedi.');
  const id = kisaKim();
  await depo.yaz('gorseller', { id, veri: blob, ad: dosya.name || 'gorsel.jpg', boyut: blob.size });
  return { id, ad: dosya.name || 'gorsel.jpg', boyut: blob.size };
}

export async function gorselGetir(id) {
  if (!id) return null;
  return depo.getir('gorseller', id);
}

export async function gorselSil(id) {
  if (!id) return;
  URL_ÖNBELLEK.delete(id);
  await depo.sil('gorseller', id);
}

/** Kalıcı nesne adresi üretir (aynı görsel için tekrar üretmez). */
export async function gorselUrl(id) {
  if (!id) return null;
  if (URL_ÖNBELLEK.has(id)) return URL_ÖNBELLEK.get(id);
  const kayit = await gorselGetir(id);
  if (!kayit || !kayit.veri) return null;
  let url;
  if (typeof kayit.veri === 'string') url = kayit.veri;
  else url = URL.createObjectURL(kayit.veri);
  URL_ÖNBELLEK.set(id, url);
  return url;
}

/** <img> etiketi ekrana girdiğinde görseli yükler (liste performansı için). */
export function tembelGorsel(imgEtiketi, id) {
  const yukle = async () => {
    if (!id) { imgEtiketi.remove(); return; }
    const url = await gorselUrl(id);
    if (url) imgEtiketi.src = url;
    else imgEtiketi.remove();
  };
  if (typeof IntersectionObserver === 'function') {
    const gozlemci = new IntersectionObserver((girisler) => {
      for (const g of girisler) {
        if (g.isIntersecting) { gozlemci.disconnect(); yukle(); }
      }
    }, { rootMargin: '200px' });
    gozlemci.observe(imgEtiketi);
  } else {
    yukle();
  }
}

export function dosyaBoyutu(bayt) {
  if (!bayt) return '—';
  if (bayt < 1024) return `${bayt} B`;
  if (bayt < 1024 * 1024) return `${Math.round(bayt / 1024)} KB`;
  return `${(bayt / 1024 / 1024).toFixed(1)} MB`;
}

export function tahminiAlan(kayitlar) {
  const toplam = (kayitlar || []).reduce((t, k) => t + (k.malzemeler || []).length * 40, 0);
  return para(Math.round(toplam), 'B');
}