# iPhone'da Çalıştırma Rehberi

Kod bilmene gerek yok. Adımlar sırayla; toplam ~10 dakika ve tamamı **ücretsiz**.

## Neden önce bir yere yüklemek gerekiyor?

iPhone'da "uygulama gibi açılan ve internetsiz çalışan" bir uygulama için iki şart var:
1. Adres **`https://` ile** başlamalı (`http://` ile olmaz)
2. Telefonda **"Ana Ekrana Ekle"** ile kurulmalı

Bu yüzden dosyaları bir yere yüklüyoruz. Verilerin oraya **gitmiyor** — yalnızca HTML/CSS/JS
dosyaları duruyor. Senin kayıtların telefonda kalıyor.

---

## 1. Adım: Dosyaları GitHub'a koy (bilgisayarda)

GitHub, ücretsiz dosya barındırma yapar. İki seçeneğin var:

### Seçenek A — Tarayıcıdan, sürükle-bırak (en kolay)
1. **github.com** adresine gir → **Sign up** → ücretsiz hesap aç (e-posta + şifre).
2. Sağ üstte **+** → **New repository**.
3. Şunları yaz:
   - Repository name: `hayal-atolyesi`
   - ✅ **Public** (Private seçme — Pages ücretsiz planı için public olmalı)
4. Aşağıda **"uploading an existing file"** bağlantısına tıkla.
5. Bilgisayarındaki bu klasörün **içindeki dosyaları** (`index.html`, `css/`, `js/`, `ikonlar/`,
   `docs/`, `manifest.webmanifest`, `sw.js`, `.nojekyll`) sürükleyip bırak.
   - ⚠️ Klasörün kendisini değil, **içindekileri** yükle. Yani `index.html` klasörün
     kökünde görünsün.
6. Yeşil renkli **Commit changes** düğmesine bas.

> `.nojekyll` ve `.gitignore` gizli dosyalar; sürükle-bırakta görünmezler. Onları yüklemek
> şart değil (gizli dosyalar yüklenemez) — GitHub Pages zaten bu klasörü olduğu gibi servis eder.

### Seçenek B — GitHub Desktop ile (biraz daha rahat)
1. **desktop.github.com** adresinden GitHub Desktop'u indir ve kur (ücretsiz).
2. Hesabınla giriş yap.
3. **File → Create a repository** → ad: `hayal-atolyesi`, Public.
4. **Add existing repository** → bu proje klasörünü seç → **Add repository**.
5. Sağ üstte **Publish repository**.

---

## 2. Adım: Yayına al

1. Yüklediğin depoya git → **Settings** sekmesi (üst menüde).
2. Sol menüde **Pages**.
3. **Build and deployment** bölümünde:
   - **Source:** `Deploy from a branch`
   - **Branch:** `main` / **Folder:** `/ (root)`
4. **Save** düğmesine bas.
5. Sayfa yenilenir; 1–3 dakika sonra adres belirir:
   `https://KULLANICIADIN.github.io/hayal-atolyesi/`

> Adres hemen çıkmazsa sayfayı bir kez yenile. Hâlâ çıkmıyorsa Settings → Pages'e dön;
   bazen "Enesure  HTTPS" diye bir uyarı çıkar, oraya tıklayıp tekrar Save de.

---

## 3. Adım: iPhone'a kur

1. iPhone'da **Safari**'yi aç. (Chrome değil — sadece Safari'de kurulabilir.)
2. Adres çubuğuna şunu yaz: `https://KULLANICIADIN.github.io/hayal-atolyesi/`
   (Bilgisayardaki adresin aynısı.)
3. Sayfa açılınca ekranın **ortasındaki alttaki paylaş düğmesine** (⬆️ veya ⬆ kutucuk) dokun.
4. Açılan listede **"Ana Ekrana Ekle"** → **"Ekle"**.
5. Ana ekranda bir simge belirir. **O simgeden aç.**

Artık:
- Adres çubuğu, tarayıcı düğmeleri yok — tam ekran uygulama gibi
- **Uçak modunda bile açılır** (ilk açılıştan sonra)
- Kayıtlar, fotoğraflar, sözlük **sadece telefonda** durur

---

## 4. Adım: Kontrol et

Telefonda şu 4 şeyi dene:

| Deneme | Beklenen |
|---|---|
| Uygulamayı aç | Ana ekran, 3 demo hayal görünür |
| **Uçak modunu aç**, uygulamayı kapat ve tekrar aç | Yine açılır, kayıtlar durur |
| `+ Yeni` → bir hayal yaz, uygulamayı tamamen kapat | Hayal listede durur |
| **Ayarlar → Yedek dosyası indir** | Telefona `.json` yedeği iner |

---

## Bilmen gereken önemli şeyler

### Veriler nerede, sıkışır mı?
- Kayıtların **yalnızca telefonda**. Sunucuya hiç gönderilmez.
- **Telefonu kaybedersen veya silersen veriler gider.** O yüzden düzenli olarak
  **Ayarlar → Yedek dosyası indir** de. Yedeği iCloud/Google Drive'a at.
- Yedekten geri yüklemek istersen: **Ayarlar → Yedekten geri yükle**.

### Safari'den veri temizlenirse ne olur?
Ayarlar → Safari → Geçmişi temizle → "Web sitesi verilerini temizle" yaparsan
uygulamanın verisi silinir. Ama yedek dosyan varsa geri yükleyebilirsin.

### Güncelleme
Kod değişirse GitHub'a tekrar yüklersin. Kullanıcıya göre uygulama kendini günceller:
- Uygulamayı açınca yeni sürüm fark edilir
- Tamamen kapatıp yeniden açınca yeni sürüm yüklenir
(Sağ üstte "Yeni sürüm indirildi" uyarısı çıkabilir.)

### Bilgisayarda da denemek istersen
```
node tools\sunucu.mjs
```
Sonra tarayıcıda `http://localhost:5173`.
Bu yöntemle iPhone'a **kuramazsın** (adres `http` olduğu için), sadece bilgisayarda bakmak içindir.

---

## Sorun giderme

| Sorun | Çözüm |
|---|---|
| Ana ekranda simge çıkmadı | Safari'i kapat, tekrar aç, sayfayı yenile, paylaş → Ana Ekrana Ekle |
| Simge çıktı ama internetsiz açılmıyor | Uygulamayı **bir kez internette açıp** kapat; sonra tekrar dene |
| Sayfa "404" veriyor | Depoya `index.html` kök klasöre yüklenmemiş demektir. Kontrol et |
| Settings'te **Pages** menüsü yok | Depo **Private** olabilir → Depoyu aç → Settings → en altta "Change visibility" → Public |
| Boş ekran | Bir kez internetle aç, sonra uçak modunda tekrar dene |

---

## Özet (tek ekran)

```
Bilgisayar:  GitHub'da ücretsiz hesap → repo oluştur (Public) → dosyaları yükle
             → Settings → Pages → main / (root) → Save
             → https://KULLANICIADIN.github.io/hayal-atolyesi/  adresini al

iPhone:      Safari → adresi yaz → ⬆️ paylaş → "Ana Ekrana Ekle" → Ekle
             → Ana ekrandaki simgeden aç, uçak modunda da çalışır
```
