// Puan hesabı ve sıralama. Saf fonksiyonlar (tarayıcıya bağımlı değil) -> test edilebilir.
'use strict';
import { VARSAYILAN_AYARLAR, ZORLUK_SEVIYELERI, DURUMLAR } from './sema.js';

/** Malzeme kalemlerinin toplam maliyeti (TL). */
export function toplamMaliyet(is) {
  return (is.malzemeler || []).filter(Boolean)
    .reduce((t, k) => t + (Number(k.adet) || 0) * (Number(k.birimFiyat) || 0), 0);
}

/** Alınan malzemelerin maliyeti (TL). */
export function harcananMaliyet(is) {
  return (is.malzemeler || []).filter(Boolean)
    .reduce((t, k) => t + (k.aldi ? (Number(k.adet) || 0) * (Number(k.birimFiyat) || 0) : 0), 0);
}

/** Eşik listesine göre 1–5 puan verir. */
export function esikPuani(deger, esikler) {
  const e = Array.isArray(esikler) && esikler.length ? esikler : VARSAYILAN_AYARLAR.maliyetEslikleri;
  let puan = 1;
  for (const sinir of e) { if (Number(deger) > Number(sinir)) puan += 1; else break; }
  return Math.min(5, Math.max(1, puan));
}

/**
 * Maliyet puanı (1–5):
 *  - Bütçe girilmişse: maliyetin bütçeye oranı kullanılır (bütçenin %85'inden fazlası = 5).
 *  - Bütçe yoksa: mutlak TL eşikleri kullanılır.
 * Maliyet/veri yoksa 0 döner (bilinmiyor).
 */
export function maliyetPuani(is, ayarlar = VARSAYILAN_AYARLAR) {
  const toplam = toplamMaliyet(is);
  if (!toplam) return 0;
  const butce = Number(is.butce) || 0;
  if (butce > 0) return esikPuani(toplam / butce, ayarlar.butceOranlari || VARSAYILAN_AYARLAR.butceOranlari);
  return esikPuani(toplam, ayarlar.maliyetEslikleri || VARSAYILAN_AYARLAR.maliyetEslikleri);
}

/** Zorluklar bölümünden otomatik zorluk puanı (1–5), veri yoksa 0. */
export function zorlukPuaniOtomatik(is) {
  const liste = is.zorluklar || [];
  const puanlar = liste.map((z) => (ZORLUK_SEVIYELERI.find((s) => s.kod === z.seviye) || {}).puan).filter(Boolean);
  if (!puanlar.length) return 0;
  return puanlar.reduce((a, b) => a + b, 0) / puanlar.length;
}

/** Etkin zorluk puanı: elle girilmiş varsa o, yoksa otomatik. */
export function zorlukPuani(is) {
  const elle = Number(is.zorlukPuani) || 0;
  if (elle) return elle;
  return zorlukPuaniOtomatik(is);
}

/** Süre tahmininden hız puanı (1–5). Süre yoksa 0. */
export function hizPuani(is, ayarlar = VARSAYILAN_AYARLAR) {
  const gun = Number(is.sureGun);
  if (!gun || gun <= 0) return 0;
  const e = ayarlar.sureEslikleri || VARSAYILAN_AYARLAR.sureEslikleri;
  let puan = 5;
  for (const sinir of e) { if (gun > Number(sinir)) puan -= 1; else break; }
  return Math.min(5, Math.max(1, puan));
}

const yuzde = (puan, enBuyuk) => (puan > 0 ? ((puan - 1) / (enBuyuk - 1)) * 100 : 0);

/**
 * Önerilen sıralama puanı (0–100).
 * İstek puanı 1–10 (kullanıcı verir), diğerleri 1–5. Ağırlıklar ayarlardan gelir.
 * Bilinmeyen bileşenler hesaba katılmaz; kalan ağırlık normalize edilir.
 */
