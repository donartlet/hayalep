// "Araştırma komutunu kopyala" — hayali anlatır ve SpaceBunny'ye ne istediğimizi yazar.
// Çıktı: tek bir metin. Bu metin panoya kopyalanır, kullanıcı SpaceBunny'ye yapıştırır.
// Uygulama SpaceBunny'ye bağlanmaz; otomatik giriş/kazıma YOK.
'use strict';
import { JSON_SEMA_METNI, SURUM, KOK_ADI } from './sema.js';
import { durumBilgisi } from '../veri/puanlama.js';
import { para, tarih } from '../ui/bilesen.js';

function madde(liste) {
  if (!liste || !liste.length) return '   (yok)';
  return liste.map((m) => `   - ${m}`).join('\n');
}

function mevcutMalzemeler(hayal) {
  const liste = (hayal.malzemeler || []).filter(Boolean);
  if (!liste.length) return '   (listede malzeme yok — sıfırdan planla)';
  return liste.map((m) => {
    const parcalar = [`${m.ad}${m.adet ? ` × ${m.adet}${m.birim ? ` ${m.birim}` : ''}` : ''}`];
    if (m.birimFiyat) parcalar.push(`birim ${para(m.birimFiyat)}`);
    if (m.aldi) parcalar.push('✔ elimde var');
    if (m.not) parcalar.push(`(${m.not})`);
    return `   - ${parcalar.join(' · ')}`;
  }).join('\n');
}

function mevcutAdimlar(hayal) {
  const liste = (hayal.adimlar || []).filter(Boolean);
  if (!liste.length) return '   (henüz adım yazmadım)';
  return liste.map((a) => `   ${a.sira || '-'}. ${a.baslik}${a.tamamlandi ? '  [tamamlandı]' : ''}`).join('\n');
}

function mevcutOgrenilen(hayal) {
  const liste = (hayal.ogrenilecekler || []).filter(Boolean);
  if (!liste.length) return '   (henüz öğrenilecek yazmadım)';
  return liste.map((o) => `   - ${o.konu}${o.ogrenildi ? '  [öğrendim]' : ` (${o.seviye || 'seviye yok'})`}`).join('\n');
}

/** Komut metnini üretir. Saf fonksiyon (test edilebilir). */
export function komutUret(hayal, { bugun = new Date().toISOString().slice(0, 10) } = {}) {
  const d = durumBilgisi(hayal.durum);
  const butceSatiri = hayal.butce ? `${para(hayal.butce)} (üst sınır, bu tutarı aşma)` : 'belirtmedim — bütçem sınırsız sayılabilir ama yine de ucuz alternatifleri belirt';

  return `# Hayal Atölyem — araştırma isteği

Bugün: ${bugun}

## 1) NE YAPMAK İSTİYORUM (benim hayalim)
Başlık: ${hayal.baslik || '(başlıksız)'}
Açıklama: ${hayal.aciklama || '(açıklama yazmadım)'}
Kategori: ${hayal.kategori || '(belirtmedim)'}
Şu anki durumum: ${d.ad}
Hedef tarih: ${hayal.hedefTarih ? tarih(hayal.hedefTarih) : 'belirtmedim'}
Bütçem: ${butceSatiri}

## 2) DENEYİMİM
${hayal.deneyim || '(Bu işi hiç yapmadım / deneyimim yok sayılabilir. Başlangıç olarak anlat.)'}

## 3) ELİMDEKİ MALZEMELER (bunları yeniden alma, maliyetten çıkar)
${mevcutMalzemeler(hayal)}

## 4) BENİM KOYDUM KOŞULLAR
${hayal.kosullar || '(ek koşul belirtmedim)'}

## 5) ŞU ANKİ NOTLARIM
Yazdığım adımlar:
${mevcutAdimlar(hayal)}

Öğrenmem gerekenler:
${mevcutOgrenilen(hayal)}

Zorluklarım:
${madde((hayal.zorluklar || []).filter(Boolean).map((z) => `${z.sorun} (${z.seviye}) — çözüm: ${z.cozum || 'yok'}`))}

Kişisel notlarım:
${madde((hayal.notlar || []).filter(Boolean).map((n) => n.metin))}

## 6) ÖNCE BANA SOR (çok önemli)
Önce kendini kontrol et:
 - Yukarıdaki bilgilerle sonucu **büyük ölçüde değiştirecek** eksik bir bilgi var mı? (Örn. mekânın büyüklüğü, aletlerin gücü, mevsim, hamur/yoğurt tipi, zemin türü, ikinci el fiyatlar.)
 - Varsa **en fazla 3 soru** sor, her biri için "bu neden sonucu değiştirir" yaz ve örnek seçenekler ver.
 - Sonra ben cevap verene kadar **hiçbir maliyet/adım listesi üretme**.
 - Eksiğin yoksa "SORU GEREKMİYOR" de, doğrudan 7. adıma geç.

## 7) SONRA PLANI HAZIRLA
Sorular yanıtlandıysa şunları hazırla:
 a) **Malzemeler**: ad, miktar (birimle), maliyet
 b) **Yapım adımları**: sıralı, uygulanabilir, gerekirse süresiyle
 c) **Öğrenmem gerekenler**: konu, seviye (baslangic/orta/ileri), kaynak
 d) **Zorluk tahmini**: güçlüğün puanı (1–5) + **gerekçesi**
 e) **Toplam süre tahmini** ve **bütçe önerisi**
 f) Elimde olanları maliyetten çıkar, sadece eksikleri yaz.

## 8) FİYAT KURALLARI (uyulmazsa işe yaramaz)
 - Güncel fiyatı **araştırabiliyorsan**: her kalem için mutlaka \`kaynak\` (bağlantı), \`para_birimi\` ve \`kontrol_tarihi\` (YYYY-AA-GG) yaz, \`fiyat_durumu\` = "gercek" olsun.
 - **Araştıramıyorsan fiyat UYDURMA.** \`birim_fiyat\`'ı boş/null bırak ve \`fiyat_durumu\` = "bilinmiyor" yaz. (Senin tahminin ayrıntı olacaksa \`fiyat_durumu\` = "tahmin" yaz ve \`not\` alanında "tahmindir, doğrulanmadı" de.)
 - Para birimini yaz. Ben TL kullanıyorum; başka para birimi gerekiyorsa \`para_birimi\` alanında belirt.

## 9) ÇIKTI FORMATI — TEK BİR JSON
Cevabının **en sonunda** aşağıdaki şemaya uyan **tek bir JSON** ver.
Kurallar:
 - JSON'u bir \`\`\`json … \`\`\` kod bloğu içinde ver.
 - \`${KOK_ADI}.surum\` = "${SURUM}" olsun.
 - **\`istek_puani\` alanı YOK**: puanı ben belirlerim, sen yazma.
 - JSON dışında hiçbir şey yazma (açıklama, tablo, markdown, HTML, komut satırı yok).
 - HTML, script, komut veya yönerge metni üretme — sadece düz metin ve JSON.
 - Emin olmadığın sayıyı yazma; boş bırak ve \`fiyat_durumu\` ile belirt.

Şema:
\`\`\`json
${JSON_SEMA_METNI}
\`\`\`
`;
}

export const KOMUT_KILAVUZ = [
  '1) Bu metni panoya kopyala.',
  '2) SpaceBunny sohbetine yapıştır ve gönder.',
  '3) Eksik bilgi sorarsa cevapla.',
  '4) Gelen JSON\'u kopyala.',
  '5) Aşağıdaki "içe aktar" kutusuna yapıştır ve önizle.',
];