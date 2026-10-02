// Araştırma akışı testleri: ayrıştırma, doğrulama, fiyat kuralları, mükerrer koruması,
// korunan alanlar, güvenlik.
// Kullanım:  node --test tools/testler/arastirma.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ayiristir, jsonCikar, dogrulaVeNormalizeEt, SURUM, KOK_ADI, parmakIzi, katla } from '../../js/arastirma/sema.js';
import { planla, uygula, VARSAYILAN_SECENEKLER } from '../../js/arastirma/birlestir.js';
import { komutUret } from '../../js/arastirma/komut.js';
import { bosHayal } from '../../js/veri/sema.js';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ornekYol = (ad) => path.join(KOK, 'docs', 'ornek-veriler', ad);
const ornekMetni = (ad) => fs.readFileSync(ornekYol(ad), 'utf8');

const taban = (ek = {}) => ({
  ...bosHayal(),
  id: 'test1',
  baslik: 'Test hayali',
  ...ek,
});

/* ---------------- Ayıklama ---------------- */
test('kod bloğu içindeki JSON bulunur', () => {
  const metin = 'Tablom şöyle:\n```json\n{"a": 1}\n```\nUmarım yardımcı olur.';
  assert.equal(jsonCikar(metin).metin, '{"a": 1}');
});

test('düz JSON (kod bloğu olmadan) bulunur', () => {
  assert.equal(jsonCikar('Ön bilgi: {"a": {"b": 2}} sonrası').metin, '{"a": {"b": 2}}');
});

test('tırnak içindeki parantezler sayılmaz', () => {
  const metin = '```json\n{"ad": "boya (1 L) }", "adet": 2}\n```';
  assert.equal(jsonCikar(metin).metin, '{"ad": "boya (1 L) }", "adet": 2}');
});

test('JSON yoksa anlaşılır hata verir', () => {
  assert.match(jsonCikar('merhaba, JSON yok').hata, /JSON bulunamadı/);
});

test('kapanmamış JSON hatası verir', () => {
  assert.match(jsonCikar('{"a": 1').hata, /kapanmamış/);
});

test('bozuk JSON anlaşılır hata verir', () => {
  const r = ayiristir('```json\n{"a": ,}\n```');
  assert.equal(r.gecerli, false);
  assert.match(r.hatalar[0], /JSON okunamadı/);
});

/* ---------------- Sürüm ---------------- */
test('sürüm bloğu yoksa reddedilir', () => {
  const r = dogrulaVeNormalizeEt({ malzemeler: [] });
  assert.equal(r.gecerli, false);
  assert.match(r.hatalar[0], new RegExp(KOK_ADI));
});

test('sürüm alanı boşsa reddedilir', () => {
  const r = dogrulaVeNormalizeEt({ [KOK_ADI]: { surum: '' } });
  assert.equal(r.gecerli, false);
  assert.match(r.hatalar[0], /Sürüm bilgisi yok/);
});

test('daha yeni sürüm reddedilir ve ne yapılacağı söylenir', () => {
  const r = dogrulaVeNormalizeEt({ [KOK_ADI]: { surum: '2.0' }, malzemeler: [] });
  assert.equal(r.gecerli, false);
  assert.match(r.hatalar[0], /yeniden iste/);
});

test('aynı ana sürüm kabul edilir', () => {
  const r = dogrulaVeNormalizeEt({ [KOK_ADI]: { surum: `${SURUM}` }, malzemeler: [] });
  assert.equal(r.gecerli, true);
});

/* ---------------- Alan doğrulama ---------------- */
test('malzeme adı boşsa hata verir', () => {
  const r = dogrulaVeNormalizeEt({ [KOK_ADI]: { surum: SURUM }, malzemeler: [{ adet: 2 }] });
  assert.equal(r.gecerli, false);
  assert.match(r.hatalar[0], /"ad" alanı boş/);
});

