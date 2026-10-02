// ChatGPT / SpaceBunny araştırma sonucunun JSON şeması — TEK KAYNAK.
// Hem "araştırma komutu" üreticisi hem de "içe aktarıcı" bu dosyayı kullanır.
// Saf fonksiyonlar (DOM yok) -> test edilebilir.

export const SURUM = '1.0';
export const KOK_ADI = 'hayal_atolyesi';
export const CIKTI_TURU = 'arastirma_sonucu';

export const PARA_BIRIMLERI = ['TRY', 'USD', 'EUR', 'GBP', 'CHF', 'JPY', 'RUB', 'AED', 'SAR'];
export const VARSAYILAN_PARA_BIRIMI = 'TRY';
export const BIRIMLER = ['adet', 'kg', 'g', 'L', 'm', 'm2', 'm3', 'paket', 'kutu', 'rol', 'saat'];
export const FIYAT_DURUMLARI = ['gercek', 'tahmin', 'bilinmiyor'];
export const SEVIYE_KOLAYLIK = ['kolay', 'orta', 'zor'];
export const SEVIYE_OGRENME = ['baslangic', 'orta', 'ileri'];
export const SURE_BIRIMLERI = ['saat', 'gun', 'hafta', 'ay'];

export const SURE_GUN_KARSILIK = { saat: 1 / 24, gun: 1, hafta: 7, ay: 30 };

/* ------------------------------------------------------------------ *
 * 1) Komuta gömülecek şema metni (SpaceBunny'nin dolduracağı sözleşme)
 * ------------------------------------------------------------------ */
export const JSON_SEMA_METNI = `{
  "${KOK_ADI}": {
    "surum": "${SURUM}",
    "tur": "${CIKTI_TURU}"
  },
  "meta": {
    "model": "SpaceBunny",
    "tarih": "YYYY-AA-GG",
    "fiyat_arastirildi": true | false,
    "para_birimi": "${VARSAYILAN_PARA_BIRIMI}",
    "not": "kısa açıklama (isteğe bağlı)"
  },
  "ozet": {
    "baslik": "isteğe bağlı kısa başlık",
    "aciklama": "isteğe bağlı 2-3 cümlelik özet"
  },
  "eksik_bilgiler": [
    { "soru": "Sorulan soru", "neden_onemli": "Neden cevabı sonucu değiştirir", "ornek_yanit": "ör. seçenek" }
  ],
  "malzemeler": [
    {
      "ad": "malzeme adı",
      "adet": 1,
      "birim": "${BIRIMLER[0]}",
      "birim_fiyat": 0,
      "tutar": 0,
      "para_birimi": "${VARSAYILAN_PARA_BIRIMI}",
      "fiyat_durumu": "gercek | tahmin | bilinmiyor",
      "kaynak": "https://... (fiyatı araştırdıysan)",
      "kontrol_tarihi": "YYYY-AA-GG",
      "not": "isteğe bağlı"
    }
  ],
  "adimlar": [
    { "sira": 1, "baslik": "adım", "aciklama": "nasıl yapılır", "sure_dakika": 30 }
  ],
  "ogrenilecekler": [
    { "konu": "konu", "seviye": "baslangic | orta | ileri", "kaynak": "kaynak/bağlantı", "gerekce": "neden öğrenmeli" }
  ],
  "zorluklar": [
    { "sorun": "sorun", "seviye": "kolay | orta | zor", "cozum": "çözüm", "gerekce": "neden zor" }
  ],
  "notlar": [
    { "metin": "dikkat edilecek tek cümlelik not" }
  ],
  "sure": { "deger": 1, "birim": "saat | gun | hafta | ay" },
  "zorluk_puani": { "puan": 1, "gerekce": "puanı neden verdiğin" },
  "butce_oneri": 0
}`;

/* ------------------------------------------------------------------ *
 * 2) Küçük yardımcılar
 * ------------------------------------------------------------------ */
const TEHLIKELI_ANAHTARLAR = ['__proto__', 'constructor', 'prototype'];

export function metinTemizle(d) {
  if (d === null || d === undefined) return '';
  let s = String(d);
  // kontrol karakterleri ve sıfır genişlikli karakterler atılır
  s = s.replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028\u2029]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s.length > 2000 ? `${s.slice(0, 2000)}…` : s;
}

