// Sabitler, boş kayıt şablonları, demo kayıtları.
'use strict';

export const DURUMLAR = [
  { kod: 'fikir', ad: 'Fikir', rozet: '' },
  { kod: 'arastiriliyor', ad: 'Araştırılıyor', rozet: 'rozet--uyari' },
  { kod: 'planlandi', ad: 'Planlandı', rozet: 'rozet--vurgu' },
  { kod: 'yapiliyor', ad: 'Yapılıyor', rozet: 'rozet--ana' },
  { kod: 'tamamlandi', ad: 'Tamamlandı', rozet: 'rozet--basari' },
  { kod: 'ertelendi', ad: 'Ertelendi', rozet: 'rozet--tehlike' },
];

export const KATEGORILER = ['Ev', 'Mutfak', 'Atölye', 'Bahçe', 'Eğitim', 'Sağlık', 'Hobi', 'Seyahat', 'Teknoloji', 'Diğer'];

export const ZORLUK_SEVIYELERI = [
  { kod: 'kolay', ad: 'Kolay', puan: 1 },
  { kod: 'orta', ad: 'Orta', puan: 3 },
  { kod: 'zor', ad: 'Zor', puan: 5 },
];

export const OGRENME_SEVIYELERI = [
  { kod: 'baslangic', ad: 'Başlangıç' },
  { kod: 'orta', ad: 'Orta' },
  { kod: 'ileri', ad: 'İleri' },
];

export const PARA_BIRIMI = '₺';

export function bosHayal() {
  const simdi = new Date().toISOString();
  return {
    id: null, // ekleme sırasında üretilir
    baslik: '',
    aciklama: '',
    kategori: '',
    durum: 'fikir',
    istekPuani: null,      // 1–10, yalnızca kullanıcı belirler
    butce: null,           // TL
    hedefTarih: null,
    zorlukPuani: null,     // 1–5, isteğe bağlı
    sureGun: null,         // isteğe bağlı, gün cinsinden
    deneyim: '',           // bu işi daha önce yaptım mı / ne biliyorum
    kosullar: '',          // bana özel ek koşullar (yer, kısıt, tercih)
    fotoId: null,
    malzemeler: [],
    adimlar: [],
    ogrenilecekler: [],
    zorluklar: [],
    notlar: [],
    aiArastirma: { sonKomut: '', sonCevap: '', sonAktarilan: null, sonAktarimTarihi: null, kaynakModel: '' },
    demo: false,
    silindi: false,
    olusturma: simdi,
    guncelleme: simdi,
  };
}

export function bosSozlukKaydi() {
  return {
    id: null, terim: '', anlam: '', ornek: '', benimNotum: '',
    favori: false, demo: false, olusturma: new Date().toISOString(),
  };
}

export const VARSAYILAN_AYARLAR = {
  siralama: 'onerilen',
  sadeceAktif: false,
  tema: 'otomatik',
  agirliklar: { istek: 0.55, kolaylik: 0.30, hiz: 0.15 },
  maliyetEslikleri: [500, 2000, 8000, 25000],   // bütçe girilmemişse TL
  butceOranlari: [0.15, 0.35, 0.60, 0.85],      // bütçe girilmişse maliyet/bütçe
  sureEslikleri: [1, 7, 30, 90],               // gün cinsinden
};

/* ---------------- Demo kayıtları (kolayca silinebilir) ---------------- */
function adim(sira, baslik, aciklama = '') { return { id: `d${sira}`, sira, baslik, aciklama, tamamlandi: false }; }