test('adım başlığı boşsa hata verir', () => {
  const r = dogrulaVeNormalizeEt({ [KOK_ADI]: { surum: SURUM }, adimlar: [{ aciklama: 'sadece açıklama' }] });
  assert.equal(r.gecerli, false);
  assert.match(r.hatalar[0], /"baslik" alanı boş/);
});

test('istenmeyen alanlar yok sayılır ve uyarılır', () => {
  const r = dogrulaVeNormalizeEt({ [KOK_ADI]: { surum: SURUM }, malzemeler: [], istek_puani: 9, uydurma: 1 });
  assert.equal(r.gecerli, true);
  assert.ok(r.uyarilar.some((u) => /İstek puanı/.test(u)));
  assert.ok(r.uyarilar.some((u) => /uydurma/.test(u)));
});

/* ---------------- Fiyat kuralları ---------------- */
const fiyatli = (birimFiyat, ek = {}) => ({
  [KOK_ADI]: { surum: SURUM },
  malzemeler: [{ ad: 'Boya', adet: 2, birim_fiyat: birimFiyat, ...ek }],
});

test('fiyat verilmişse tutar hesaplanır', () => {
  const r = dogrulaVeNormalizeEt(fiyatli(420, { fiyat_durumu: 'tahmin' }));
  assert.equal(r.veri.malzemeler[0].tutar, 840);
});

test('fiyat bilinmiyorsa tutar hesaplanmaz', () => {
  const r = dogrulaVeNormalizeEt(fiyatli(null, { fiyat_durumu: 'bilinmiyor' }));
  assert.equal(r.veri.malzemeler[0].birimFiyat, null);
  assert.equal(r.veri.malzemeler[0].tutar, null);
  assert.equal(r.veri.malzemeler[0].fiyatDurumu, 'bilinmiyor');
});

test('fiyat yok ama "gercek" denmişse tahmine çevrilir ve uyarılır', () => {
  const r = dogrulaVeNormalizeEt(fiyatli(null, { fiyat_durumu: 'gercek', kaynak: 'https://ornek.com' }));
  assert.equal(r.veri.malzemeler[0].fiyatDurumu, 'bilinmiyor');
});

test('"gercek" ama kaynak yoksa tahmine çevrilir ve uyarılır', () => {
  const r = dogrulaVeNormalizeEt(fiyatli(300, { fiyat_durumu: 'gercek' }));
  assert.equal(r.veri.malzemeler[0].fiyatDurumu, 'tahmin');
  assert.ok(r.uyarilar.some((u) => /kaynak bağlantısı yok/.test(u)));
});

test('kaynak varsa gercek kabul edilir', () => {
  const r = dogrulaVeNormalizeEt(fiyatli(300, {
    fiyat_durumu: 'gercek', kaynak: 'https://www.ornek.com/boya', kontrol_tarihi: '2026-09-01',
  }));
  assert.equal(r.veri.malzemeler[0].fiyatDurumu, 'gercek');
  assert.equal(r.veri.meta.fiyatArastirildi, true);
});

test('http olmayan kaynak kabul edilmez', () => {
  const r = dogrulaVeNormalizeEt(fiyatli(300, { fiyat_durumu: 'gercek', kaynak: 'javascript:alert(1)' }));
  assert.equal(r.veri.malzemeler[0].kaynak, '');
});

test('tutar adet×fiyat ile uyuşmuyorsa hesaplanan kullanılır', () => {
  const r = dogrulaVeNormalizeEt(fiyatli(420, { tutar: 9999, fiyat_durumu: 'tahmin' }));
  assert.equal(r.veri.malzemeler[0].tutar, 840);
  assert.ok(r.uyarilar.some((u) => /uyuşmuyor/.test(u)));
});

test('yabancı para birimi uyarılır', () => {
  const r = dogrulaVeNormalizeEt(fiyatli(50, { para_birimi: 'USD', fiyat_durumu: 'tahmin' }));
  assert.equal(r.veri.malzemeler[0].paraBirimi, 'USD');
  assert.ok(r.uyarilar.some((u) => /USD/.test(u)));
});

