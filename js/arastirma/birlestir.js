// Gelen araştırma sonucunu mevcut hayale "planlayarak" yerleştirir.
// KURALLAR (değiştirilemez):
//  - İstek puanı hiçbir zaman dokunulmaz.
//  - Tamamlanmış adımlar korunur (metin, sıra, tik).
//  - Kişisel notların metni değiştirilmez; sadece yeni not eklenebilir.
//  - Kullanıcının girdiği boş olmayan alanların üzerine yazılmaz.
// Saf fonksiyonlar -> test edilebilir.
'use strict';
import { kisaKim } from '../ui/bilesen.js';
import { katla } from './sema.js';

export const VARSAYILAN_SECENEKLER = {
  malzemeler: true,
  adimlar: true,
  ogrenilecekler: true,
  zorluklar: true,
  notlar: true,
  sure: false,
  zorlukPuani: false,
  ozet: false,
  butce: false,
};

function esle(mevcutListe, gelen, alanAdi) {
  const harita = new Map();
  for (const kayit of mevcutListe || []) {
    const anahtar = katla(kayit[alanAdi]);
    if (anahtar && !harita.has(anahtar)) harita.set(anahtar, kayit);
  }
  return harita;
}

/**
 * Ne yapılacağını hesaplar (kaydetmez).
 * -> { bolumler, tekil, toplamlar, uyarilar, ozetMetni }
 */
