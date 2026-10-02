# 4) Kullanılacak Teknolojiler ve Gerekçeleri

## 4.1 Kısa cevap
**Saf HTML + CSS + JavaScript. Paket (npm) yok. Derleme (build) adımı yok. Sunucu kodu yok.**

Yani: klasördeki dosyaları bir yere yükleyince uygulama çalışır. Kurulum komutu, kütüphane
bağımlılığı, güncelleme derlemesi gibi teknik bakım yükü yok.

## 4.2 Seçim tablosu
| Katman | Seçim | Neden |
|---|---|---|
| Yapı | `index.html` + `css/` + `js/` (ES Modules) | Her dosya insan tarafından okunabilir; ileride düzeltmek kolay |
| Arayüz | Kendi yazdığımız küçük yardımcı fonksiyonlar (`el()`) | 200 satırlık mikro-helper; kütüphane indirmeye gerek yok |
| Depolama | **IndexedDB** (kendi yazdığımız ~120 satırlık sarmalayıcı) | Veri cihazda kalır, yüzlerce kayıt+veri için LocalStorage'a göre sağlam |
| Tercihler | `localStorage` (sadece tema, son sıralama gibi küçük şeyler) | Anlık okuma için |
| Yönlendirme | `hash` tabanlı mini yönlendirici (`#/isler`, `#/isler/k3f9a1`) | iOS geri tuşu doğru davranır, kurulum gerektirmez |
| PWA | `manifest.webmanifest` + `sw.js` (Service Worker) | "Ana Ekrana Ekle" ve çevrimdışı çalışma bununla mümkün |
| Kurulum görseli | Üretilmiş PNG ikonlar (kod ile) | iOS ana ekran ikonu PNG ister |
| Test | Node'un yerleşik test koşucusu (`node --test`) | Ek paket gerekmez |
| Sunucu (sadece denemek için) | `tools/sunucu.mjs` (Node, sıfır bağımlılık) | PC'de açıp test etmek için |
| Git | `git` (kod okumayan için gerekmez, ama güvenlik için önerilir) | Yanlışlıkla silme/sıfırlama karşı sigorta |

## 4.3 Reddedilen seçimler ve nedenleri
| Reddedilen | Neden |
|---|---|
| React / Vue / Angular | Derleme ve `npm` gerektirir; ayrıca çalışma ortamında `npm` yok |
| Firebase / Supabase | Sunucu + hesap + çoğu özellik ücretli; ayrıca veri cihaz dışına çıkar |
| ChatGPT API'si | Ücretli + hesap anahtarı + limit; ayrıca kullanıcının sınırı ihlal ederdi |
| LocalStorage | Boyut sınırı düşük; veri miktarı artınca bozulur |
| WebSocket / bulut senkron | Sunucu gerektirir, gereksiz |
| TypeScript | Derleme adımı gerektirir |
| Bileşen kütüphanesi (UI kit) | Görünüm bozulmasına yol açar; mobil için özel, sade tasarım yeterli |

## 4.4 Service Worker (Çevrimdışı Çalışmanın Kalbi)
1. Kurulumda (internet varken) tüm dosyalar bir kez indirilir ve önbelleğe alınır.
2. Sonraki açılışlarda uygulama **dosyaları önbellekten** açar → internet gerekmez.
3. Veri (işler, sözlük, notlar) IndexedDB'de zaten cihazda → zaten cevrimdışı erişilir.
4. Güncelleme: `sw.js` değişince yeni sürüm indirilir, uygulama bir sonraki açılışta yenilenir.
   (Kullanıcıya "Yeni sürüm hazır, yenile" uyarısı gösterilir.)

**Ek dosya ağ isteği sayısı: 0.** Uygulama kendi verisini hiçbir yere göndermez.

## 4.5 iPhone'a Kurulum İçin Gerekenler
| Gereksinim | Durum | Not |
|---|---|---|
| `https://` adres | Sağlanmalı | Service Worker ve kalıcı kurulum sadece güvenli adreslerde çalışır |
| Ücretsiz barındırma | Öneri: **GitHub Pages** (ücretsiz hesap) | Alternatifler: Netlify/Vercel ücretsiz katman, Cloudflare Pages |
| `apple-touch-icon` (180×180 PNG) | Üretilecek | Ana ekran ikonu için şart |
| `apple-mobile-web-app-capable` | Eklenecek | Tam ekran (adres çubuğu olmadan) açılış |
| `viewport-fit=cover` + güvenli alan boşlukları | Eklenecek | Çentik ve alt çubuk altında kırpılma olmaz |
| Çevrimdışı test | Aşama sonunda `Uçak Modu` ile yapılacak | Kullanıcının kendi iPhone'ında test edeceği |

## 4.6 Çalışma Ortamı Sınırları (açıkça belirtiliyor)
- ✅ Node.js **v24.19.0** mevcut → yerel test sunucusu, ikon üretimi ve otomatik testler yapılabilir.
- ❌ **`npm` yok** → paket indirme/derleme yapılamaz. Bu yüzden proje **sıfır bağımlılıklı** tasarlandı.
- ❌ Bu ortamda **gerçek iPhone/Safari testi yapılamaz** → iPhone testi senin tarafında, ücretsiz
  barındırmaya yükledikten sonra yapılacak.
- ❌ Bu ortamda gerçek **App Store/cihaz** işlemi yapılamaz (gerekmiyor).
- ✅ `git` mevcut (2.47) → istersen sürüm güvencesi için kullanacağız.

## 4.7 Dosya Düzeni (hedef)
```
proje/
├─ index.html                 uygulama kabuğu
├─ manifest.webmanifest       PWA bilgisi (ad, ikon, renk)
├─ sw.js                      çevrimdışı önbellek
├─ offline.html               (opsiyonel) internet yoksa uyarı
├─ css/
│  ├─ tema.css                renkler, yazı tipi, düzen değişkenleri
│  ├─ temel.css               buton, kart, form, liste stilleri
│  └─ ekranlar.css            ekrana özel düzenler
├─ js/
│  ├─ ana.js                  başlatma, yönlendirme
│  ├─ veri/depo.js            IndexedDB okuma/yazma
│  ├─ veri/sema.js            kayıt şekli + örnek veriler
│  ├─ veri/puanlama.js        puan/sıralama hesabı
│  ├─ ui/bilesen.js           küçük arayüz yardımcıları
│  ├─ ekranlar/*.js           her ekranın kodu
│  └─ arastirma.js            ChatGPT komutu + cevap ayrıştırıcı
├─ ikonlar/                   üretilmiş PNG ikonlar
├─ tools/                     sunucu.mjs, ikon-uret.mjs, testler
└─ docs/                      bu belgeler
```