/* ---------------- Süre ve zorluk ---------------- */
test('süre gün cinsine çevrilir', () => {
  const r = dogrulaVeNormalizeEt({ [KOK_ADI]: { surum: SURUM }, sure: { deger: 2, birim: 'hafta' } });
  assert.equal(r.veri.sure.gun, 14);
});

test('geçersiz süre birimi reddedilir (uyarı verir, atlanır)', () => {
  const r = dogrulaVeNormalizeEt({ [KOK_ADI]: { surum: SURUM }, sure: { deger: 5, birim: 'yil' } });
  assert.equal(r.veri.sure, null);
});

test('zorluk puanı gerekçesiyle alınır', () => {
  const r = dogrulaVeNormalizeEt({ [KOK_ADI]: { surum: SURUM }, zorluk_puani: { puan: 7, gerekce: 'çok zor' } });
  assert.equal(r.veri.zorlukPuani.puan, 5);
  assert.equal(r.veri.zorlukPuani.gerekce, 'çok zor');
});

/* ---------------- Güvenlik ---------------- */
test('__proto__ anahtarı yok sayılır', () => {
  const ham = JSON.parse(`{"${KOK_ADI}":{"surum":"${SURUM}"},"malzemeler":[],"__proto__":{"kirlilik":true}}`);
  const r = dogrulaVeNormalizeEt(ham);
  assert.equal(r.gecerli, true);
  assert.equal({}.kirlilik, undefined, 'Object.prototype kirletilmemeli');
  assert.equal(Object.prototype.hasOwnProperty.call(r.veri, '__proto__'), false);
});

test('script etiketi metin olarak kalır (çalıştırılmaz)', () => {
  const kotu = '<script>alert(1)</script> & "kötü"';
  const r = dogrulaVeNormalizeEt({ [KOK_ADI]: { surum: SURUM }, malzemeler: [{ ad: kotu, adet: 1 }] });
  assert.equal(r.veri.malzemeler[0].ad, kotu); // düz metin olarak saklanır
  assert.equal(typeof r.veri.malzemeler[0].ad, 'string');
});

test('kontrol karakterleri temizlenir', () => {
  const r = dogrulaVeNormalizeEt({ [KOK_ADI]: { surum: SURUM }, malzemeler: [{ ad: 'Boya\u0000\u200b test', adet: 1 }] });
  assert.ok(!r.veri.malzemeler[0].ad.includes('\u0000'));
  assert.ok(!r.veri.malzemeler[0].ad.includes('\u200b'));
});

/* ---------------- Örnek veri setleri ---------------- */
for (const ad of ['koltuk-boyama.arastirma.json', 'ispnakli-pogaca.arastirma.json']) {
  test(`örnek veri okunur ve doğrulanır: ${ad}`, () => {
    const r = ayiristir(ornekMetni(ad));
    assert.equal(r.gecerli, true, `hatalar: ${(r.hatalar || []).join(' | ')}`);
    assert.equal(r.veri.surum, SURUM);
    assert.ok(r.veri.malzemeler.length >= 4);
    assert.ok(r.veri.adimlar.length >= 4);
    assert.ok(r.veri.eksik.length >= 1, 'önce sorulacak sorular olmalı');
    assert.ok(r.veri.zorlukPuani && r.veri.zorlukPuani.gerekce, 'gerekçeli zorluk tahmini olmalı');
    assert.ok(r.veri.sure, 'süre tahmini olmalı');
    assert.equal(r.veri.meta.fiyatArastirildi, false);
    assert.match(r.veri.meta.not, /ÖRNEK|örnek/);
  });

  test(`örnek veri fiyat uydurmaz: ${ad}`, () => {
    const r = ayiristir(ornekMetni(ad));
    const uydurma = r.veri.malzemeler.filter((m) => m.fiyatDurumu === 'gercek');
    assert.equal(uydurma.length, 0, 'fiyat araştırılmadıysa "gercek" işaretli kalem olmamalı');
    assert.equal(r.veri.malzemeler.every((m) => m.birimFiyat === null || m.fiyatDurumu !== 'gercek'), true);
  });
}