export function katla(d) {
  return metinTemizle(d)
    .toLocaleLowerCase('tr')
    .replace(/[İıI]/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function sayiMi(d) {
  if (typeof d === 'number') return Number.isFinite(d) ? d : null;
  if (typeof d === 'string') {
    // "1.250,50 ₺", "≈1250 TL", "1200" -> sayı
    const s = d.replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.');
    if (!s || s === '-' || s === '.') return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function tarihMi(d) {
  const s = metinTemizle(d);
  if (!/^\d{4}-\d{2}-\d{2}/.test(s)) return null;
  return s.slice(0, 10);
}

export function urlMi(d) {
  const s = metinTemizle(d);
  if (!s) return '';
  if (/^https?:\/\/\S+$/i.test(s)) return s.slice(0, 500);
  return '';
}

export function enumMi(deger, liste, varsayilan) {
  const s = katla(deger);
  if (!s) return varsayilan;
  const bulunan = liste.find((x) => katla(x) === s);
  return bulunan === undefined ? varsayilan : bulunan;
}

/** Metin içinden ilk { } bloğunu çıkarır (kod bloğu ya da ham JSON). */
export function jsonCikar(metin) {
  const ham = String(metin || '');
  const kodBlogu = /```(?:json)?\s*([\s\S]*?)```/i.exec(ham);
  const kaynak = kodBlogu ? kodBlogu[1] : ham;
  const bas = kaynak.indexOf('{');
  if (bas < 0) return { metin: null, hata: 'Metinde JSON bulunamadı. Yapıştırdığın metin "{" ile başlamalı.' };
  let derinlik = 0;
  let tirnak = false;
  let kacis = false;
  for (let i = bas; i < kaynak.length; i += 1) {
    const c = kaynak[i];
    if (kacis) { kacis = false; continue; }
    if (c === '\\') { kacis = true; continue; }
    if (c === '"') { tirnak = !tirnak; continue; }
    if (tirnak) continue;
    if (c === '{') derinlik += 1;
    else if (c === '}') {
      derinlik -= 1;
      if (derinlik === 0) return { metin: kaynak.slice(bas, i + 1), hata: null };
    }
  }
  return { metin: null, hata: 'JSON bloğu kapanmamış (süslü parantez eşleşmiyor).' };
}

/** Metin parçasının kısa parmak izi (mükerrer aktarımı yakalamak için). */
export function parmakIzi(metin) {
  const s = String(metin || '');
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/* ------------------------------------------------------------------ *
 * 3) Doğrulama ve temizleme
 * ------------------------------------------------------------------ */
function guvenliNesne(d) {
  const kaynak = d && typeof d === 'object' ? d : {};
  const sonuc = {};
  for (const [k, v] of Object.entries(kaynak)) {
    if (TEHLIKELI_ANAHTARLAR.includes(k)) continue;
    sonuc[k] = v;
  }
  return sonuc;
}

function diziMi(d) {
  return Array.isArray(d) ? d : [];
}

/**
 * Ham JSON'u doğrular ve uygulamanın iç şemasına çevirir.
 * Dönüş: { gecerli, hatalar[], uyarilar[], veri }
 */
export function dogrulaVeNormalizeEt(ham) {
  const hatalar = [];
  const uyarilar = [];
  const veri = guvenliNesne(ham);

  const kok = veri[KOK_ADI];
  if (!kok || typeof kok !== 'object') {
    hatalar.push(`Üstte "${KOK_ADI}" bloğu yok. Beklenen ilk satır: "${KOK_ADI}": { "surum": "${SURUM}" }`);
    return { gecerli: false, hatalar, uyarilar, veri: null };
  }
  const surum = metinTemizle(kok.surum);
  if (!surum) {
    hatalar.push(`Sürüm bilgisi yok. JSON'a "${KOK_ADI}": { "surum": "${SURUM}" } ekle.`);
    return { gecerli: false, hatalar, uyarilar, veri: null };
  }
  const anaSurum = surum.split('.')[0];
  const beklenenAna = SURUM.split('.')[0];
  if (anaSurum !== beklenenAna) {
    hatalar.push(anaSurum > beklenenAna
      ? `Sonuç "${surum}" sürümünde, uygulama "${SURUM}" sürümünü okuyor. Sonucu yeni sürümle yeniden iste.`
      : `Sonuç "${surum}" sürümünde, uygulama "${SURUM}" sürümünü okuyor.`);
    return { gecerli: false, hatalar, uyarilar, veri: null };
  }
  if (Number(anaSurum) < Number(beklenenAna)) {
    hatalar.push(`Sonuç çok eski (${surum}).`);
    return { gecerli: false, hatalar, uyarilar, veri: null };
  }

  // İstek puanı asla alınmaz
  if (veri.istek_puani !== undefined || veri.istekPuani !== undefined) {
    uyarilar.push('İstek puanı yalnızca senin belirlediğin alandır; gelen değer kullanılmadı.');
  }
  const bilinmeyen = Object.keys(veri).filter((k) => ![
    KOK_ADI, 'meta', 'ozet', 'eksik_bilgiler', 'malzemeler', 'adimlar',
    'ogrenilecekler', 'zorluklar', 'notlar', 'sure', 'zorluk_puani', 'butce_oneri',
  ].includes(k));
  if (bilinmeyen.length) uyarilar.push(`Tanınmayan alanlar yok sayıldı: ${bilinmeyen.join(', ')}`);

  /* --- meta --- */
  const m = guvenliNesne(veri.meta);
  const meta = {
    model: metinTemizle(m.model) || 'SpaceBunny',
    tarih: tarihMi(m.tarih) || new Date().toISOString().slice(0, 10),
    fiyatArastirildi: m.fiyat_arastirildi === true || m.fiyat_arastirildi === 'true',
    paraBirimi: enumMi(m.para_birimi, PARA_BIRIMLERI, VARSAYILAN_PARA_BIRIMI).toUpperCase(),
    not: metinTemizle(m.not),
  };

  /* --- özet --- */
  const o = guvenliNesne(veri.ozet);
  const ozet = { baslik: metinTemizle(o.baslik), aciklama: metinTemizle(o.aciklama) };

  /* --- eksik bilgiler (sorular) --- */
  const eksik = [];
  diziMi(veri.eksik_bilgiler).forEach((k) => {
    const kk = guvenliNesne(k);
    const soru = metinTemizle(kk.soru || kk.soru_metni);
    if (!soru) return;
    eksik.push({
      soru,
      nedenOnemli: metinTemizle(kk.neden_onemli || kk.neden),
      ornekYanit: metinTemizle(kk.ornek_yanit || kk.ornek),
    });
  });

  /* --- malzemeler --- */
  const malzemeler = [];
  diziMi(veri.malzemeler).forEach((x) => {
    const xx = guvenliNesne(x);
    const ad = metinTemizle(xx.ad || xx.malzeme);
    if (!ad) { hatalar.push('Malzemeler listesinde "ad" alanı boş olan bir satır var.'); return; }
    let adet = sayiMi(xx.adet);
    if (adet === null || adet <= 0) { if (xx.adet !== undefined) uyarilar.push(`"${ad}" için adet belirtilmemiş; 1 kabul edildi.`); adet = 1; }
    const birimFiyat = sayiMi(xx.birim_fiyat ?? xx.birimFiyat ?? xx.fiyat);
    let fiyatDurumu = enumMi(xx.fiyat_durumu ?? xx.fiyatDurumu,
      FIYAT_DURUMLARI, birimFiyat ? 'tahmin' : 'bilinmiyor');
    const paraBirimi = enumMi(xx.para_birimi, PARA_BIRIMLERI, meta.paraBirimi).toUpperCase();
    const kaynak = urlMi(xx.kaynak);
    const kontrolTarihi = tarihMi(xx.kontrol_tarihi ?? xx.kontrolTarihi);
    if (kaynak) meta.fiyatArastirildi = true;
    if (fiyatDurumu === 'gercek' && !kaynak) {
      uyarilar.push(`"${ad}" fiyatı "gercek" işaretli ama kaynak bağlantısı yok; "tahmin" olarak işaretlendi.`);
      fiyatDurumu = 'tahmin';
    }
    if (!birimFiyat && fiyatDurumu !== 'bilinmiyor') {
      fiyatDurumu = 'bilinmiyor';
    }
    const hesaplanan = birimFiyat === null ? null : Math.round(adet * birimFiyat * 100) / 100;
    let tutar = sayiMi(xx.tutar);
    if (tutar !== null && hesaplanan !== null && Math.abs(tutar - hesaplanan) > Math.max(1, hesaplanan * 0.02)) {
      uyarilar.push(`"${ad}" tutarı (${tutar}) adet×fiyat ile (${hesaplanan}) uyuşmuyor; hesaplanan kullanıldı.`);
    }
    if (tutar !== null && hesaplanan === null) uyarilar.push(`"${ad}" için tutar verilmiş ama birim fiyat yok; tutar boş bırakıldı.`);
    if (fiyatDurumu === 'bilinmiyor') {
      uyarilar.push(`"${ad}" fiyatı bilinmiyor olarak işaretlendi; tutar hesaplanmayacak.`);
    }
    if (paraBirimi !== VARSAYILAN_PARA_BIRIMI) {
      uyarilar.push(`"${ad}" fiyatı ${paraBirimi}; uygulama TL kullanıyor, para birimi kayda geçirilir.`);
    }
    malzemeler.push({
      ad, adet, birim: enumMi(xx.birim, BIRIMLER, 'adet'),
      birimFiyat, tutar: hesaplanan, paraBirimi, fiyatDurumu, kaynak, kontrolTarihi,
      not: metinTemizle(xx.not),
    });
  });

  /* --- adımlar --- */
  const adimlar = [];
  diziMi(veri.adimlar).forEach((x, i) => {
    const xx = guvenliNesne(x);
    const baslik = metinTemizle(xx.baslik || xx.adim);
    if (!baslik) { hatalar.push('Yapım adımlarında "baslik" alanı boş olan bir satır var.'); return; }
    const sira = sayiMi(xx.sira) ?? i + 1;
    adimlar.push({
      sira, baslik,
      aciklama: metinTemizle(xx.aciklama || xx.aciklama_metni),
      sureDakika: sayiMi(xx.sure_dakika ?? xx.sureDakika),
    });
  });
  adimlar.sort((a, b) => a.sira - b.sira).forEach((a, i) => { a.sira = i + 1; });

  /* --- öğrenilecekler --- */
  const ogrenilecekler = [];
  diziMi(veri.ogrenilecekler).forEach((x) => {
    const xx = guvenliNesne(x);
    const konu = metinTemizle(xx.konu);
    if (!konu) { hatalar.push('Öğrenilecekler listesinde "konu" alanı boş olan bir satır var.'); return; }
    ogrenilecekler.push({
      konu,
      seviye: enumMi(xx.seviye, SEVIYE_OGRENME, 'baslangic'),
      kaynak: metinTemizle(xx.kaynak),
      gerekce: metinTemizle(xx.gerekce),
    });
  });

  /* --- zorluklar --- */
  const zorluklar = [];
  diziMi(veri.zorluklar).forEach((x) => {
    const xx = guvenliNesne(x);
    const sorun = metinTemizle(xx.sorun);
    if (!sorun) { hatalar.push('Zorluklar listesinde "sorun" alanı boş olan bir satır var.'); return; }
    zorluklar.push({
      sorun,
      seviye: enumMi(xx.seviye, SEVIYE_KOLAYLIK, 'orta'),
      cozum: metinTemizle(xx.cozum),
      gerekce: metinTemizle(xx.gerekce),
    });
  });

  /* --- notlar --- */
  const notlar = [];
  diziMi(veri.notlar).forEach((x) => {
    const xx = guvenliNesne(x);
    const metin = typeof x === 'string' ? metinTemizle(x) : metinTemizle(xx.metin);
    if (metin) notlar.push({ metin });
  });

  /* --- süre --- */
  let sure = null;
  const sr = guvenliNesne(veri.sure);
  const sv = sayiMi(sr.deger);
  const sb = enumMi(sr.birim, SURE_BIRIMLERI, null);
  if (sv !== null && sv > 0 && sb) {
    sure = { deger: sv, birim: sb, gun: Math.round(sv * SURE_GUN_KARSILIK[sb] * 100) / 100 };
  } else if (sv !== null && sr.deger !== undefined) {
    uyarilar.push('Süre alanı anlaşılamadı; süre tahmini eklenmedi.');
  }

  /* --- zorluk puanı --- */
  let zorlukPuani = null;
  const zp = guvenliNesne(veri.zorluk_puani);
  const zpn = sayiMi(zp.puan !== undefined ? zp.puan : veri.zorluk_puani);
  if (zpn !== null) {
    const p = Math.min(5, Math.max(1, Math.round(zpn)));
    zorlukPuani = { puan: p, gerekce: metinTemizle(zp.gerekce) };
  }

  const butceOneri = sayiMi(veri.butce_oneri);
  if (meta.paraBirimi !== VARSAYILAN_PARA_BIRIMI) {
    uyarilar.push(`Sonuç para birimi ${meta.paraBirimi}, uygulama ${VARSAYILAN_PARA_BIRIMI} kullanıyor.`);
  }
  if (malzemeler.length && !meta.fiyatArastirildi) {
    uyarilar.push('Fiyat araştırılmadı olarak işaretlenmiş; tutarlar tahmin ya da bilinmiyor olmalı.');
  }

  return {
    gecerli: hatalar.length === 0,
    hatalar,
    uyarilar,
    veri: hatalar.length ? null : {
      surum, meta, ozet, eksik, malzemeler, adimlar, ogrenilecekler, zorluklar, notlar,
      sure, zorlukPuani, butceOneri,
    },
  };
}

/** Kullanıcı yapıştırdığı metni tam olarak ayrıştırır (kod bloğu veya ham JSON). */
export function ayiristir(metin) {
  const { metin: parca, hata } = jsonCikar(metin);
  if (!parca) return { gecerli: false, hatalar: [hata], uyarilar: [], veri: null, parmakIzi: parmakIzi(metin) };
  let ham;
  try {
    ham = JSON.parse(parca); // dikkat: asla eval/Function kullanılmaz
  } catch (e) {
    return {
      gecerli: false,
      hatalar: [`JSON okunamadı: ${e.message}`],
      uyarilar: [],
      veri: null,
      parmakIzi: parmakIzi(metin),
    };
  }
  const sonuc = dogrulaVeNormalizeEt(ham);
  return { ...sonuc, parmakIzi: parmakIzi(metin) };
}