# 5) Araştırma Asistanı (SpaceBunny) — Uygulanan Tasarım

## 5.1 Çalışma prensibi
**Uygulama SpaceBunny'ye bağlanmaz.** Bağlantı yok, otomatik giriş yok, sohbet kazıma yok, tarayıcı
otomasyonu yok, ücretli API yok. Akış tamamen kopyala-yapıştır:
```
[Hayal detayı]                                    [SpaceBunny]
  "🔎 Araştırma komutunu kopyala"
        │  komut üretir → panoya kopyalar
        ▼
   SpaceBunny sohbetine yapıştır (sen)
        │  önce sorular sorar → sen cevaplarsın
        │  sonra TEK JSON verir
        ▼
  "📥 Araştırma sonucunu içe aktar"
        │  yapıştır → doğrula → önizle → onayla
        ▼
  Malzemeler / adımlar / öğrenilecekler / zorluklar / notlar
```

İki düğme: **Araştırma komutunu kopyala** ve **Araştırma sonucunu içe aktar** (ikisi de
Hayal detayı → Özet sekmesinde yan yana).

## 5.2 JSON şeması — TEK KAYNAK
Şema `js/arastirma/sema.js` içinde `JSON_SEMA_METNI` olarak tanımlıdır (sürüm **1.0**).
Komut üretici bu metni komutun içine gömer; içe aktarıcı **aynı** modülü okur.
Ayrıntılı alan dokümantasyonu: **`docs/ARASTIRMA-VERI-SEMASI.md`**.

Ana başlıklar:
```
hayal_atolyesi: { surum: "1.0", tur: "arastirma_sonucu" }
meta, ozet, eksik_bilgiler, malzemeler, adimlar, ogrenilecekler,
zorluklar, notlar, sure, zorluk_puani, butce_oneri
```
Sonuçta **bulunmaması gerekenler:** `istek_puani`, `id`, `tamamlandi`, `ogrenildi`, `asildi`, `silindi`.

## 5.3 Üretilen komutta neler var
Komut (`js/arastirma/komut.js`) dokuz bölümden oluşur:
1. Hayal: başlık, açıklama, kategori, durum, hedef tarih, bütçe
2. **Deneyimim** (hayalin `deneyim` alanından)
3. **Elimdeki malzemeler** (ad × adet × fiyat, "elimde var" işaretleriyle) — "bunları yeniden alma"
4. **Benim koyduğum koşullar** (hayalin `kosullar` alanından)
5. Şu anki notlarım: adımlar, öğrenilecekler, zorluklar, kişisel notlar
6. **ÖNCE BANA SOR:** sonucu büyük ölçüde değiştirecek eksik bilgi varsa en fazla 3 soru
   (neden önemli + örnek seçenek), cevaplanana kadar liste üretme; eksiği yoksa "SORU GEREKMİYOR"
7. **SONRA PLANI HAZIRLA:** malzemeler (miktar + maliyet), yapım adımları (süreli), öğrenilecekler,
   **gerekçeli zorluk puanı**, toplam süre ve bütçe önerisi
8. **FİYAT KURALLARI:** araştırabiliyorsan `kaynak` + `para_birimi` + `kontrol_tarihi` +
   `fiyat_durumu: "gercek"`; **araştıramıyorsan fiyat uydurma** → `birim_fiyat: null`,
   `fiyat_durumu: "bilinmiyor"`; yalnız tahmin varsa `"tahmin"` + `not: "doğrulanmadı"`
9. **ÇIKTI FORMATI:** TEK bir JSON (```json kod bloğu), sürüm 1.0, `istek_puani` yok,
   JSON dışında metin/HTML/komut yok

Komutun kendisi de API adresi, `fetch`, `curl` gibi bir şey içermez (test edilir).

## 5.4 İçe aktarıcı davranışı
| Konu | Davranış |
|---|---|
| Metin çıkarma | Kod bloğu **veya** ham JSON; metnin içindeki ilk `{…}` bloğu bulunur (tırnak içi parantezler sayılmaz) |
| Sürüm | Ana sürüm karşılaştırılır. `1.x` kabul, `2.x` ve eskisi reddedilir (anlaşılır mesajla) |
| Alan hataları | `ad`/`baslik`/`konu`/`sorun`/`metin` boşsa hata; sürümsüz alanlar uyarı |
| Fiyat | `gercek` ama kaynak yoksa `tahmin`e çevrilir; tutar ile `adet×fiyat` uyuşmazsa hesaplanan kullanılır; para birimi TRY değilse uyarılır |
| Önizleme | Kaydetmeden önce: şema sürümü, model, tarih, sorular, maliyet özeti (bilinen / bilinmeyen / tahmini / kaynaklı), bölüm bölüm yeni-güncelle-hazir sayıları, uyarılar, dokunulmayacaklar |
| Onay | Her bölümün ayrı onay kutusu + süre/zorluk/bütçe/özet için ayrı onay kutuları (tekil alanlar **varsayılan kapalı**) |
| Koruma | İstek puanı, tamamlanmış adımlar, öğrenilmiş konular, aşılmış zorluklar, kişisel not metinleri **dokunulmaz** |
| Mükerrer | Aynı kayıt başlığı/adı/konusu/sorunu/metinine göre eşleşir → yeni kayıt eklenmez. Notlarda "Araştırma: " ön eki eşleştirmede yok sayılır. Ayrıca metnin parmak izi saklanır |
| Güvenlik | Yalnızca `JSON.parse`; `eval`/`Function` **yok**. Kontrol karakterleri temizlenir, `__proto__`/`constructor`/`prototype` atılır, yalnızca `https://` bağlantı kabul edilir, ekrana yalnızca `textContent` ile basılır |

## 5.5 Örnek veriler (fiyatlar GERÇEK DEĞİLDİR)
`docs/ornek-veriler/` altında iki dosya; ikisinin `meta.not` alanında "ÖRNEK, gerçek güncel fiyat
değildir" yazılıdır ve `fiyat_arastirildi: false` taşır (hiçbir kalem `gercek` işaretli değildir):
- `koltuk-boyama.arastirma.json`
- `ispnakli-pogaca.arastirma.json`

Uygulamadaki "Sonucu içe aktar" ekranından tek dokunuşla yüklenirler. 46 otomatik test bu iki
dosyayı gerçek cevap gibi ayrıştırır, aktarır ve **mükerrer aktarımın 0 değişiklik ürettiğini**
doğrular.

## 5.6 Gizlilik
Bu özellik yalnızca metin üretir ve metin ayrıştırır. Uygulama içinde SpaceBunny'ye hiçbir ağ
isteği yapılmaz; oturum bilgisi saklanmaz.