export function planla(hayal, veri, secenekler = {}) {
  const sec = { ...VARSAYILAN_SECENEKLER, ...secenekler };
  const v = {
    malzemeler: veri.malzemeler || [],
    adimlar: veri.adimlar || [],
    ogrenilecekler: veri.ogrenilecekler || [],
    zorluklar: veri.zorluklar || [],
    notlar: veri.notlar || [],
    ozet: veri.ozet || { baslik: '', aciklama: '' },
    meta: veri.meta || { paraBirimi: 'TRY', fiyatArastirildi: false },
    sure: veri.sure || null,
    zorlukPuani: veri.zorlukPuani || null,
    butceOneri: veri.butceOneri ?? null,
  };
  const uyarilar = [];
  const bolumler = {
    malzemeler: { yeni: [], guncelle: [], korumali: [], ayni: 0 },
    adimlar: { yeni: [], guncelle: [], korumali: [], ayni: 0 },
    ogrenilecekler: { yeni: [], guncelle: [], korumali: [], ayni: 0 },
    zorluklar: { yeni: [], guncelle: [], korumali: [], ayni: 0 },
    notlar: { yeni: [], guncelle: [], korumali: [], ayni: 0 },
  };

  /* ---------------- Malzemeler ---------------- */
  {
    const harita = esle(hayal.malzemeler, v.malzemeler, 'ad');
    for (const gelen of v.malzemeler) {
      const varolan = harita.get(katla(gelen.ad));
      if (!varolan) { bolumler.malzemeler.yeni.push(gelen); continue; }
      const degisiklikler = [];
      if (!varolan.birimFiyat && gelen.birimFiyat !== null) degisiklikler.push(`fiyat: ${gelen.birimFiyat} ${gelen.paraBirimi} (${gelen.fiyatDurumu})`);
      if ((varolan.adet === null || varolan.adet === undefined) && gelen.adet) degisiklikler.push(`adet: ${gelen.adet} ${gelen.birim}`);
      if (!varolan.kaynak && gelen.kaynak) degisiklikler.push(`kaynak: ${gelen.kaynak}`);
      if (!varolan.not && gelen.not) degisiklikler.push(`not: ${gelen.not}`);
      if (degisiklikler.length) bolumler.malzemeler.guncelle.push({ hedef: varolan, gelen, degisiklikler });
      else bolumler.malzemeler.ayni += 1;
    }
    if (bolumler.malzemeler.ayni) {
      uyarilar.push(`${bolumler.malzemeler.ayni} malzeme zaten kayıtlı ve aynı — tekrar eklenmedi.`);
    }
  }

  /* ---------------- Yapım adımları ---------------- */
  {
    const harita = esle(hayal.adimlar, v.adimlar, 'baslik');
    for (const gelen of v.adimlar) {
      const varolan = harita.get(katla(gelen.baslik));
      if (!varolan) { bolumler.adimlar.yeni.push(gelen); continue; }
      if (varolan.tamamlandi) {
        bolumler.adimlar.korumali.push({ hedef: varolan, gelen, sebep: 'Tamamlanmış adım — dokunulmadı' });
        continue;
      }
      if (!varolan.aciklama && gelen.aciklama) {
        bolumler.adimlar.guncelle.push({ hedef: varolan, gelen, degisiklikler: [`açıklama eklendi: ${gelen.aciklama}`] });
      } else {
        bolumler.adimlar.ayni += 1;
      }
    }
  }

  /* ---------------- Öğrenilecekler ---------------- */
  {
    const harita = esle(hayal.ogrenilecekler, v.ogrenilecekler, 'konu');
    for (const gelen of v.ogrenilecekler) {
      const varolan = harita.get(katla(gelen.konu));
      if (!varolan) { bolumler.ogrenilecekler.yeni.push(gelen); continue; }
      if (varolan.ogrenildi) {
        bolumler.ogrenilecekler.korumali.push({ hedef: varolan, gelen, sebep: 'Öğrenilmiş olarak işaretli — dokunulmadı' });
        continue;
      }
      const degisiklikler = [];
      if (!varolan.kaynak && gelen.kaynak) degisiklikler.push(`kaynak: ${gelen.kaynak}`);
      if (!varolan.seviye && gelen.seviye) degisiklikler.push(`seviye: ${gelen.seviye}`);
      if (degisiklikler.length) bolumler.ogrenilecekler.guncelle.push({ hedef: varolan, gelen, degisiklikler });
      else bolumler.ogrenilecekler.ayni += 1;
    }
  }

  /* ---------------- Zorluklar ---------------- */
  {
    const harita = esle(hayal.zorluklar, v.zorluklar, 'sorun');
    for (const gelen of v.zorluklar) {
      const varolan = harita.get(katla(gelen.sorun));
      if (!varolan) { bolumler.zorluklar.yeni.push(gelen); continue; }
      if (varolan.asildi) {
        bolumler.zorluklar.korumali.push({ hedef: varolan, gelen, sebep: 'Aşılmış olarak işaretli — dokunulmadı' });
        continue;
      }
      if (!varolan.cozum && gelen.cozum) {
        bolumler.zorluklar.guncelle.push({ hedef: varolan, gelen, degisiklikler: [`çözüm eklendi: ${gelen.cozum}`] });
      } else bolumler.zorluklar.ayni += 1;
    }
  }

  /* ---------------- Notlar (sadece ekleme) ---------------- */
  {
    // Kayıt notu "Araştırma: " ön ekiyle saklandığı için eşleştirmede ön ek yok sayılır
    const harita = new Map();
    for (const n of hayal.notlar || []) {
      const anahtar = katla(String(n.metin || '').replace(/^ara[sş]t[iı]rma\s*:\s*/i, ''));
      if (anahtar && !harita.has(anahtar)) harita.set(anahtar, n);
    }
    for (const gelen of v.notlar) {
      if (harita.has(katla(gelen.metin))) { bolumler.notlar.ayni += 1; continue; }
      bolumler.notlar.yeni.push(gelen);
    }
  }

  /* ---------------- Tekil alanlar ---------------- */
  const sure = {
    mevcut: hayal.sureGun ?? null,
    gelen: v.sure ? v.sure.gun : null,
    metin: v.sure ? `${v.sure.deger} ${v.sure.birim}` : '',
    degisecek: !!(v.sure && hayal.sureGun !== v.sure.gun),
  };
  const zorlukPuani = {
    mevcut: hayal.zorlukPuani ?? null,
    gelen: v.zorlukPuani ? v.zorlukPuani.puan : null,
    gerekce: v.zorlukPuani ? v.zorlukPuani.gerekce : '',
    degisecek: !!(v.zorlukPuani && hayal.zorlukPuani !== v.zorlukPuani.puan),
  };
  const ozet = {
    baslikMevcut: hayal.baslik || '',
    baslikGelen: v.ozet.baslik || '',
    aciklamaMevcut: hayal.aciklama || '',
    aciklamaGelen: v.ozet.aciklama || '',
  };
  const butce = {
    mevcut: hayal.butce ?? null,
    gelen: v.butceOneri ?? null,
  };

  /* ---------------- Özet rakamlar ---------------- */
  const bilinenler = v.malzemeler.filter((m) => m.birimFiyat !== null);
  const bilinmeyenler = v.malzemeler.filter((m) => m.birimFiyat === null);
  const tahminSayisi = v.malzemeler.filter((m) => m.fiyatDurumu === 'tahmin').length;
  const toplamlar = {
    malzemeSayisi: v.malzemeler.length,
    bilinenToplam: bilinenler.reduce((t, m) => t + (m.tutar || 0), 0),
    bilinmeyenSayisi: bilinmeyenler.length,
    tahminSayisi,
    kaynakliSayisi: v.malzemeler.filter((m) => m.kaynak).length,
    paraBirimi: v.meta.paraBirimi,
  };

  const say = (b) => b.yeni.length + b.guncelle.length;
  const ozetMetni = [
    `${bolumler.malzemeler.yeni.length} yeni malzeme`,
    `${bolumler.adimlar.yeni.length} yeni adım`,
    `${bolumler.ogrenilecekler.yeni.length} yeni öğrenilecek`,
    `${bolumler.zorluklar.yeni.length} yeni zorluk`,
    `${bolumler.notlar.yeni.length} yeni not`,
  ].join(' · ');

  const toplamDegisiklik = Object.values(bolumler).reduce((t, b) => t + say(b), 0);

  return {
    sec, bolumler, tekil: { sure, zorlukPuani, ozet, butce }, toplamlar, uyarilar, ozetMetni,
    degisiklikSayisi: toplamDegisiklik,
  };
}