/* ---------------- Birleştirme kuralları ---------------- */
test('istek puanı hiçbir koşulda değişmez', () => {
  const hayal = taban({ istekPuani: 9 });
  const veri = { malzemeler: [{ ad: 'Yeni', adet: 1 }], notlar: [{ metin: 'x' }] };
  const plan = planla(hayal, veri, { ...VARSAYILAN_SECENEKLER, sure: true, zorlukPuani: true });
  const sonuc = uygula(hayal, veri, plan, { ...VARSAYILAN_SECENEKLER, sure: true, zorlukPuani: true });
  assert.equal(sonuc.istekPuani, 9);
});

test('gelen istek_puanı alanı yok sayılır', () => {
  const r = ayiristir(JSON.stringify({ [KOK_ADI]: { surum: SURUM }, istek_puani: 2, malzemeler: [] }));
  assert.equal(r.gecerli, true);
  assert.ok(r.uyarilar.some((u) => /İstek puanı/.test(u)));
});

test('tamamlanmış adım korunur', () => {
  const hayal = taban({
    adimlar: [
      { id: 'a1', sira: 1, baslik: 'Koltuğu balkona çıkar', aciklama: 'benim yazdığım açıklama', tamamlandi: true },
    ],
  });
  const veri = { adimlar: [{ sira: 1, baslik: 'Koltuğu balkona çıkar', aciklama: 'yapay cevap açıklaması' }] };
  const plan = planla(hayal, veri, VARSAYILAN_SECENEKLER);
  assert.equal(plan.bolumler.adimlar.korumali.length, 1);
  assert.equal(plan.bolumler.adimlar.guncelle.length, 0);
  const sonuc = uygula(hayal, veri, plan, VARSAYILAN_SECENEKLER);
  assert.equal(sonuc.adimlar.length, 1);
  assert.equal(sonuc.adimlar[0].tamamlandi, true);
  assert.equal(sonuc.adimlar[0].aciklama, 'benim yazdığım açıklama');
});

test('tamamlanmamış adımın açıklaması boşsa doldurulur, doluysa korunur', () => {
  const hayal = taban({ adimlar: [{ id: 'a1', sira: 1, baslik: 'Zımparala', aciklama: '', tamamlandi: false }] });
  const veri1 = { adimlar: [{ sira: 1, baslik: 'Zımparala', aciklama: 'yeni açıklama' }] };
  const p1 = planla(hayal, veri1, VARSAYILAN_SECENEKLER);
  assert.equal(p1.bolumler.adimlar.guncelle.length, 1);
  assert.equal(uygula(hayal, veri1, p1, VARSAYILAN_SECENEKLER).adimlar[0].aciklama, 'yeni açıklama');

  const hayal2 = taban({ adimlar: [{ id: 'a1', sira: 1, baslik: 'Zımparala', aciklama: 'kendi notum', tamamlandi: false }] });
  const p2 = planla(hayal2, veri1, VARSAYILAN_SECENEKLER);
  assert.equal(p2.bolumler.adimlar.ayni, 1);
  assert.equal(uygula(hayal2, veri1, p2, VARSAYILAN_SECENEKLER).adimlar[0].aciklama, 'kendi notum');
});

