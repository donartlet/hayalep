# 2) Ekran Planı (Uygulanan Hâli)

Alt menü **3 sekme**: `Hayallerim · Sözlüğüm · Ayarlar`

---

## 2.1 Ekran listesi (hepsi çalışıyor)
| # | Ekran | Ne yapar |
|---|-------|----------|
| 1 | **Ana ekran** | Arama, durum filtresi (6 durum + Hepsi), kategori filtresi, 10 sıralama seçeneği, özet şeridi, hayal kartları |
| 2 | **Hayal ekleme / düzenleme** | Başlık, açıklama, kategori, durum, hedef tarih, istek puanı 1–10, bütçe + fotoğraf + zorluk + süre (isteğe bağlı bölüm) |
| 3 | **Hayal detayı** | 6 sekme: Özet · Malzeme & Maliyet · Yapım adımları · Öğrenilecekler · Zorluklar · Notlar |
| 4 | **Sözlüğüm** | Arama, sıralama (favori/A-Z/yeni), terim kartları, favoride ⭐, kayıt ekle/düzenle/sil |
| 5 | **Ayarlar** | Tema, sıralama ağırlıkları, yedekleme (3 yöntem), çöp kutusu, demo kayıtları, iPhone kurulum ipucu, tümünü sil |

---

## 2.2 Ana ekran
```
┌────────────────────────────────┐
│ Hayal Atölyem          [ + Yeni]│
│ 3 hayal                        │
├────────────────────────────────┤
│ [🔍 Hayallerde ara…        ✕]  │
│ (Hepsi)(Fikir)(Araştırılıyor)   │  ← kaydırılabilir durum şeridi
│ (Planlandı)(Yapılıyor)(…)       │
│ [Önerilen sıralama ▾][Tüm kategori ▾]│
├────────────────────────────────┤
│ 3        │ 63.250 ₺            │  ← özet: aktif hayal / toplam bütçe
│ Aktif    │ Toplam bütçe       │
│ 56.821 ₺│ Toplam maliyet      │
│ 3 kayıt · Önerilen sıralama    │
├────────────────────────────────┤
│ Evdeki koltukları boyamak      │
│ [Planlandı][Ev][DEMO]           │
│ İstek ▮▮▮▮▮ 9/10               │
│ Maliyet 1.545 ₺ · Bütçe 3.000 ₺ │  ← fotoğraf varsa sağda küçük görsel
│ · 6 adım · 5 malzeme           │
└────────────────────────────────┘
```

## 2.3 Hayal detayı — sekmeler
Sekmeler yatay kaydırılabilir, üzerlerinde kayıt sayısı yazar.

| Sekme | İçerik | İşlemler |
|---|---|---|
| **Özet** | İstek puanı, maliyet, bütçe, zorluk, durum, önerilen puan kutucukları; açıklama; kategori / hedef tarih / süre / harcanan / oluşturma / güncelleme satırları; adım ilerleme çubuğu | Düzenle, Çöpe taşı |
| **Malzeme & Maliyet** | Toplam maliyet şeridi, bütçeden kalan, kalem kartları (ad, adet × fiyat, tutar, "Aldım" rozeti) | Ekle, Düzenle, Sil (+ geri al) |
| **Yapım adımları** | İlerleme çubuğu, sıralı adımlar | Tek dokunuşla "Tamamlandı", Düzenle, Sil, Ekle (sıra otomatik) |
| **Öğrenilecekler** | Konu + seviye + kaynak + "Öğrendim" | Ekle, Düzenle, Sil |
| **Zorluklar** | Sorun + seviye + çözüm + "Aştım" | Ekle, Düzenle, Sil |
| **Notlar** | Serbest not + tarih | Ekle, Düzenle, Sil |

## 2.4 Sıralama seçenekleri
Önerilen · İstek ↓ · İstek ↑ · Maliyet ↑ · Maliyet ↓ · Zorluk ↑ · Bütçe ↑ · Hedef tarihi · En yeni · Başlık A→Z

## 2.5 Veri kaybını önleme
| Durum | Davranış |
|---|---|
| Malzeme/adım/not silme | Anında silinir + 9 sn **Geri Al** bildirimi |
| Hayal silme | **Çöpe taşınır** (kalıcı silinmez) + 10 sn Geri Al bildirimi + Ayarlar → Çöp kutusu |
| Çöp kutusu | Geri al / kalıcı sil / tümünü boşalt |
| Yedekten geri yükleme | İkinci onay ekranı; "mevcut veriler silinip değiştirilsin" açıkça yazılı |
| Tüm verileri sil | **İki kez onay** |
| Form kaydı | Her tuş vuruşunda otomatik kaydedilir (kaydedilmemiş metin kalmaz) |

## 2.6 Puanlama mantığı (kullanıcıya görünen hâli)
```
Kolaylık = (Zorluk kolaylığı + Maliyet kolaylığı) / 2      (zorluk ve maliyet ters çevrilir)
Önerilen = İstek %55 + Kolaylık %30 + Hız %15              (0–100)
```
- **İstek puanı (1–10)** → yalnızca sen belirlersin. Boşsa sıralamaya katılmaz.
- **Maliyet puanı (1–5)** → maliyetin bütçene göre oranından; bütçe boşsa mutlak TL eşiklerinden.
- **Zorluk puanı (1–5)** → isteğe bağlı; boş bırakırsan Zorluklar sekmesinden otomatik gelir.
- **Hız (1–5)** → isteğe bağlı süre tahmininden.
- Ağırlıklar Ayarlar → Sıralama ağırlıkları'ndan değiştirilir.
- Boş bileşenler hesaba katılmaz, kalan ağırlık normalize edilir (yani eksik bilgi cezalandırmaz).

## 2.7 Dokunmatik ve küçük ekran kuralları
- Tüm düğmeler ≥ 40–46 px yüksekliğinde; listede kart tamamı tek dokunuş alanı.
- Yatay taşma yok: her ekran 390 px'te ölçüldü (duman testi `scrollWidth` kontrolü).
- "Uzun tablo" yerine **kart** düzeni; geniş ekranda da kart kalır (okunabilirlik için).
- Sekmeler, durum şeridi ve kategori listesi yatay kaydırılır.
- `viewport-fit=cover` + `env(safe-area-inset-*)`: çentik ve alt çubuk altında kırpılma olmaz.
- Koyu/açık tema otomatik; Ayarlar'dan sabitlenebilir.