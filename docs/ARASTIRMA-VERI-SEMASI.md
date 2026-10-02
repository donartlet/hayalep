# Araştırma Sonucu JSON Şeması — Sürüm 1.0

Bu şema **tek kaynaktan** tanımlanır: `js/arastirma/sema.js` (`JSON_SEMA_METNI`).
Hem "Araştırma komutunu kopyala" düğmesi komutu bu şemayı gömerek üretir,
hem de "Sonucu içe aktar" aynı şemayı okur. **Kopya şema yoktur; iki taraf aynı dosyadan beslenir.**

---

## 1) Sürümleme
| Alan | Değer | Kural |
|---|---|---|
| `hayal_atolyesi.surum` | `"1.0"` | Zorunlu. Uygulama **ana sürüm numarasını** karşılaştırır. |
| `hayal_atolyesi.tur` | `"arastirma_sonucu"` | Bilgi amaçlı; şema sürümü belirleyicidir. |

**Uyumluluk kuralı:** Uygulama `1.x` sürümünü okur.
- Sonuç `1.y` → kabul edilir.
- Sonuç `2.x` veya daha yeni → **hata**: "Bu sürümü okuyamıyorum, yeni sürümle yeniden iste."
- Sonuç sürümsüz veya eksik → **hata**: sürüm alanının nasıl yazılacağı hatırlatılır.

---

## 2) Alanlar

### `meta` — sonucun kimliği
| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `model` | metin | hayır | `SpaceBunny` |
| `tarih` | `YYYY-AA-GG` | hayır | Yanıt tarihi |
| `fiyat_arastirildi` | true/false | hayır | Fiyat için güncel kaynak araştırıldı mı |
| `para_birimi` | `TRY`/`USD`/… | hayır | **TL önerilir**; farklıysa uygulama uyarır |
| `not` | metin | hayır | Serbest açıklama |

### `ozet`
`baslik` (metin), `aciklama` (2–3 cümle). **Varsayılan olarak uygulanmaz** — önizlemede onay kutusu.

### `eksik_bilgiler` — "önce bana sor" aşaması
```json
[ { "soru": "…", "neden_onemli": "…", "ornek_yanit": "…" } ]
```
Uygulama bu listeyi **önizlemede ayrı kutuda gösterir**; kayda otomatik yazılmaz (sadece ekranda okunur).

### `malzemeler`
| Alan | Tip | Zorunlu | Kural |
|---|---|---|---|
| `ad` | metin | **evet** | Boşsa içe aktarma hatası verilir |
| `adet` | sayı | hayır | Ondalık olabilir (0.5 kg); verilmezse 1 kabul edilir ve uyarılır |
| `birim` | `adet`/`kg`/`L`/`paket`/… | hayır | Listede yoksa `adet` |
| `birim_fiyat` | sayı \| null | hayır | **null ise fiyat bilinmiyor demektir** |
| `tutar` | sayı | hayır | `adet × birim_fiyat`'tan hesaplanır; gönderilmesi tutarsızsa hesaplanan kullanılır |
| `para_birimi` | metin | hayır | Kalem bazında |
| `fiyat_durumu` | `gercek` \| `tahmin` \| `bilinmiyor` | hayır | Bkz. aşağıdaki fiyat kuralları |
| `kaynak` | `https://…` | `gercek` ise zorunlu | Kaynak bağlantısı yoksa `gercek` → `tahmin`e çevrilir ve uyarılır |
| `kontrol_tarihi` | `YYYY-AA-GG` | `gercek` ise zorunlu | Fiyatın kontrol edildiği gün |
| `not` | metin | hayır | Serbest |

### `adimlar`
`{ "sira": 1, "baslik": "…", "aciklama": "…", "sure_dakika": 30 }`
**DİKKAT:** Burada `tamamlandi` alanı **yoktur ve olmamalıdır.** Kullanıcının tamamladığı adımlara dokunulmaz.

### `ogrenilecekler`
`{ "konu": "…", "seviye": "baslangic|orta|ileri", "kaynak": "…", "gerekce": "…" }`
`ogrenildi` alanı kullanıcıya aittir; sonuçtan gelmez.

### `zorluklar`
`{ "sorun": "…", "seviye": "kolay|orta|zor", "cozum": "…", "gerekce": "…" }`
`asildi` alanı kullanıcıya aittir; sonuçtan gelmez.

### `notlar`
`[ { "metin": "…" } ]` → Uygulamaya **"Araştırma: "** ön ekiyle eklenir; mevcut notlara dokunulmaz.

