# 3) Veri Yapısı (Cihazda Saklanan Hâli)

Bütün kayıtlar **tarayıcının kendi veritabanında (IndexedDB)** tutulur.
IndexedDB açılamazsa (örn. iOS'ta kota dolması) uygulama kendiliğinden **localStorage yedeğine** düşer.
Sunucuya hiçbir şey gitmez. Yedek dosyası da bu JSON'dur.

---

## 3.1 Depolar (veritabanı tabloları)
| Depo | Anahtar | İçerik |
|---|---|---|
| `isler` | `id` | Hayaller (alt bölümler de içinde) |
| `sozluk` | `id` | Sözlük terimleri |
| `gorseller` | `id` | Sıkıştırılmış fotoğraflar (ayrı tutulur, liste hızlı açılsın diye) |
| `ayarlar` | `anahtar` | Tercihler |
| `meta` | `anahtar` | Demo kuruldu mu, son yedekleme tarihi |

---

## 3.2 `isler` kaydı

```jsonc
{
  "id": "l1ydumcuco",                     // benzersiz kısa kimlik
  "baslik": "Evdeki koltukları boyamak",
  "aciklama": "Oturma odası koltuğu eski, yenilemek istiyorum.",
  "kategori": "Ev",                      // serbest metin (öneriler: Ev, Mutfak, Atölye…)
  "durum": "planlandi",                  // fikir|arastiriliyor|planlandi|yapiliyor|tamamlandi|ertelendi
  "istekPuani": 9,                       // 1–10, YALNIZCA kullanıcı belirler
  "butce": 3000,                         // ayırabileceğin üst sınır (TL)
  "hedefTarih": "2026-11-30",            // isteğe bağlı
  "zorlukPuani": 2,                      // 1–5, isteğe bağlı (boşsa Zorluklar bölümünden gelir)
  "sureGun": 2,                          // isteğe bağlı süre tahmini (gün)
  "deneyim": "Daha önce 2 kez yağlı boya yaptım…",   // araştırma komutuna yazılır
  "kosullar": "Alerjim var, kokusuz ürün şart…",       // araştırma komutuna yazılır
  "fotoId": "g3k9a2",                    // isteğe bağlı fotoğraf (gorseller deposunda)
  "malzemeler": [
    { "id": "m1", "ad": "Boya (1 L)", "adet": 2, "birimFiyat": 420, "not": "", "aldi": true }
  ],
  "adimlar": [
    { "id": "a1", "sira": 1, "baslik": "Koltuğu balkona çıkar", "aciklama": "", "tamamlandi": false }
  ],
  "ogrenilecekler": [
    { "id": "o1", "konu": "Vernik türleri", "seviye": "baslangic", "kaynak": "", "ogrenildi": false }
  ],
  "zorluklar": [
    { "id": "z1", "sorun": "Ahşap ayak çatlak", "seviye": "orta", "cozum": "Macun + zımpara", "asildi": false }
  ],
  "notlar": [
    { "id": "n1", "metin": "Renk: kırık beyaz (mat)", "tarih": "2026-10-02" }
  ],
  "demo": false,                         // demo kayıt mı? (gerçek kayıtlardan ayırmak için)
  "silindi": false,                      // çöpte mi?
  "silinmeZamani": null,
  "olusturma": "2026-10-02T08:00:00.000Z",
  "guncelleme": "2026-10-02T09:12:00.000Z"
}
```

### Alt bölümler ve seçenekleri
| Bölüm | Zorunlu | Değerler |
|---|---|---|
| `malzemeler` | Hayır | ad (zorunlu), adet (ondalık olabilir), birimFiyat (TL), not, aldi |
| `adimlar` | Hayır | sira (otomatik), baslik, aciklama, tamamlandi |
| `ogrenilecekler` | Hayır | konu, seviye: `baslangic`\|`orta`\|`ileri`, kaynak, ogrenildi |
| `zorluklar` | Hayır | sorun, seviye: `kolay`\|`orta`\|`zor`, cozum, asildi |
| `notlar` | Hayır | metin, tarih |

### Araştırmadan gelen ek malzeme alanları
Araştırma ile eklenen malzemelerde ayrıca şu alanlar saklanır (elle eklemede boş kalır):
`birim`, `paraBirimi`, `fiyatDurumu` (`gercek`\|`tahmin`\|`bilinmiyor`), `kaynak`, `kontrolTarihi`.
Arayüzde "fiyat bilinmiyor" / "tahmini" rozeti ve kaynak bağlantısı gösterilir.
`birimFiyat` bilinmiyorsa **null** kalır (0 değil) — toplam doğru hesaplanır, sahte tutar üretilmez.

### Türetilen (kaydedilmez, her açılışta hesaplanır)
| Alan | Nasıl |
|---|---|
| `toplamMaliyet` | `Σ adet × birimFiyat` |
| `harcananMaliyet` | Yalnızca `aldi: true` olanlar |
| `maliyetPuani` (1–5) | **Bütçe girdiysen** maliyet/bütçe oranı: %15→1, %35→2, %60→3, %85→4, üstü→5. Bütçe yoksa mutlak TL eşikleri: 500 / 2.000 / 8.000 / 25.000 |
| `zorlukPuani` | Elle girdiysen o; yoksa Zorluklar bölümünün ortalaması (kolay 1 / orta 3 / zor 5) |
| `hizPuani` | Süre tahminine göre ters çevrilmiş değer (1–5) |
| `onerilenPuan` (0–100) | İstek (1–10→0–100) × %55 + Kolaylık × %30 + Hız × %15. **Boş olan bileşenler hesaba katılmaz**, kalan ağırlık normalize edilir. |
| `ilerlemeYuzdesi` | Tamamlanan adım ÷ toplam adım |

---

## 3.3 `sozluk` kaydı
```jsonc
{
  "id": "s1", "terim": "Vernik", "anlam": "…", "ornek": "…", "benimNotum": "…",
  "favori": true, "demo": false, "olusturma": "2026-10-02T08:00:00.000Z"
}
```

## 3.4 `gorseller` kaydı
```jsonc
{ "id": "g1", "ad": "koltuk.jpg", "boyut": 142000, "veri": "…blob…" }
```
Yüklemeden önce görsel tarayıcıda küçültülür (en fazla 1400 px, JPEG %82) ve cihaza yazılır.

## 3.5 `isler.aiArastirma` — araştırma izi
```jsonc
{
  "sonKomut": "…",            // son üretilen araştırma komutu (panoya kopyalanan metin)
  "sonCevap": "…",            // yapıştırılan son cevabın ilk 4000 karakteri
  "sonAktarilan": "0534f584", // son içe aktarılan metnin parmak izi (mükerrer koruması)
  "sonAktarimTarihi": "2026-10-02T09:30:00.000Z",
  "kaynakModel": "SpaceBunny (ÖRNEK VERİ — gerçek cevap değildir)"
}
```

## 3.6 `ayarlar` kaydı (`anahtar: "genel"`)

```jsonc
{
  "siralama": "onerilen",
  "tema": "otomatik",                    // otomatik | acik | koyu
  "agirliklar": { "istek": 0.55, "kolaylik": 0.30, "hiz": 0.15 },
  "maliyetEslikleri": [500, 2000, 8000, 25000],
  "butceOranlari": [0.15, 0.35, 0.60, 0.85],
  "sureEslikleri": [1, 7, 30, 90]
}
```

---

## 3.7 Yedek Dosyası Formatı
Tek `.json` dosyası. Fotoğraflar `data:` biçiminde gömülüdür (toplam 4 MB sınırı).

```jsonc
{
  "uygulama": "Hayal Atölyem",
  "surum": 1,
  "olusturma": "2026-10-02T09:00:00.000Z",
  "ayarlar": { … },
  "isler": [ … ], "sozluk": [ … ], "gorseller": [ … ]
}
```

**Geri yükleme iki aşamalıdır:** dosyayı/paste'i seç → ikinci ekranda onay (mevcut veriler silinecek).
Geri yüklenen kayıtlar bozuk/eksikse (`null` eleman, eksik dizi) uygulama temizler.

---

## 3.8 Veri bütünlüğü kuralları
- Kayıt okunurken tüm liste alanları boş elemanlardan arındırılır (`kayitlariTemiZle`).
- Kayıt yazılırken de aynı temizlik yapılır — bozuk veri kalıcılaşmaz.
- Silme **kalıcı değildir**: kayıt `silindi: true` olur, Ayarlar → Çöp kutusundan geri alınabilir.
- "Tüm verileri sil" **iki kez onay** ister ve meta kayıtlarını da sıfırlar.

## 3.9 Demo kayıtları
Açılışta veritabanı boşsa 3 hayal + 3 sözlük kaydı eklenir (`meta.demoKuruldu` ile bir kez).
Hepsi `demo: true` taşır, kartlarda **DEMO** rozetiyle görünür ve
**Ayarlar → Demo kayıtları → Sil** ile tek dokunuşla temizlenir (Geri ekle de var).