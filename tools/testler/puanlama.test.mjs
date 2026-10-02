// Saf hesaplama testleri (tarayıcı gerekmez).
// Çalıştırma:  node --test tools/testler
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toplamMaliyet, harcananMaliyet, maliyetPuani, zorlukPuani, zorlukPuaniOtomatik,
  hizPuani, onerilenPuan, ilerleme, sirala, karsilastir,
} from '../../js/veri/puanlama.js';
import { VARSAYILAN_AYARLAR, bosHayal } from '../../js/veri/sema.js';
import { yedekDogrula } from '../../js/veri/yedek.js';

const hayal = (ek = {}) => ({ ...bosHayal(), ...ek });

test('toplam maliyet kalemleri toplar', () => {
  assert.equal(toplamMaliyet(hayal({ malzemeler: [] })), 0);
  assert.equal(toplamMaliyet(hayal({ malzemeler: [
    { ad: 'Boya', adet: 2, birimFiyat: 420 },
    { ad: 'Zımpara', adet: 3, birimFiyat: 45 },
  ] })), 975);
});

test('harcanan maliyet yalnızca alınanları toplar', () => {
  assert.equal(harcananMaliyet(hayal({ malzemeler: [
    { ad: 'Boya', adet: 2, birimFiyat: 420, aldi: true },
    { ad: 'Fırça', adet: 1, birimFiyat: 260, aldi: false },
  ] })), 840);
});

test('maliyet puanı bütçe varsa orana göre hesaplanır', () => {
  const ayar = VARSAYILAN_AYARLAR;
  // 3000 bütçe, 200 TL harcama -> çok kolay (1)
  assert.equal(maliyetPuani(hayal({ butce: 3000, malzemeler: [{ adet: 1, birimFiyat: 200 }] }), ayar), 1);
  // 3000 bütçe, 2000 TL -> oran 0.66 -> 4
  assert.equal(maliyetPuani(hayal({ butce: 3000, malzemeler: [{ adet: 1, birimFiyat: 2000 }] }), ayar), 4);
  // 3000 bütçe, 2900 TL -> oran 0.96 -> 5
  assert.equal(maliyetPuani(hayal({ butce: 3000, malzemeler: [{ adet: 1, birimFiyat: 2900 }] }), ayar), 5);
});

test('bütçe yoksa mutlak TL eşikleri kullanılır', () => {
  assert.equal(maliyetPuani(hayal({ malzemeler: [{ adet: 1, birimFiyat: 300 }] })), 1);
  assert.equal(maliyetPuani(hayal({ malzemeler: [{ adet: 1, birimFiyat: 1000 }] })), 2);
  assert.equal(maliyetPuani(hayal({ malzemeler: [{ adet: 1, birimFiyat: 30000 }] })), 5);
});

test('malzeme yoksa maliyet puanı bilinmiyor (0)', () => {
  assert.equal(maliyetPuani(hayal()), 0);
});

test('zorluk puanı boşsa zorluklar bölümünden otomatik gelir', () => {
  const h = hayal({ zorluklar: [{ seviye: 'kolay' }, { seviye: 'orta' }, { seviye: 'orta' }] });
  assert.equal(zorlukPuaniOtomatik(h), 7 / 3);
  assert.equal(zorlukPuani(h), 7 / 3);
});

test('elle girilen zorluk puanı otomatik hesabı ezer', () => {
  const h = hayal({ zorlukPuani: 5, zorluklar: [{ seviye: 'kolay' }] });
  assert.equal(zorlukPuani(h), 5);
});

test('hız puanı süre kısaldıkça artar', () => {
  assert.ok(hizPuani(hayal({ sureGun: 0.2 })) > hizPuani(hayal({ sureGun: 30 })));
  assert.equal(hizPuani(hayal({})), 0);
});

test('önerilen puan yalnızca istek puanı varsa ondan gelir', () => {
  assert.equal(onerilenPuan(hayal({ istekPuani: 10 })), 100);
  assert.equal(onerilenPuan(hayal({ istekPuani: 1 })), 0);
  assert.equal(onerilenPuan(hayal({})), 0);
});

