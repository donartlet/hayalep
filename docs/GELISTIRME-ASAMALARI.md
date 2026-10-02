# 6) Geliştirme Aşamaları ve Durum

Kural: **Her aşamada gerçekten çalışan kod yazılır.** Aşama "bitti" demeden test edilmez.
Durum: `[ ]` başlanmadı · `[~]` sürüyor · `[x]` bitti ve test edildi

---

## A0 — Planlama `[x]`
- [x] Ekran planı, veri yapısı, teknoloji seçimi, aşamalar

## A1 — PWA iskeleti `[x]`
- [x] `index.html`, `manifest.webmanifest`, `sw.js`
- [x] Kod ile üretilmiş ikonlar (180 / 192 / 512 / maskable)
- [x] Tema (açık + koyu), alt menü, hash yönlendirici
- [x] Çevrimdışı önbellek (service worker: 24 dosya)
- **Doğrulama:** tarayıcıda SW `activated`, önbellekte 24 dosya. ⚠️ Uçak modu testi **iPhone'da yapılacak** (ortam kısıtı, aşağıda).

## A2 — Veri katmanı ve kalıcılık `[x]`
- [x] IndexedDB sarmalayıcı + localStorage yedeği
- [x] Şema + temizleme (`kayitlariTemiZle`) + 3 demo hayal + 3 demo sözlük
- [x] Kayıt ekleme / düzenleme (otomatik kayıt) / çöpe taşıma / çöpten geri alma
- [x] Yedek: dosya indir, panoya kopyala, dosyadan geri yükle, metinden geri yükle
- **Doğrulama:** kayıt oluşturuldu → sayfa yeniden açıldı → kayıt durdu. Yedek alındı → geri yüklendi → kayıtlar döndü.

## A3 — Liste, arama, filtre, sıralama `[x]`
- [x] Arama (başlık, açıklama, kategori + tüm alt bölümlerde arama)
- [x] Durum filtresi + kategori filtresi
- [x] 10 sıralama seçeneği; özet şeridi
- [x] Puanlama formülü + Ayarlar'dan ağırlık değiştirme
- **Doğrulama:** 19 birim testi geçti (toplam maliyet, maliyet/bütçe puanı, zorluk, önerilen puan, tüm sıralamalar).

## A4 — Detay sayfası ve alt bölümler `[x]`
- [x] Özet / Malzeme & Maliyet / Yapım adımları / Öğrenilecekler / Zorluklar / Notlar sekmeleri
- [x] Her bölüm için ekleme / düzenleme / silme (panel formu) + geri al
- [x] Toplam maliyet, bütçeden kalan, harcanan tutar, adım ilerlemesi

## A5 — Kişisel sözlük `[x]`
- [x] Liste, arama, sıralama, favori, detay paneli, ekle/düzenle/sil + geri al

## A6 — Ayarlar ve güvenlik `[x]`
- [x] Tema (otomatik/açık/koyu)
- [x] Sıralama ağırlıkları paneli
- [x] Yedekleme / geri yükleme (3 yöntem)
- [x] Çöp kutusu, demo kayıtları (sil / geri ekle), tümünü sil (çift onay)
- [x] iPhone kurulum ipuçları
- [ ] Tema tercihinin cihazlar arası senkronu — **yok** (sunucu gerektirir, kapsam dışı)

## A7 — SpaceBunny araştırma asistanı `[x]`
- [x] Tek kaynaklı JSON şeması + sürüm 1.0 (`docs/ARASTIRMA-VERI-SEMASI.md`, `js/arastirma/sema.js`)
- [x] Komut üretici: açıklama + bütçe + mevcut malzemeler + **deneyim** + **koşullar** + 9 kurallı görev
- [x] "Önce bana sor, sonra planla" ve "fiyat uydurma" kuralları komutun içinde
- [x] İçe aktarıcı: kod bloğu/ham JSON, sürüm kontrolü, anlaşılır hatalar, önizleme, bölüm bazlı onay
- [x] Koruma: istek puanı, tamamlanmış adımlar, öğrenilmiş/aşılmış kayıtlar, kişisel notlar
- [x] Mükerrer aktarım koruması (eşleşme + parmak izi)
- [x] Örnek veri setleri (koltuk boyama, ıspanaklı poğaça) + "bu örnektir" işaretlemesi
- [x] 46 otomatik test (`tools/testler/arastirma.test.mjs`)
- **Doğrulama:** İki örnek set uçtan uca aktarıldı (koltuk: 5→10 malzeme, 6→11 adım;
  poğaça: 5→10 malzeme, 6→11 adım). İstek puanı 9 ve 7 **değişmedi**. Aynı set tekrar
  yüklendiğinde 0 yeni kayıt. Bozuk JSON, uyumsuz sürüm ve boş alan hataları anlaşılır
  mesajla reddedildi ve onay düğmesi gizlendi.

## A8 — Otomatik test ve kalite `[x]`
- [x] `tools/kontrol.mjs` — söz dizimi + import + birim testi + PWA dosya kontrolü (tek komut)
- [x] `tools/duman-testi.html` — 10 ekranı açar, 9 paneli açar/kapatır, yatay taşma ve konsol hatası arar
- [x] `tools/telefon-testi.html` — 6 ekranı 390 px'te yan yana gösterir (görsel kontrol)
- [x] `tools/eksik-import.mjs`, `tools/ikon-uret.mjs`, `tools/sunucu.mjs`

## A9 — iPhone'da kurulum ve cihaz testi `[ ]`  ← **senin tarafında**
- [ ] Ücretsiz barındırmaya yüklenmesi (GitHub Pages önerilir)
- [ ] Safari'de "Ana Ekrana Ekle"
- [ ] Uçak modunda açılış testi
- [ ] Yedek al → verileri sil → geri yükle testi

## A10 — Fikir notları (bağımsız ekran) `[ ]`
Detay sayfasındaki Notlar sekmesi çalışıyor; **ayrı "Fikir Notları" ekranı** (hızlı yakalama,
notu işe dönüştürme) henüz yazılmadı. İstersen sıradaki aşamaya alınır.

---

## Serbest bırakılan
- İşlere birden fazla fotoğraf · takvim görünümü · hatırlatıcı bildirimleri (iOS kısıtlı)
- Şablonlar (tekrarlayan işler için) · pano/board görünümü · iki cihaz arası senkron

## Çalışma ortamı sınırları (açıkça belirtiliyor)
- ✅ Node v24 var → test sunucusu, ikon üretimi, otomatik testler yapıldı.
- ❌ **`npm` yok** → paket/derleme yok. Proje bilinçli olarak sıfır bağımlılıklı tasarlandı.
- ❌ **Uçak modu testi burada yapılamadı:** test tarayıcısı istekleri bir vekil üzerinden geçiriyor,
  sunucu kapatıldığında uygulama dosyaları için 502 dönüyor, service worker devreye girmiyor.
  Bunun yerine SW'nin `activated` olduğu ve önbellekte 24/24 dosya bulunduğu doğrulandı.
  Gerçek çevrimdışı test **iPhone'da** yapılacak.
- ❌ Gerçek iPhone/Safari testi, App Store işlemi yapılamaz (gerekmiyor).