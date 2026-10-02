# Hayal Atölyem — Kişisel Hayal ve Hedef Planlama Uygulaması

Kendi iPhone'unda, internetsiz, ücretsiz çalışan Türkçe PWA.
Hayallerini yaz; malzeme, maliyet, adım, öğrenilecekler ve zorluklar ayrı sekmelerde;
kendi istek puanını ver; uygulama maliyet, zorluk ve isteğe göre sıralasın.
Ayrıca kişisel sözlüğün ve yedekleme/geri yükleme özelliğin var.

**Veriler yalnızca senin cihazında durur. Sunucuya hiçbir şey gönderilmez. App Store gerekmez.**

---

## Şu an ne çalışıyor?
- ✅ Hayal ekleme / düzenleme / düzenleme-silme, uygulamayı kapatıp açınca kayıtlar duruyor
- ✅ Fotoğraf ekleme (telefondan, cihazda saklanır)
- ✅ İstek puanı 1–10, bütçe, hedef tarih, 6 farklı durum
- ✅ Ana ekranda arama, durum filtresi, kategori filtresi, 10 farklı sıralama
- ✅ Detayda 6 sekme: Özet · Malzeme & Maliyet · Yapım adımları · Öğrenilecekler · Zorluklar · Notlar
- ✅ Kişisel sözlük (terim, anlam, örnek, benim notum, favori)
- ✅ Yedekleme (dosya / pano) ve geri yükleme
- ✅ Yanlış silmeye karşı çöp kutusu + geri alma
- ✅ 3 demo kaydı — tek dokunuşla silinir
- ✅ Açık/koyu tema, iPhone'da tam ekran, çevrimdışı çalışma
- ✅ **SpaceBunny araştırma asistanı** (ücretli API yok, otomatik bağlanma yok):
  her hayalde "Araştırma komutunu kopyala" ve "Araştırma sonucunu içe aktar" düğmeleri.
  Komut → panoya kopyala → SpaceBunny'ye yapıştır → cevabı yapıştır → önizle → onayla.
  Sürümlü JSON şeması, fiyat uydurma yasağı, istek puanına/tamamlanmış adımlara dokunmama,
  mükerrer aktarım koruması.

---

## Belgeler
| Dosya | İçerik |
|---|---|
| `docs/GEREKSINIMLER.md` | Kesin gereksinimler ve kabul kriterleri (korunur) |
| `docs/EKRAN-PLANI.md` | Ekranlar, puanlama mantığı, veri kaybını önleme |
| `docs/VERI-YAPISI.md` | Saklanan verinin şekli |
| `docs/TEKNOLOJILER.md` | Teknoloji seçimleri ve ortam sınırları |
| `docs/ARASTIRMA-ASISTANI.md` | Araştırma akışının tamamı |
| `docs/ARASTIRMA-VERI-SEMASI.md` | **Sürümlü JSON şeması (1.0)** — alan alan |
| `docs/ornek-veriler/` | Örnek araştırma sonuçları (**fiyatlar gerçek değildir**) |
| `docs/GELISTIRME-ASAMALARI.md` | Aşamalar ve ilerleme durumu |

---

## iPhone'da çalıştırma (ücretsiz, adım adım)
👉 **`docs/IPHONE-KURULUM.md`** dosyasındaki rehberi izle. Özet:

1. **Bilgisayarda:** [github.com](https://github.com)'da ücretsiz hesap aç → yeni repo oluştur
   (**Public**) → bu klasörün içindeki dosyaları sürükle-bırak → **Settings → Pages** →
   `main` / `/ (root)` → **Save** → adres: `https://KULLANICIADIN.github.io/hayal-atolyesi/`
2. **iPhone'da:** **Safari** ile bu adresi aç → alttaki **paylaş** düğmesi → **"Ana Ekrana Ekle"**
3. Ana ekrandaki simgeden aç. **Uçak modunda da çalışır.** Veriler yalnızca telefonda durur.

> Bu yükleme sadece HTML/CSS/JS dosyalarını barındırır (GitHub Pages ücretsiz). Senin verilerin
> oraya **gönderilmez**; tamamen telefonda kalır. Verileri korumak için
> **Ayarlar → Yedek dosyası indir** düzenli olarak yap.

## Bilgisayarda denemek (2 komut)
Terminali (PowerShell) aç ve proje klasöründe şunları çalıştır:

```
node tools\kontrol.mjs
node tools\sunucu.mjs
```
Sonra tarayıcıda **http://localhost:5173** adresini aç. Durdurmak için `Ctrl + C`.

> `index.html` dosyasına çift tıklayarak açma: tarayıcılar modül (module) dosyalarını
> `file://` üzerinden engeller. Sunucu şart.

## iPhone'a kurmak (ücretsiz)
👉 Ayrıntılı rehber: **`docs/IPHONE-KURULUM.md`**.

---

## Araştırma akışı nasıl kullanılır?
1. Bir hayale gir → **Özet** sekmesi → **"🔎 Araştırma komutunu kopyala"**
2. SpaceBunny sohbetine yapıştır ve gönder. Eksik bilgi sorarsa cevapla.
3. Gelen cevabın **tamamını** kopyala.
4. Aynı hayalde **"📥 Araştırma sonucunu içe aktar"** → yapıştır → **Önizle**.
5. Önizlemede ne geleceğini gör: yeni/güncellenecek kayıtlar, fiyat özeti, sorular, uyarılar.
6. İstediğin bölümleri işaretle → **"Onaylıyorum, içe aktar"**.

Akışı denemek için içe aktarma ekranındaki **örnek veri** düğmelerini kullanabilirsin
(`docs/ornek-veriler/` — fiyatları gerçek güncel fiyat değildir, sadece örnektir).

## Temel kurallar
- Ücretli servis yok. Yalnızca ücretsiz statik barındırma.
- Kod: saf HTML/CSS/JS, derleme adımı yok, `npm` gerekmez.
- ChatGPT'ye otomatik bağlanma/kazıma yok.
- Ağ isteği: yalnızca ilk yükleme.
- Telefonu kaybetmeden önce **Ayarlar → Yedek dosyası indir**.

## Geliştirici araçları
```
node tools\kontrol.mjs              # söz dizimi + import + 65 test + PWA dosyaları
node tools\ikon-uret.mjs            # ikonları yeniden üret
node tools\sunucu.mjs [port]        # yerel sunucu
```
Tarayıcıda: `tools/duman-testi.html` (otomatik ekran + araştırma akışı testi),
`tools/telefon-testi.html` (7 ekranı iPhone genişliğinde gösterir).