### `sure`
`{ "deger": 2, "birim": "saat|gun|hafta|ay" }` → gün cinsine çevrilir.

### `zorluk_puani`
`{ "puan": 1..5, "gerekce": "…" }` → Gerekçesiyle birlikte önizlemede gösterilir, varsayılan olarak uygulanmaz.

### `butce_oneri`
Sayı → önizlemede gösterilir, varsayılan olarak uygulanmaz.

### 🚫 Sonuçta **olmayan** alanlar
`istek_puani`, `id`, `olusturma`, `guncelleme`, `tamamlandi`, `ogrenildi`, `asildi`, `silindi`, `demo`.
Bunlar kullanıcının alanlarıdır. Gelen JSON'da varsa **yok sayılır ve uyarı gösterilir.**

---

## 3) Fiyat kuralları (uyulmazsa veri güvenilmez olur)
| Durum | Zorunlu davranış |
|---|---|
| Güncel fiyat araştırıldıysa | `fiyat_durumu: "gercek"` + `kaynak` + `kontrol_tarihi` + `para_birimi` |
| Araştırılamadıysa | **Fiyat uydurma.** `birim_fiyat: null`, `fiyat_durumu: "bilinmiyor"` |
| Yalnızca sezgi/tahmin varsa | `fiyat_durumu: "tahmin"` + `not: "tahmindir, doğrulanmadı"` |

Uygulama tarafındaki karşılıklar:
- `bilinmiyor` → tutar hesaplanmaz, toplamda "Fiyatı bilinmeyen: N" olarak gösterilir.
- `gercek` ama `kaynak` yoksa → `tahmin`e çevrilir, uyarı verilir.
- `tutar` ile `adet×fiyat` uyuşmuyorsa → hesaplanan kullanılır, uyarı verilir.
- Para birimi TRY değilse → kayda para birimiyle yazılır, uyarı verilir.

---

## 4) Birleştirme kuralları (veri kaybı olmaz)
| Durum | Davranış |
|---|---|
| Aynı kayıt zaten varsa | Üzerine yazılmaz; yalnızca **boş** alanlar doldurulur |
| **İstek puanı** | **Hiçbir zaman değiştirilmez** (şemada yok, import sırasında da yok sayılır) |
| **Tamamlanmış adım** | Metni, sırası ve tik'i korunur; gerekçesiyle birlikte "dokunulmayacak" listesinde gösterilir |
| **Öğrenilmiş konu** | Aynı şekilde korunur |
| **Aşılmış zorluk** | Aynı şekilde korunur |
| **Kişisel notlar** | Metinleri değişmez; yalnızca yeni not eklenebilir |
| Yeni kayıt | Eklenir (`id` uygulama tarafından üretilir) |
| Aynı sonucu tekrar yapıştırma | Eşleşme kuralları sayesinde **mükerrer kayıt oluşmaz**; ayrıca sonucun parmak izi saklanır ve "daha önce aktarıldı" uyarısı çıkar |
| Bölüm bazlı seçim | Her bölümün onay kutusu ayrıdır; istediğini kapatabilirsin |

---

## 5) Güvenlik
- Yapıştırılan içerik **yalnızca `JSON.parse` ile** okunur. `eval`, `new Function`, `setTimeout(string)` gibi çalıştırma yolları **yoktur**.
- Metin içindeki kontrol karakterleri ve sıfır genişlikli karakterler temizlenir; uzun metinler kırpılır.
- `__proto__`, `constructor`, `prototype` anahtarları atılır.
- İçerik arayüze yalnızca `textContent` ile basılır — HTML olarak yorumlanmaz.
  (Bu nedenle yapıştırılan metindeki `<script>…` bir etiket metni olarak görünür, çalışmaz.)
- Yalnızca `https://…` biçimindeki bağlantılar kaynak olarak kabul edilir.
- Uygulama SpaceBunny'ye **bağlanmaz**, otomatik giriş yapmaz, sohbet okumaz.

## 6) Örnek veriler
`docs/ornek-veriler/` klasöründe iki dosya vardır. İkisi de **örnektir; fiyatları gerçek güncel fiyat değildir**
ve `meta.not` alanında bu açıkça yazılıdır:
- `koltuk-boyama.arastirma.json`
- `ispnakli-pogaca.arastirma.json`

Uygulamadaki "2 · Sonucu içe aktar" ekranından tek dokunuşla yüklenebilirler.