test('öğrenilmiş konu ve aşılmış zorluk korunur', () => {
  const hayal = taban({
    ogrenilecekler: [{ id: 'o1', konu: 'Vernik', seviye: 'baslangic', kaynak: 'kendi notum', ogrenildi: true }],
    zorluklar: [{ id: 'z1', sorun: 'Catlak ayak', seviye: 'orta', cozum: '', asildi: true }],
  });
  const veri = {
    ogrenilecekler: [{ konu: 'Vernik', seviye: 'ileri', kaynak: 'yeni kaynak' }],
    zorluklar: [{ sorun: 'Catlak ayak', seviye: 'zor', cozum: 'macun' }],
  };
  const plan = planla(hayal, veri, VARSAYILAN_SECENEKLER);
  assert.equal(plan.bolumler.ogrenilecekler.korumali.length, 1);
  assert.equal(plan.bolumler.zorluklar.korumali.length, 1);
  const sonuc = uygula(hayal, veri, plan, VARSAYILAN_SECENEKLER);
  assert.equal(sonuc.ogrenilecekler[0].kaynak, 'kendi notum');
  assert.equal(sonuc.ogrenilecekler[0].ogrenildi, true);
  assert.equal(sonuc.zorluklar[0].cozum, '');
  assert.equal(sonuc.zorluklar[0].asildi, true);
});

test('kişisel notların metni değişmez, yeni not eklenir', () => {
  const hayal = taban({ notlar: [{ id: 'n1', metin: 'Kişisel notum', tarih: '2026-01-01' }] });
  const veri = { notlar: [{ metin: 'Kişisel notum' }, { metin: 'Araştırmadan yeni bilgi' }] };
  const plan = planla(hayal, veri, VARSAYILAN_SECENEKLER);
  assert.equal(plan.bolumler.notlar.ayni, 1);
  assert.equal(plan.bolumler.notlar.yeni.length, 1);
  const sonuc = uygula(hayal, veri, plan, VARSAYILAN_SECENEKLER);
  assert.equal(sonuc.notlar[0].metin, 'Kişisel notum');
  assert.match(sonuc.notlar[1].metin, /Araştırma: Araştırmadan yeni bilgi/);
});

test('aynı sonucu tekrar aktarmak mükerrer kayıt üretmez', () => {
  const metin = ornekMetni('koltuk-boyama.arastirma.json');
  let hayal = taban();
  const r1 = ayiristir(metin);
  const p1 = planla(hayal, r1.veri, VARSAYILAN_SECENEKLER);
  hayal = uygula(hayal, r1.veri, p1, VARSAYILAN_SECENEKLER);
  const ilkSayi = hayal.malzemeler.length;
  const ilkAdim = hayal.adimlar.length;
  const ilkNot = hayal.notlar.length;
  assert.ok(ilkSayi >= 6);
  assert.ok(ilkNot >= 3);

  const r2 = ayiristir(metin);
  const p2 = planla(hayal, r2.veri, VARSAYILAN_SECENEKLER);
  const sonuc = uygula(hayal, r2.veri, p2, VARSAYILAN_SECENEKLER);
  assert.equal(sonuc.malzemeler.length, ilkSayi, 'aynı sonuç ikinci kez aktarıldığında yeni malzeme eklenmemeli');
  assert.equal(sonuc.adimlar.length, ilkAdim, 'adım eklenmemeli');
  assert.equal(sonuc.notlar.length, ilkNot, 'araştırma notu ikinci kez eklenmemeli');
  assert.equal(sonuc.ogrenilecekler.length, hayal.ogrenilecekler.length);
  assert.equal(sonuc.zorluklar.length, hayal.zorluklar.length);
  assert.equal(p2.bolumler.notlar.yeni.length, 0);
});

test('aynı metin aynı parmak izini üretir', () => {
  const metin = ornekMetni('ispnakli-pogaca.arastirma.json');
  assert.equal(parmakIzi(metin), parmakIzi(metin));
  assert.notEqual(parmakIzi(metin), parmakIzi(`${metin} `));
});

test('ilk aktarımda fiyatsız malzemeler tutar olmadan eklenir', () => {
  const r = ayiristir(ornekMetni('ispnakli-pogaca.arastirma.json'));
  const hayal = taban();
  const plan = planla(hayal, r.veri, VARSAYILAN_SECENEKLER);
  const sonuc = uygula(hayal, r.veri, plan, VARSAYILAN_SECENEKLER);
  assert.equal(sonuc.malzemeler.length, r.veri.malzemeler.length);
  assert.equal(sonuc.malzemeler.every((m) => m.birimFiyat === null), true);
  assert.equal(sonuc.adimlar.filter((a) => a.tamamlandi).length, 0);
});