test('daha çok istenen hayal daha yüksek puan alır', () => {
  const az = hayal({ baslik: 'Az', istekPuani: 3, malzemeler: [{ adet: 1, birimFiyat: 500 }] });
  const cok = hayal({ baslik: 'Çok', istekPuani: 9, malzemeler: [{ adet: 1, birimFiyat: 500 }] });
  assert.ok(onerilenPuan(cok) > onerilenPuan(az));
});

test('kolay ve ucuz olan, puanı aynıysa öne geçer', () => {
  const kolay = hayal({ baslik: 'Kolay', istekPuani: 5, zorlukPuani: 1, malzemeler: [{ adet: 1, birimFiyat: 100 }] });
  const zor = hayal({ baslik: 'Zor', istekPuani: 5, zorlukPuani: 5, malzemeler: [{ adet: 1, birimFiyat: 30000 }] });
  assert.ok(onerilenPuan(kolay) > onerilenPuan(zor));
});

test('adım ilerlemesi yüzde olarak hesaplanır', () => {
  assert.equal(ilerleme(hayal({ adimlar: [] })), 0);
  assert.equal(ilerleme(hayal({ adimlar: [{ tamamlandi: true }, { tamamlandi: false }] })), 50);
  assert.equal(ilerleme(hayal({ adimlar: [{ tamamlandi: true }, { tamamlandi: true }] })), 100);
});

test('sıralama: maliyete göre ucuzdan pahalıya', () => {
  const liste = [
    hayal({ baslik: 'Pahalı', malzemeler: [{ adet: 1, birimFiyat: 900 }] }),
    hayal({ baslik: 'Ucuz', malzemeler: [{ adet: 1, birimFiyat: 50 }] }),
  ];
  const s = sirala(liste, { ...VARSAYILAN_AYARLAR, siralama: 'maliyet-asc' });
  assert.deepEqual(s.map((h) => h.baslik), ['Ucuz', 'Pahalı']);
});

test('sıralama: zorluğa göre kolaydan zora', () => {
  const liste = [
    hayal({ baslik: 'Zor', zorlukPuani: 5 }),
    hayal({ baslik: 'Kolay', zorlukPuani: 1 }),
  ];
  const s = sirala(liste, { ...VARSAYILAN_AYARLAR, siralama: 'zorluk-asc' });
  assert.deepEqual(s.map((h) => h.baslik), ['Kolay', 'Zor']);
});

test('sıralama: istek puanına göre yüksekten düşüğe', () => {
  const liste = [hayal({ baslik: 'A', istekPuani: 2 }), hayal({ baslik: 'B', istekPuani: 9 })];
  const s = sirala(liste, { ...VARSAYILAN_AYARLAR, siralama: 'istek-desc' });
  assert.deepEqual(s.map((h) => h.baslik), ['B', 'A']);
});

test('sıralama: başlığa göre Türkçe alfabetik', () => {
  const liste = [hayal({ baslik: 'Zımpara' }), hayal({ baslik: 'Astar' }), hayal({ baslik: 'Boya' })];
  const s = sirala(liste, { ...VARSAYILAN_AYARLAR, siralama: 'baslik' });
  assert.deepEqual(s.map((h) => h.baslik), ['Astar', 'Boya', 'Zımpara']);
});

test('hedef tarihi olmayanlar en sona düşer', () => {
  const liste = [
    hayal({ baslik: 'Tarihsiz' }),
    hayal({ baslik: 'Yaklaşan', hedefTarih: '2026-11-01' }),
  ];
  const s = sirala(liste, { ...VARSAYILAN_AYARLAR, siralama: 'hedef-tarih' });
  assert.deepEqual(s.map((h) => h.baslik), ['Yaklaşan', 'Tarihsiz']);
});

test('karşılaştırıcı eşitlikte 0 döner', () => {
  const a = hayal({ baslik: 'Aynı', istekPuani: 5 });
  assert.equal(karsilastir(a, { ...a }, { ...VARSAYILAN_AYARLAR, siralama: 'istek-desc' }), 0);
});

test('yedek doğrulaması bozuk dosyayı yakalar', () => {
  assert.equal(yedekDogrula({ isler: [] }).gecerli, true);
  assert.equal(yedekDogrula({}).gecerli, false);
  assert.equal(yedekDogrula(null).gecerli, false);
  assert.equal(yedekDogrula({ isler: [], surum: 99 }).gecerli, false);
});