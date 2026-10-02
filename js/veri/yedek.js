// Yedekleme ve geri yükleme. Yedek dosyası = tüm verinin JSON'u (fotoğraflar dahil).
// Yedek indirmek için internet gerekmez; dosya doğrudan cihaza kaydedilir.
'use strict';
import * as depo from '../veri/depo.js';
import { VARSAYILAN_AYARLAR } from './sema.js';

export const YEDEK_SURUM = 1;
const EN_FAZLA_FOTOGRAF_MB = 4; // JSON'un şişmemesi için sınır

function blobVeriUrl(blob) {
  return new Promise((cozumle) => {
    const r = new FileReader();
    r.onload = () => cozumle(String(r.result));
    r.onerror = () => cozumle(null);
    r.readAsDataURL(blob);
  });
}

function veriUrlBlob(metin) {
  const parcalar = String(metin).split(',');
  if (parcalar.length < 2) return null;
  const tur = /data:([^;]+)/.exec(parcalar[0]);
  try {
    const bayt = Uint8Array.from(atob(parcalar[1]), (c) => c.charCodeAt(0));
    return new Blob([bayt], { type: tur ? tur[1] : 'image/jpeg' });
  } catch { return null; }
}

export async function yedekOlustur() {
  const [tumIsler, sozluk, gorseller] = await Promise.all([
    depo.hepsi('isler'), depo.hepsi('sozluk'), depo.hepsi('gorseller'),
  ]);
  const isler = depo.kayitlariTemiZle(tumIsler);
  const ayarlar = (await depo.ayarGet('genel', null)) || VARSAYILAN_AYARLAR;

  const gorselYedekleri = [];
  let hamBayt = 0;
  for (const g of gorseller) {
    if (!g || !g.veri || typeof g.veri === 'string') { if (g) gorselYedekleri.push({ id: g.id, ad: g.ad, veri: g.veri }); continue; }
    hamBayt += g.boyut || g.veri.size || 0;
    if (hamBayt > EN_FAZLA_FOTOGRAF_MB * 1024 * 1024) continue;
    const veri = await blobVeriUrl(g.veri);
    if (veri) gorselYedekleri.push({ id: g.id, ad: g.ad, boyut: g.boyut, veri });
  }

  return {
    uygulama: 'Hayal Atölyem',
    surum: YEDEK_SURUM,
    olusturma: new Date().toISOString(),
    ayarlar,
    isler,
    sozluk,
    gorseller: gorselYedekleri,
  };
}

export async function yedekBaglanti() {
  const veri = await yedekOlustur();
  const metin = JSON.stringify(veri, null, 2);
  const damga = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  const dosya = `hayal-atolyesi-yedek-${damga}.json`;
  const blob = new Blob([metin], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = dosya; a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return {
    dosya,
    bayt: blob.size,
    isAdet: veri.isler.length,
    sozlukAdet: veri.sozluk.length,
    gorselAdet: veri.gorseller.length,
    gorselAtlandi: (await depo.hepsi('gorseller')).length - veri.gorseller.length,
  };
}

export async function panoyaKopyala() {
  const metin = JSON.stringify(await yedekOlustur());
  try {
    await navigator.clipboard.writeText(metin);
    return { basarili: true, bayt: metin.length };
  } catch {
    const alan = document.createElement('textarea');
    alan.value = metin;
    alan.setAttribute('readonly', '');
    alan.style.position = 'fixed';
    alan.style.opacity = '0';
    document.body.appendChild(alan);
    alan.select();
    alan.setSelectionRange(0, metin.length);
    let basarili = false;
    try { basarili = document.execCommand('copy'); } catch { basarili = false; }
    alan.remove();
    return { basarili, bayt: metin.length };
  }
}

export function yedekDosyaOku(dosya) {
  return new Promise((cozumle, reddet) => {
    const okuyucu = new FileReader();
    okuyucu.onload = () => {
      try {
        const veri = JSON.parse(String(okuyucu.result || ''));
        if (!veri || !Array.isArray(veri.isler)) throw new Error('Dosya içeriği tanınmadı.');
        cozumle(veri);
      } catch (h) { reddet(h); }
    };
    okuyucu.onerror = () => reddet(okuyucu.error || new Error('Dosya okunamadı'));
    okuyucu.readAsText(dosya);
  });
}

export function yedekDogrula(veri) {
  const hatalar = [];
  if (!veri || typeof veri !== 'object') hatalar.push('Dosya okunamadı.');
  else {
    if (!Array.isArray(veri.isler)) hatalar.push('"isler" listesi yok.');
    if (veri.sozluk && !Array.isArray(veri.sozluk)) hatalar.push('"sozluk" listesi hatalı.');
    if (veri.surum && Number(veri.surum) > YEDEK_SURUM) hatalar.push('Bu yedek daha yeni bir sürümden; uygulamayı güncelle.');
  }
  return { gecerli: hatalar.length === 0, hatalar };
}

/** mod: 'degistir' (mevcut verileri sil, yedeği yaz) | 'ekle' (aynı kayıtları güncelle) */
export async function geriYukle(veri, mod = 'degistir') {
  const dogrulama = yedekDogrula(veri);
  if (!dogrulama.gecerli) throw new Error(dogrulama.hatalar.join(' '));

  if (mod === 'degistir') {
    await depo.bosalt('isler');
    await depo.bosalt('sozluk');
    await depo.bosalt('gorseller');
  }

  const varOlan = new Set((await depo.hepsi('isler')).map((i) => i.id));
  const gelenler = depo.kayitlariTemiZle(veri.isler).filter((i) => i.baslik);
  const cakisan = gelenler.filter((i) => varOlan.has(i.id)).length;
  await depo.yazToplu('isler', gelenler);

  let sozlukAdet = 0;
  if (Array.isArray(veri.sozluk)) {
    const kelimeler = veri.sozluk.filter((k) => k && k.id && k.terim);
    sozlukAdet = kelimeler.length;
    await depo.yazToplu('sozluk', kelimeler);
  }

  let gorselAdet = 0;
  if (Array.isArray(veri.gorseller)) {
    const gorseller = [];
    for (const g of veri.gorseller) {
      if (!g || !g.id || !g.veri) continue;
      let veriGercek = g.veri;
      if (typeof veriGercek === 'string') {
        const blob = veriUrlBlob(veriGercek);
        if (!blob) continue;
        veriGercek = blob;
      }
      gorseller.push({ id: g.id, ad: g.ad || 'gorsel.jpg', boyut: g.boyut || veriGercek.size, veri: veriGercek });
      gorselAdet += 1;
    }
    await depo.yazToplu('gorseller', gorseller);
  }

  if (veri.ayarlar && typeof veri.ayarlar === 'object') await depo.ayarYaz('genel', veri.ayarlar);
  await depo.metaYaz('sonYedekleme', new Date().toISOString());
  return { is: gelenler.length, sozluk: sozlukAdet, gorsel: gorselAdet, cakisan };
}