export function demoIsleri() {
  const simdi = new Date().toISOString();
  return [
    {
      id: 'demo-koltuk',
      baslik: 'Evdeki koltukları boyamak',
      aciklama: 'Oturma odasındaki iki koltuğu yenilemek. Eski boya kazınacak, astar sürülecek, mat vernik ile bitirilecek.',
      kategori: 'Ev',
      durum: 'planlandi',
      istekPuani: 9,
      butce: 3000,
      hedefTarih: null,
      zorlukPuani: 2,
      sureGun: 2,
      fotoId: null,
      malzemeler: [
        { id: 'm1', ad: 'Silikonlu yağlı boya (mat, 1 L)', adet: 2, birimFiyat: 420, not: 'İki kat sürmek için iki kutu' },
        { id: 'm2', ad: 'Astar (sentetik)', adet: 1, birimFiyat: 190, not: '' },
        { id: 'm3', ad: 'Rulo + fırça seti', adet: 1, birimFiyat: 260, not: '' },
        { id: 'm4', ad: 'Zımpara kâğıdı (80/120/220)', adet: 3, birimFiyat: 45, not: '' },
        { id: 'm5', ad: 'Boya bandı ve naylon örtü', adet: 1, birimFiyat: 120, not: '' },
      ],
      adimlar: [
        adim(1, 'Koltuğu balkona çıkar', 'Zemini naylonla koru, koltuğu düz zemine al.'),
        adim(2, 'Sökülebilir parçaları ayır', 'Kumaş kılıfları çıkar, koltuk ayağını maskele.'),
        adim(3, 'Eski boyayı zımparala', '80 ile kaba, 120 ile düz, 220 ile son.'),
        adim(4, 'Toz al ve astar sür', 'Nemli bezle sil, 2 saat kurumasını bekle.'),
        adim(5, 'Renkli boyayı iki kat sür', 'İlk kat ince, ikinci kat biraz daha kalın.'),
        adim(6, 'Vernik at ve kuruma', '24 saat sonra otur, kılıçları değiştir.'),
      ],
      ogrenilecekler: [
        { id: 'o1', konu: 'Yağlı boya öncesi yüzey hazırlığı', seviye: 'baslangic', kaynak: 'YouTube: yağlı boya uygulama', ogrenildi: false },
        { id: 'o2', konu: 'Vernik türleri (mat, parlak, ipeksi)', seviye: 'baslangic', kaynak: '', ogrenildi: false },
        { id: 'o3', konu: 'Boya rengini kâğıtta test etme', seviye: 'orta', kaynak: '', ogrenildi: false },
      ],
      zorluklar: [
        { id: 'z1', sorun: 'Koltuğun ahşap ayağı çatlak', seviye: 'orta', cozum: 'Ahşap macun ile doldur, sonra zımparala.', asildi: false },
        { id: 'z2', sorun: 'Eski boya çok katlı, kazıması zor', seviye: 'kolay', cozum: 'Önce zımpara, sonra güçlü kimyasal boya sökücü dene.', asildi: true },
      ],
      notlar: [
        { id: 'n1', metin: 'Boya rengi: kırık beyaz (mat). Salonun rengiyle uyumlu.', tarih: simdi },
      ],
      demo: true, silindi: false, olusturma: simdi, guncelleme: simdi,
    },
    {
      id: 'demo-pogaca',
      baslik: 'Ispanaklı poğaça yapmak',
      aciklama: 'Her sabah 15 dakikada sıcak poğaça. Hamuru önceden hazırlayıp buzdolabında bekletmek istiyorum.',
      kategori: 'Mutfak',
      durum: 'fikir',
      istekPuani: 7,
      butce: 250,
      hedefTarih: null,
      zorlukPuani: 2,
      sureGun: 0.2,
      fotoId: null,
      malzemeler: [
        { id: 'm1', ad: 'Un', adet: 2, birimFiyat: 35, not: '2 kg un yeter' },
        { id: 'm2', ad: 'Ispanak (kg)', adet: 1, birimFiyat: 60, not: '' },
        { id: 'm3', ad: 'Beyaz peynir (kg)', adet: 0.5, birimFiyat: 220, not: '' },
        { id: 'm4', ad: 'Yumurta', adet: 4, birimFiyat: 9, not: '' },
        { id: 'm5', ad: 'Süt (ml)', adet: 500, birimFiyat: 32, not: '' },
      ],
      adimlar: [
        adim(1, 'Hamuru yoğur ve buzdolabında dinlendir', 'En az 30 dakika, ideal 1 gece.'),
        adim(2, 'Ispanakları yıkayıp suyunu sık', 'Hamur yapışmasın diye çok önemli.'),
        adim(3, 'Harçayı hazırla', 'Peyniri ufala, yumurta, dereotu, karabiber.'),
        adim(4, 'Hamuru 8 eşit parçaya böl', 'Her birini ince aç.'),
        adim(5, 'Harç koy, kenarlarını topla', 'Ortada ince, kenarlarda kalın olsun.'),
        adim(6, 'Fırında pişir', '200 derece, üstü kızarana kadar yaklaşık 20 dakika.'),
      ],
      ogrenilecekler: [
        { id: 'o1', konu: 'Hamur açma incelikleri', seviye: 'baslangic', kaynak: '', ogrenildi: false },
        { id: 'o2', konu: 'İspanakta suyunu çıkarma', seviye: 'baslangic', kaynak: '', ogrenildi: true },
      ],
      zorluklar: [
        { id: 'z1', sorun: 'Poğaçalar açılıyor', seviye: 'orta', cozum: 'Kenarları parmakla çok sıkı topla, ortaya fazla harç koyma.', asildi: false },
      ],
      notlar: [
        { id: 'n1', metin: 'Tarife: 2 kg un, 500 ml süt, 1 yumurta (hamur için) — denemeye başlarken kullan.', tarih: simdi },
      ],
      demo: true, silindi: false, olusturma: simdi, guncelleme: simdi,
    },
    {
      id: 'demo-atolye',
      baslik: 'Bir atölye kurmak',
      aciklama: 'Bahçedeki boş alana küçük bir marangoz/tezgâh atölyesi kurmak. İlk hedef: kendi rafımı yapmak.',
      kategori: 'Atölye',
      durum: 'arastiriliyor',
      istekPuani: 10,
      butce: 60000,
      hedefTarih: null,
      zorlukPuani: 4,
      sureGun: 45,
      fotoId: null,
      malzemeler: [
        { id: 'm1', ad: 'Masa tezgâhı (200×80)', adet: 1, birimFiyat: 12000, not: 'El işi eleme' },
        { id: 'm2', ad: 'Akülü vida makinesi', adet: 1, birimFiyat: 3800, not: '' },
        { id: 'm3', ad: 'El aletleri seti (torna, penses, testere)', adet: 1, birimFiyat: 4500, not: '' },
        { id: 'm4', ad: 'Koruyucu ekipman (gözlük, maske, kulaklık)', adet: 1, birimFiyat: 1500, not: 'İş güvenliği' },
        { id: 'm5', ad: 'Aydınlatma (LED çalışma lambası)', adet: 1, birimFiyat: 2200, not: '' },
        { id: 'm6', ad: 'Kurulum ve elektrik işçiliği', adet: 1, birimFiyat: 15000, not: 'Usta çağırılacak' },
      ],
      adimlar: [
        adim(1, 'Ölçüleri ve bütçeyi kesinleştir', 'Nereye, kaç m2, toplam kaç para?'),
        adim(2, 'İzin ve ruhsat araştır', 'Belediye, emniyet, yangın güvenliği kuralları.'),
        adim(3, 'Tezgâh ve alet satın al', 'Fatura ve garanti belgelerini sakla.'),
        adim(4, 'Elektrik ve havalandırma', 'Priz miktarı, toz emme.'),
        adim(5, 'Atölye düzenini kur', 'Malzeme rafları, gün ışığı, oturma düzeni.'),
        adim(6, 'İlk proje: kendi rafımı yap', 'Ölçü al, kes, montajla, yağla.'),
      ],
      ogrenilecekler: [
        { id: 'o1', konu: 'Marangozluk temelleri', seviye: 'baslangic', kaynak: '', ogrenildi: false },
        { id: 'o2', konu: 'Deko: güvenlik ve yangın önlemleri', seviye: 'orta', kaynak: '', ogrenildi: false },
        { id: 'o3', konu: 'Tezgâh seçimi ve kalibrasyon', seviye: 'ileri', kaynak: '', ogrenildi: false },
      ],
      zorluklar: [
        { id: 'z1', sorun: 'Bütçe kontrolünü zor tutuyor', seviye: 'zor', cozum: 'Kalem kalem fiyat al, %10 pay ekle, fazlasını ayrı bir iş olarak yaz.', asildi: false },
        { id: 'z2', sorun: 'Toz ve gürültü komşuları rahatsız edebilir', seviye: 'orta', cozum: 'Çalışma saatlerini sınırla, toz emme kullan.', asildi: false },
      ],
      notlar: [
        { id: 'n1', metin: 'Acele yok. Önce izin ve güvenlik, sonra alet.', tarih: simdi },
      ],
      demo: true, silindi: false, olusturma: simdi, guncelleme: simdi,
    },
  ];
}

