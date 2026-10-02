// Cihazda kalıcı depolama. Birincil: IndexedDB. IndexedDB açılamazsa: localStorage yedeği.
// Sunucuya hiçbir istek yapılmaz.
'use strict';

const VERI_TABANI = 'hayal-atolyesi';
const SURUM = 1;
const ANAHTAR = 'anahtar';

/** depoAdi -> { anahtar, indeksler } */
export const DEPOLAR = {
  isler: { anahtar: 'id', indeksler: { durum: 'durum', olusturma: 'olusturma' } },
  sozluk: { anahtar: 'id', indeksler: { favori: 'favori' } },
  ayarlar: { anahtar: ANAHTAR, indeksler: {} },
  meta: { anahtar: ANAHTAR, indeksler: {} },
  gorseller: { anahtar: 'id', indeksler: {} },
};

let dbBaglanti = null;
let mod = 'bilinmiyor'; // 'idb' | 'ls'

export async function ac() {
  if (mod !== 'bilinmiyor') return mod;
  try {
    dbBaglanti = await idbAc();
    mod = 'idb';
  } catch (hata) {
    console.warn('IndexedDB açılamadı, yedek depolama kullanılıyor:', hata);
    dbBaglanti = null;
    mod = 'ls';
  }
  return mod;
}

export function depolamaModu() { return mod; }

function idbAc() {
  return new Promise((cozumle, reddet) => {
    if (typeof indexedDB === 'undefined') return reddet(new Error('IndexedDB yok'));
    let istek;
    try { istek = indexedDB.open(VERI_TABANI, SURUM); } catch (h) { return reddet(h); }
    istek.onupgradeneeded = (olay) => {
      const db = olay.target.result;
      for (const [ad, tanim] of Object.entries(DEPOLAR)) {
        let depo = db.objectStoreNames.contains(ad) ? olay.target.transaction.objectStore(ad)
          : db.createObjectStore(ad, { keyPath: tanim.anahtar });
        for (const [ad2, yol] of Object.entries(tanim.indeksler || {})) {
          if (!depo.indexNames.contains(ad2)) depo.createIndex(ad2, yol, { unique: false });
        }
      }
    };
    istek.onsuccess = () => {
      const db = istek.result;
      db.onversionchange = () => db.close();
      cozumle(db);
    };
    istek.onerror = () => reddet(istek.error || new Error('IndexedDB hatası'));
    istek.onblocked = () => reddet(new Error('IndexedDB kilitli (başka sekme açık)'));
  });
}

function lsOku(depo) {
  try {
    const ham = localStorage.getItem(`${VERI_TABANI}:${depo}`);
    return ham ? JSON.parse(ham) : [];
  } catch { return []; }
}
function lsYaz(depo, kayitlar) {
  localStorage.setItem(`${VERI_TABANI}:${depo}`, JSON.stringify(kayitlar));
}
function lsTemizle(depo) { localStorage.removeItem(`${VERI_TABANI}:${depo}`); }

export async function hepsi(depo) {
  await ac();
  if (mod === 'ls') return lsOku(depo);
  const db = dbBaglanti;
  return new Promise((cozumle, reddet) => {
    const istek = db.transaction(depo, 'readonly').objectStore(depo).getAll();
    istek.onsuccess = () => cozumle(istek.result || []);
    istek.onerror = () => reddet(istek.error);
  });
}

export async function getir(depo, id) {
  await ac();
  if (mod === 'ls') return lsOku(depo).find((k) => k[DEPOLAR[depo].anahtar] === id) || null;
  return new Promise((cozumle, reddet) => {
    const istek = dbBaglanti.transaction(depo, 'readonly').objectStore(depo).get(id);
    istek.onsuccess = () => cozumle(istek.result || null);
    istek.onerror = () => reddet(istek.error);
  });
}

export async function yaz(depo, kayit) {
  await ac();
  if (mod === 'ls') {
    const liste = lsOku(depo);
    const ana = DEPOLAR[depo].anahtar;
    const sira = liste.findIndex((k) => k[ana] === kayit[ana]);
    if (sira >= 0) liste[sira] = kayit; else liste.push(kayit);
    lsYaz(depo, liste);
    return kayit;
  }
  return new Promise((cozumle, reddet) => {
    const tx = dbBaglanti.transaction(depo, 'readwrite');
    tx.objectStore(depo).put(kayit);
    tx.oncomplete = () => cozumle(kayit);
    tx.onerror = () => reddet(tx.error);
  });
}

export async function yazToplu(depo, kayitlar) {
  await ac();
  if (mod === 'ls') { lsYaz(depo, kayitlar); return kayitlar; }
  return new Promise((cozumle, reddet) => {
    const tx = dbBaglanti.transaction(depo, 'readwrite');
    const depoNesne = tx.objectStore(depo);
    for (const k of kayitlar) depoNesne.put(k);
    tx.oncomplete = () => cozumle(kayitlar);
    tx.onerror = () => reddet(tx.error);
  });
}

export async function sil(depo, id) {
  await ac();
  if (mod === 'ls') {
    const ana = DEPOLAR[depo].anahtar;
    lsYaz(depo, lsOku(depo).filter((k) => k[ana] !== id));
    return true;
  }
  return new Promise((cozumle, reddet) => {
    const tx = dbBaglanti.transaction(depo, 'readwrite');
    tx.objectStore(depo).delete(id);
    tx.oncomplete = () => cozumle(true);
    tx.onerror = () => reddet(tx.error);
  });
}

export async function bosalt(depo) {
  await ac();
  if (mod === 'ls') { lsTemizle(depo); return true; }
  return new Promise((cozumle, reddet) => {
    const tx = dbBaglanti.transaction(depo, 'readwrite');
    tx.objectStore(depo).clear();
    tx.oncomplete = () => cozumle(true);
    tx.onerror = () => reddet(tx.error);
  });
}

/* ---- Ayarlar ve meta (tek kayıt) ---- */
export async function ayarGet(anahtar, varsayilan = null) {
  const kayit = await getir('ayarlar', anahtar);
  return kayit ? kayit.deger : varsayilan;
}
export async function ayarYaz(anahtar, deger) {
  return yaz('ayarlar', { anahtar, deger });
}
export async function metaGet(anahtar, varsayilan = null) {
  const kayit = await getir('meta', anahtar);
  return kayit ? kayit.deger : varsayilan;
}
export async function metaYaz(anahtar, deger) {
  return yaz('meta', { anahtar, deger });
}

/* ---- İşe özel kısayollar ---- */

/** Bozuk/eksik kayıtları temizler (listelerde boş öğe olmasını engeller). */
export function kayitlariTemiZle(liste) {
  return (liste || [])
    .filter((i) => i && typeof i === 'object' && i.id)
    .map((i) => {
      const kopya = { ...i };
      for (const alan of ['malzemeler', 'adimlar', 'ogrenilecekler', 'zorluklar', 'notlar']) {
        kopya[alan] = Array.isArray(i[alan]) ? i[alan].filter(Boolean) : [];
      }
      return kopya;
    });
}

export async function islerGetir({ silinmisler = false } = {}) {
  const liste = kayitlariTemiZle(await hepsi('isler'));
  return silinmisler ? liste : liste.filter((i) => !i.silindi);
}

export async function isKaydet(is) {
  is.guncelleme = new Date().toISOString();
  for (const alan of ['malzemeler', 'adimlar', 'ogrenilecekler', 'zorluklar', 'notlar']) {
    if (!Array.isArray(is[alan])) is[alan] = [];
    is[alan] = is[alan].filter(Boolean);
  }
  return yaz('isler', is);
}