/**
 * Planı uygular; YENİ nesne döner (kayıt yazmaz, kaydetme ekranın işi).
 */
export function uygula(hayal, veri, plan, secenekler = {}) {
  const sec = { ...VARSAYILAN_SECENEKLER, ...secenekler };
  const v = {
    malzemeler: veri.malzemeler || [],
    adimlar: veri.adimlar || [],
    ogrenilecekler: veri.ogrenilecekler || [],
    zorluklar: veri.zorluklar || [],
    notlar: veri.notlar || [],
    ozet: veri.ozet || { baslik: '', aciklama: '' },
    sure: veri.sure || null,
    zorlukPuani: veri.zorlukPuani || null,
    butceOneri: veri.butceOneri ?? null,
  };
  const yeni = { ...hayal };

  /* Malzemeler */
  yeni.malzemeler = (hayal.malzemeler || []).map((m) => ({ ...m }));
  if (sec.malzemeler) {
    for (const g of plan.bolumler.malzemeler.guncelle) {
      const hedef = yeni.malzemeler.find((m) => m.id === g.hedef.id);
      if (!hedef) continue;
      if (!hedef.birimFiyat && g.gelen.birimFiyat !== null) {
        hedef.birimFiyat = g.gelen.birimFiyat;
        hedef.paraBirimi = g.gelen.paraBirimi;
        hedef.fiyatDurumu = g.gelen.fiyatDurumu;
      }
      if ((hedef.adet === null || hedef.adet === undefined) && g.gelen.adet) {
        hedef.adet = g.gelen.adet;
        hedef.birim = g.gelen.birim;
      }
      if (!hedef.kaynak && g.gelen.kaynak) hedef.kaynak = g.gelen.kaynak;
      if (!hedef.kontrolTarihi && g.gelen.kontrolTarihi) hedef.kontrolTarihi = g.gelen.kontrolTarihi;
      if (!hedef.not && g.gelen.not) hedef.not = g.gelen.not;
    }
    for (const gelen of plan.bolumler.malzemeler.yeni) {
      yeni.malzemeler.push({
        id: kisaKim(),
        ad: gelen.ad,
        adet: gelen.adet,
        birim: gelen.birim,
        birimFiyat: gelen.birimFiyat,
        paraBirimi: gelen.paraBirimi,
        fiyatDurumu: gelen.fiyatDurumu,
        kaynak: gelen.kaynak || '',
        kontrolTarihi: gelen.kontrolTarihi || '',
        not: gelen.not ? `${gelen.not}`.slice(0, 200) : '',
        aldi: false,
      });
    }
  }

  /* Adımlar — tamamlananlara dokunulmaz */
  yeni.adimlar = (hayal.adimlar || []).map((a) => ({ ...a }));
  if (sec.adimlar) {
    for (const g of plan.bolumler.adimlar.guncelle) {
      const hedef = yeni.adimlar.find((a) => a.id === g.hedef.id);
      if (hedef && !hedef.tamamlandi && !hedef.aciklama) hedef.aciklama = g.gelen.aciklama;
    }
    const enBuyuk = yeni.adimlar.reduce((m, a) => Math.max(m, Number(a.sira) || 0), 0);
    let sira = enBuyuk;
    for (const gelen of plan.bolumler.adimlar.yeni) {
      sira += 1;
      yeni.adimlar.push({
        id: kisaKim(),
        sira,
        baslik: gelen.baslik,
        aciklama: gelen.aciklama || '',
        tamamlandi: false,
        sureDakika: gelen.sureDakika ?? null,
      });
    }
  }

  /* Öğrenilecekler */
  yeni.ogrenilecekler = (hayal.ogrenilecekler || []).map((o) => ({ ...o }));
  if (sec.ogrenilecekler) {
    for (const g of plan.bolumler.ogrenilecekler.guncelle) {
      const hedef = yeni.ogrenilecekler.find((o) => o.id === g.hedef.id);
      if (!hedef || hedef.ogrenildi) continue;
      if (!hedef.kaynak) hedef.kaynak = g.gelen.kaynak;
      if (!hedef.seviye) hedef.seviye = g.gelen.seviye;
      if (!hedef.gerekce) hedef.gerekce = g.gelen.gerekce;
    }
    for (const gelen of plan.bolumler.ogrenilecekler.yeni) {
      yeni.ogrenilecekler.push({
        id: kisaKim(),
        konu: gelen.konu,
        seviye: gelen.seviye,
        kaynak: gelen.kaynak,
        gerekce: gelen.gerekce,
        ogrenildi: false,
      });
    }
  }

  /* Zorluklar */
  yeni.zorluklar = (hayal.zorluklar || []).map((z) => ({ ...z }));
  if (sec.zorluklar) {
    for (const g of plan.bolumler.zorluklar.guncelle) {
      const hedef = yeni.zorluklar.find((z) => z.id === g.hedef.id);
      if (!hedef || hedef.asildi) continue;
      if (!hedef.cozum) hedef.cozum = g.gelen.cozum;
      if (!hedef.gerekce) hedef.gerekce = g.gelen.gerekce;
    }
    for (const gelen of plan.bolumler.zorluklar.yeni) {
      yeni.zorluklar.push({
        id: kisaKim(),
        sorun: gelen.sorun,
        seviye: gelen.seviye,
        cozum: gelen.cozum,
        gerekce: gelen.gerekce,
        asildi: false,
      });
    }
  }

  /* Notlar — sadece eklenir */
  yeni.notlar = (hayal.notlar || []).map((n) => ({ ...n }));
  if (sec.notlar) {
    const bugun = new Date().toISOString().slice(0, 10);
    for (const gelen of plan.bolumler.notlar.yeni) {
      yeni.notlar.push({ id: kisaKim(), metin: `Araştırma: ${gelen.metin}`, tarih: bugun });
    }
  }

  /* Tekil alanlar — varsayılan: dokunulmaz */
  if (sec.sure && v.sure) yeni.sureGun = v.sure.gun;
  if (sec.zorlukPuani && v.zorlukPuani) yeni.zorlukPuani = v.zorlukPuani.puan;
  if (sec.butce && v.butceOneri !== null) yeni.butce = v.butceOneri;
  if (sec.ozet) {
    if (v.ozet.baslik && yeni.baslik) yeni.baslik = v.ozet.baslik;
    if (v.ozet.aciklama) yeni.aciklama = v.ozet.aciklama;
  }

  /* İstek puanı ve demo/silinmiş işaretleri korunur (bilerek kopyalanmadı) */
  yeni.istekPuani = hayal.istekPuani ?? null;
  yeni.demo = hayal.demo ?? false;
  yeni.silindi = hayal.silindi ?? false;

  return yeni;
}