# 1) Kesin Gereksinimler (Kapsam Sözleşmesi)

> Bu dosya projenin **anayasasıdır**. Sonraki aşamalarda bu maddeler silinmez, gevşetilmez.

## K1. Kimlik ve dil
- Uygulama **yalnızca kendi iPhone'unda**, tek kişilik kullanılacak.
- Arayüz dili tamamen **Türkçe**. Para birimi **TL (₺)**.

## K2. İşlevler
1. **Hayal kaydı:** başlık, açıklama, kategori.
2. **İsteğe bağlı fotoğraf** (telefondan seçilir, cihazda saklanır).
3. **İstek puanı 1–10 — yalnızca kullanıcı belirler.** (Otomatik puan verilmez.)
4. **Bütçe** (ayırabileceğin üst sınır, TL) ve **isteğe bağlı hedef tarih**.
5. **Durum:** Fikir · Araştırılıyor · Planlandı · Yapılıyor · Tamamlandı · Ertelendi.
6. **Oluşturma ve güncelleme tarihi** otomatik tutulur.
7. **Detayda ayrı sekmeler:** Özet · Malzemeler ve maliyet · Yapım adımları · Öğrenilecekler ·
   Zorluklar · Notlar. (Zorluk sekmesi ilk planda yoktu; ilk turdaki "zorluğa göre sıralama"
   gereksinimi için eklendi.)
8. **Sıralama:** istek, maliyet, zorluk, bütçe, hedef tarih ve "önerilen" sıralaması.
9. **Kişisel sözlük:** terim, anlam, örnek, benim notum, favori.
10. **Yedekleme / geri yükleme** (dosya + pano metni).
11. Arama, filtre, etiket, silme + geri alma.
12. **Deneyim** ve **benim eklediğim koşullar** alanları (araştırma komutunun parçası).
13. **Araştırma asistanı (SpaceBunny)** — her hayalde iki düğme:
    "Araştırma komutunu kopyala" ve "Araştırma sonucunu içe aktar".
    Komut: hayal açıklaması + bütçe + mevcut malzemeler + deneyim + koşullar.
    Sonuç: sürümlü tek JSON; uygulama onaylayınca doğru bölümlere yerleştirir.

## K3. Kesin sınırlar (asla ihlal edilmez)
- ❌ Ücretli API, ücretli üyelik, zorunlu ücretli hizmet **yok**.
- ❌ ChatGPT'ye otomatik giriş, sohbet kazıma, tarayıcı otomasyonu **yok**.
- ❌ Kullanım limitlerini aşmaya yönelik bir şey **yok**.
- ❌ Kişisel veriyi **sunucuya yükleme yok**. Veri sadece cihazda kalır.
- ✅ Tek zorunlu ağ işlemi: **ilk yükleme** (uygulama dosyaları).

## K4. Teknik sınırlar
- **PWA**, iPhone **Safari** ile açılıp **"Ana Ekrana Ekle"** ile kurulur.
- App Store / ücretli geliştirici hesabı gerekmez.
- İlk yükleden sonra: **kayıt ekle, listele, görüntüle, düzenle, sırala** tamamen **internetsiz** çalışır.
- Veri **cihazda** saklanır (IndexedDB; açılamazsa localStorage yedeği).
- Barındırma yalnızca **ücretsiz** statik barındırma olabilir.

## K5. Veri kaybına karşı
- Yanlışlıkla silme mümkün değil: çöp kutusu + geri al bildirimi.
- Tehlikeli işlemler (geri yükleme, tümünü sil) onay ister; tümünü sil **iki kez** onay ister.
- Form verisi otomatik kaydedilir.

---

## Kabul Kriterleri — güncel durum

| # | Kriter | Durum |
|---|--------|-------|
| A1 | Safari'de açılıyor, "Ana Ekrana Ekle" çalışıyor, tam ekran açılıyor | ⏳ iPhone'da test edilecek |
| A2 | Uçak modunda uygulama açılıyor ve kayıtlar görünüyor | ⏳ iPhone'da test edilecek |
| A3 | Yeni hayal ekleniyor: tüm alanlar ve alt bölümler kaydediliyor | ✅ |
| A4 | Hayal düzenleniyor ve değişiklikler kalıcı | ✅ |
| A5 | İstek puanı giriliyor ve listede sıralama değişiyor | ✅ |
| A6 | Maliyet kalemleri otomatik toplam veriyor | ✅ |
| A7 | Adımlar sıralı, tamamlandı işaretlenebiliyor | ✅ |
| A8 | Sözlük: kayıt ekle/düzenle/sil, favori, arama | ✅ |
| A9 | Fikir notu ekleniyor | ⚠️ detay içinde ✅ / bağımsız ekran ⏳ |
| A10 | Araştırma komutu kopyalanabiliyor | ✅ |
| A11 | Sürümlü JSON sonucu önizleme ile içe aktarılıyor | ✅ |
| A12 | Yedek dosyası alınabiliyor, geri yüklenebiliyor | ✅ |
| A13 | Uygulama dışına hiçbir veri gönderilmiyor | ✅ (ağ kodu yalnızca service worker + ilk yükleme) |
| A14 | Veriler iPhone'da kalıcı | ⏳ iPhone'da test edilecek |
| A15 | Demo kayıtlar gerçek kayıtlardan ayrı ve kolay silinebilir | ✅ |
| A16 | Yanlışlıkla veri kaybı engellenir | ✅ (çöp kutusu + geri al + çift onay) |
| A17 | Araştırma sonucu **istek puanını, tamamlanmış adımları ve kişisel notları değiştirmez** | ✅ |
| A18 | Aynı sonuç tekrar aktarılınca mükerrer kayıt oluşmaz | ✅ |
| A19 | Yapıştırılan içerik çalıştırılabilir kod olarak değerlendirilmez | ✅ (`eval` yok, sadece `JSON.parse`) |
| A20 | Fiyat araştırılmamışsa tutar uydurulmaz, "bilinmiyor" işaretlenir | ✅ |
| A21 | Ücretli API/üyelik kullanılmaz; SpaceBunny'ye otomatik bağlanma/kazıma yapılmaz | ✅ |