export function onerilenPuan(is, ayarlar = VARSAYILAN_AYARLAR) {
  const agirliklar = { ...VARSAYILAN_AYARLAR.agirliklar, ...(ayarlar.agirliklar || {}) };
  const istek = Number(is.istekPuani) || 0;
  const zorluk = zorlukPuani(is);
  const maliyet = maliyetPuani(is, ayarlar);
  const hiz = hizPuani(is, ayarlar);

  const bilesenler = [];
  if (istek) bilesenler.push({ agirlik: agirliklar.istek, deger: ((istek - 1) / 9) * 100 });
  if (zorluk || maliyet) {
    // Kolaylık = ne kadar kolay ve ne kadar ucuzsa o kadar yüksek (zorluk/maliyet ters çevrilir)
    const kolayZorluk = zorluk ? yuzde(6 - zorluk, 5) : null;
    const kolayMaliyet = maliyet ? yuzde(6 - maliyet, 5) : null;
    const parcalar = [kolayZorluk, kolayMaliyet].filter((p) => p !== null);
    const ort = parcalar.reduce((t, p) => t + p, 0) / parcalar.length;
    bilesenler.push({ agirlik: agirliklar.kolaylik, deger: ort });
  }
  if (hiz) bilesenler.push({ agirlik: agirliklar.hiz, deger: yuzde(hiz, 5) });
  if (!bilesenler.length) return 0;
  const toplamAgirlik = bilesenler.reduce((t, b) => t + b.agirlik, 0);
  if (toplamAgirlik <= 0) return 0;
  return bilesenler.reduce((t, b) => t + b.deger * b.agirlik, 0) / toplamAgirlik;
}

/** Adım ilerlemesi yüzdesi. */
export function ilerleme(is) {
  const adimlar = is.adimlar || [];
  if (!adimlar.length) return 0;
  return Math.round((adimlar.filter((a) => a.tamamlandi).length / adimlar.length) * 100);
}

export function durumBilgisi(kod) {
  return DURUMLAR.find((d) => d.kod === kod) || DURUMLAR[0];
}

export const SIRALAMALAR = [
  { kod: 'onerilen', ad: 'Önerilen sıralama' },
  { kod: 'istek-desc', ad: 'İstek puanı (yüksek → düşük)' },
  { kod: 'istek-asc', ad: 'İstek puanı (düşük → yüksek)' },
  { kod: 'maliyet-asc', ad: 'Maliyet (düşük → yüksek)' },
  { kod: 'maliyet-desc', ad: 'Maliyet (yüksek → düşük)' },
  { kod: 'zorluk-asc', ad: 'Zorluk (kolay → zor)' },
  { kod: 'butce-asc', ad: 'Bütçe (düşük → yüksek)' },
  { kod: 'hedef-tarih', ad: 'Hedef tarihi (yaklaşan önce)' },
  { kod: 'yeni', ad: 'En yeni eklenen' },
  { kod: 'baslik', ad: 'Başlığa göre (A → Z)' },
];

/** Karşılaştırma fonksiyonu: -1, 0, 1 */
export function karsilastir(a, b, ayarlar = VARSAYILAN_AYARLAR) {
  const kod = ayarlar.siralama || 'onerilen';
  const sayi = (x) => (Number.isFinite(Number(x)) ? Number(x) : -1);
  switch (kod) {
    case 'istek-desc': return sayi(b.istekPuani || 0) - sayi(a.istekPuani || 0) || a.baslik.localeCompare(b.baslik, 'tr');
    case 'istek-asc': return sayi(a.istekPuani || 0) - sayi(b.istekPuani || 0) || a.baslik.localeCompare(b.baslik, 'tr');
    case 'maliyet-asc': return toplamMaliyet(a) - toplamMaliyet(b) || a.baslik.localeCompare(b.baslik, 'tr');
    case 'maliyet-desc': return toplamMaliyet(b) - toplamMaliyet(a) || a.baslik.localeCompare(b.baslik, 'tr');
    case 'zorluk-asc': return zorlukPuani(a) - zorlukPuani(b) || a.baslik.localeCompare(b.baslik, 'tr');
    case 'butce-asc': return (Number(a.butce) || 1e9) - (Number(b.butce) || 1e9) || a.baslik.localeCompare(b.baslik, 'tr');
    case 'hedef-tarih': {
      const va = a.hedefTarih || '9999-99-99';
      const vb = b.hedefTarih || '9999-99-99';
      return va.localeCompare(vb) || a.baslik.localeCompare(b.baslik, 'tr');
    }
    case 'yeni': return String(b.olusturma).localeCompare(String(a.olusturma));
    case 'baslik': return a.baslik.localeCompare(b.baslik, 'tr');
    case 'onerilen':
    default:
      return onerilenPuan(b, ayarlar) - onerilenPuan(a, ayarlar)
        || sayi(b.istekPuani || 0) - sayi(a.istekPuani || 0)
        || a.baslik.localeCompare(b.baslik, 'tr');
  }
}

export function sirala(liste, ayarlar = VARSAYILAN_AYARLAR) {
  return [...liste].sort((a, b) => karsilastir(a, b, ayarlar));
}