export function demoSozluk() {
  const simdi = new Date().toISOString();
  return [
    {
      id: 'demo-varnik', terim: 'Vernik', anlam: 'Boya veya yüzeyin üstüne sürülen koruyucu şeffaf tabaka.',
      ornek: 'Sunmuha mat vernik, mobilyada parlak vernik daha çok tercih edilir.',
      benimNotum: 'Mobilyada iki kat sür: ince + kalın. Kalın kat dökülürse zımparala.', favori: true, demo: true, olusturma: simdi,
    },
    {
      id: 'demo-astar', terim: 'Astar (primer)', anlam: 'Boya öncesi yüzeye sürülen dolgu ve yapıştırıcı kat.',
      ornek: 'Gözenekli yüzeyde astar, rengi emmesini engeller.',
      benimNotum: 'Boya markasının astarını kullan, başka marka astar sorun çıkarabiliyor.', favori: false, demo: true, olusturma: simdi,
    },
    {
      id: 'demo-mplam', terim: 'Şap (müpker/parzena)', anlam: 'Eski boya katmanını yumuşatıp kaldırmak için kullanılan kimyasal.',
      ornek: 'Boya sökücü sprey, yüzeye sürülüp 15 dakika bekletilir.',
      benimNotum: 'Kalabalık evde kullanma, keskin kokusu var.', favori: false, demo: true, olusturma: simdi,
    },
  ];
}