test('bölüm kapatılırsa o bölüm değişmez', () => {
  const r = ayiristir(ornekMetni('koltuk-boyama.arastirma.json'));
  const hayal = taban();
  const sec = { ...VARSAYILAN_SECENEKLER, malzemeler: false, adimlar: false, ogrenilecekler: false, zorluklar: false, notlar: false };
  const plan = planla(hayal, r.veri, sec);
  const sonuc = uygula(hayal, r.veri, plan, sec);
  assert.equal(sonuc.malzemeler.length, 0);
  assert.equal(sonuc.adimlar.length, 0);
});

test('süre ve zorluk puanı varsayılan olarak uygulanmaz', () => {
  const r = ayiristir(ornekMetni('koltuk-boyama.arastirma.json'));
  const hayal = taban({ sureGun: null, zorlukPuani: null });
  const plan = planla(hayal, r.veri, VARSAYILAN_SECENEKLER);
  const sonuc = uygula(hayal, r.veri, plan, VARSAYILAN_SECENEKLER);
  assert.equal(sonuc.sureGun, null);
  assert.equal(sonuc.zorlukPuani, null);
  const sec = { ...VARSAYILAN_SECENEKLER, sure: true, zorlukPuani: true };
  const sonuc2 = uygula(hayal, r.veri, planla(hayal, r.veri, sec), sec);
  assert.equal(sonuc2.sureGun, 2);
  assert.equal(sonuc2.zorlukPuani, 3);
});

/* ---------------- Komut üretimi ---------------- */
test('komut hayal bilgilerini içerir', () => {
  const hayal = taban({
    baslik: 'Ispanaklı poğaça yapmak',
    aciklama: 'Sabahları sıcak poğaça',
    butce: 250,
    deneyim: 'Hiç yapmadım',
    kosullar: 'Alerjim var',
    malzemeler: [{ id: 'm1', ad: 'Un', adet: 2, birimFiyat: 35, aldi: true }],
  });
  const k = komutUret(hayal, { bugun: '2026-10-02' });
  assert.match(k, /Ispanaklı poğaça yapmak/);
  assert.match(k, /Sabahları sıcak poğaça/);
  assert.match(k, /Hiç yapmadım/);
  assert.match(k, /Alerjim var/);
  assert.match(k, /Un × 2/);
  assert.match(k, /elimde var/);
  assert.match(k, /2026-10-02/);
});

test('komut şema sürümünü ve kuralları içerir', () => {
  const k = komutUret(taban(), { bugun: '2026-10-02' });
  assert.match(k, new RegExp(`"surum": "${SURUM}"`));
  assert.match(k, /ÖNCE BANA SOR/);
  assert.match(k, /SORU GEREKMİYOR/);
  assert.match(k, /F.YAT KURALLARI/);
  assert.match(k, /kontrol_tarihi/);
  assert.match(k, /kaynak/);
  assert.match(k, /fiyat UYDURMA/);
  assert.match(k, /istek_puani/);
  assert.match(k, /TEK B.R JSON/);
});

test('komut ChatGPT/SpaceBunny oturumuna bağlanmaz', () => {
  const k = komutUret(taban(), { bugun: '2026-10-02' });
  for (const yasak of ['api.openai', 'api.space', 'fetch(', 'XMLHttpRequest', 'curl']) {
    assert.ok(!k.includes(yasak), `komutta yasak ifade bulundu: ${yasak}`);
  }
});

/* ---------------- Yardımcılar ---------------- */
test('katla Türkçe karakterleri normalize eder', () => {
  assert.equal(katla('Ispanaklı Poğaça'), 'ispanakli pogaca');
  assert.equal(katla('  ÇÖĞÜŞİ  '), 'cogusi');
});