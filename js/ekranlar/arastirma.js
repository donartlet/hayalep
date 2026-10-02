// Araştırma ekranı: "Komutu kopyala" + "Sonucu içe aktar".
// Uygulama SpaceBunny'ye BAĞLANMAZ. Sadece metin üretir ve metin ayrıştırır.
'use strict';
import { el, temizle, para, tarihSaat } from '../ui/bilesen.js';
import * as depo from '../veri/depo.js';
import { ustCiz, git, durum } from '../ana.js';
import { bildir, panelAc, panoyaYaz } from '../ui/geri.js';
import { komutUret, KOMUT_KILAVUZ } from '../arastirma/komut.js';
import { ayiristir, SURUM, KOK_ADI } from '../arastirma/sema.js';
import { planla, uygula, VARSAYILAN_SECENEKLER } from '../arastirma/birlestir.js';

const MOD = {
  hazirla: 'hazirla',
  yapistir: 'yapistir',
  onizle: 'onizle',
};

export async function arastirmaEkrani(id) {
  const a = temizle(document.getElementById('ana'));
  let is = await depo.getir('isler', id);
  if (!is || is.silindi) { bildir('Hayal bulunamadı.'); git('#/hayaller'); return { ad: 'arastirma' }; }

  const kok = el('div');
  let mod = MOD.hazirla;
  let hamMetin = '';
  let sonuc = null;      // dogrulaVeNormalizeEt çıktısı
  let plan = null;
  const secenekler = { ...VARSAYILAN_SECENEKLER };

  async function tazele() {
    is = await depo.getir('isler', id);
    ciz();
  }

  /* ---------------- Komut ---------------- */
  function komutBlogu() {
    const kap = el('div');
    const metin = komutUret(is);
    is.aiArastirma = { ...(is.aiArastirma || {}), sonKomut: metin };
    const alan = el('textarea', { class: 'metin-alani', rows: 12, readonly: true, 'aria-label': 'Araştırma komutu' });
    alan.value = metin;

    const kopyala = el('button', {
      class: 'dugme dugme--ana dugme--tam', type: 'button',
      onclick: async () => {
        const basarili = await panoyaYaz(metin);
        bildir(basarili ? 'Komut panoya kopyalandı. SpaceBunny sohbetine yapıştır.' : 'Kopyalanamadı. Metni elle seçip kopyala.');
        if (basarili) { await depo.isKaydet(is); tazele(); }
      },
    }, 'Panoya kopyala');

    kap.appendChild(el('div', { class: 'kurulum-ipucu' },
      el('p', { class: 'metin-k', text: 'Sırayla şunları yap:' }),
      el('ol', { class: 'sira', style: { gap: '4px' } },
        KOMUT_KILAVUZ.map((m) => el('li', { class: 'metin-k', style: { paddingLeft: '4px' }, text: `• ${m}` }))),
      el('p', { class: 'metin-bs', text: 'Not: Uygulama SpaceBunny hesabına giriş yapmaz, sohbetleri okumaz. Komutu sen kopyalayıp yapıştırırsın.' })));

    kap.appendChild(el('h3', { class: 'bolum__baslik', style: { marginTop: '14px' }, text: 'Hazırlanan komut' }));
    kap.appendChild(alan);
    kap.appendChild(el('div', { style: { marginTop: '10px', display: 'grid', gap: '10px' } },
      kopyala,
      el('button', {
        class: 'dugme dugme--tam', type: 'button',
        onclick: () => {
          alan.focus(); alan.select();
          bildir('Metin seçildi. Kopyalamak için ekrandaki kopyala komutunu kullanabilirsin.');
        },
      }, 'Metni seç')));
    return kap;
  }

  /* ---------------- Sonucu içe aktar ---------------- */
  function yapistirBlogu() {
    const kap = el('div');
    kap.appendChild(el('div', { class: 'kurulum-ipucu' },
      el('p', { class: 'metin-k', text: 'SpaceBunny’den gelen cevabın tamamını buraya yapıştır.' }),
      el('p', { class: 'metin-bs', text: 'Sadece JSON bloğu da olur, açıklamalarla çevrili metin de olur — uygulama içindeki JSON’u bulur.' })));

    const alan = el('textarea', {
      class: 'metin-alani', rows: 10, placeholder: '```json\n{ ... }\n```',
      'aria-label': 'SpaceBunny cevabını yapıştır',
      oninput: (o) => { hamMetin = o.target.value; },
    });
    alan.value = hamMetin;
    kap.appendChild(alan);
    kap.appendChild(el('button', {
      class: 'dugme dugme--ana dugme--tam', type: 'button', style: { marginTop: '10px' },
      onclick: () => { hamMetin = alan.value; mod = MOD.onizle; ciz(); },
    }, 'Önizle ve doğrula'));

    const ornekler = [
      { ad: 'Koltuk boyama (örnek veri)', yol: '../docs/ornek-veriler/koltuk-boyama.arastirma.json' },
      { ad: 'Ispanaklı poğaça (örnek veri)', yol: '../docs/ornek-veriler/ispnakli-pogaca.arastirma.json' },
    ];
    kap.appendChild(el('div', { class: 'bolum' },
      el('span', { class: 'alan__ipucu', text: 'Akışı denemek için örnek veri yükle (fiyatlar GERÇEK DEĞİLDİR):' }),
      el('div', { class: 'satir-kart__eylemler', style: { marginTop: '6px' } },
        ornekler.map((o) => el('button', {
          class: 'dugme dugme--kucuk', type: 'button',
          onclick: async () => {
            try {
              const yanit = await fetch(o.yol);
              const metin = await yanit.text();
              hamMetin = metin;
              mod = MOD.onizle;
              ciz();
              bildir('Örnek veri yüklendi. Fiyatların örnek olduğunu unutma.');
            } catch (h) { bildir(`Örnek yüklenemedi: ${h.message}`); }
          },
        }, o.ad)))));
    return kap;
  }

  /* ---------------- Önizleme ---------------- */
  function onizleBlogu() {
    const kap = el('div');
    sonuc = ayiristir(hamMetin);

    if (!sonuc.gecerli) {
      kap.appendChild(el('div', { class: 'kart', style: { borderColor: 'var(--tehlike)' } },
        el('h3', { class: 'bolum__baslik', style: { color: 'var(--tehlike)' }, text: 'İçe aktarılamadı' }),
        el('ul', { class: 'sira', style: { gap: '6px' } },
          sonuc.hatalar.map((h) => el('li', { class: 'metin-k', text: `• ${h}` }))),
        el('p', { class: 'alan__ipucu', style: { marginTop: '10px' },
          text: `Beklenen şema sürümü: ${SURUM}. Şemayı görmek için "Araştırma komutunu kopyala" bölümündeki 9. maddeye bak.` })));
      kap.appendChild(tercihDugmeleri());
      return kap;
    }

    const veri = sonuc.veri;
    plan = planla(is, veri, secenekler);

    /* başlık bilgisi */
    kap.appendChild(el('div', { class: 'kart' },
      el('div', { class: 'rozetlar' },
        el('span', { class: 'rozet rozet--basari', text: `Şema ${veri.surum} ✓` }),
        el('span', { class: 'rozet', text: veri.meta.model }),
        el('span', { class: 'rozet', text: tarihSaat(veri.meta.tarih) }),
        el('span', { class: 'rozet', text: veri.meta.paraBirimi }),
        el('span', {
          class: `rozet ${veri.meta.fiyatArastirildi ? 'rozet--basari' : 'rozet--uyari'}`,
          text: veri.meta.fiyatArastirildi ? 'Fiyat araştırıldı' : 'Fiyat araştırılmadı',
        })),
      is.aiArastirma && is.aiArastirma.sonAktarilan === sonuc.parmakIzi
        ? el('p', { class: 'alan__ipucu', style: { marginTop: '8px' }, text: '⚠️ Bu sonuç daha önce aktarılmış görünüyor. Aynı kayıtlar mükerrer eklenmez.' })
        : null,
      veri.meta.not ? el('p', { class: 'alan__ipucu', text: veri.meta.not }) : null));

    /* önce sorulan sorular */
    if (veri.eksik.length) {
      kap.appendChild(el('div', { class: 'bolum' },
        el('h3', { class: 'bolum__baslik', text: `Önce sorulan sorular (${veri.eksik.length})` }),
        veri.eksik.map((k) => el('div', { class: 'satir-kart' },
          el('div', { class: 'satir-kart__baslik', text: k.soru }),
          k.nedenOnemli ? el('div', { class: 'satir-kart__not', text: `Neden önemli: ${k.nedenOnemli}` }) : null,
          k.ornekYanit ? el('div', { class: 'satir-kart__not', text: `Örnek: ${k.ornekYanit}` }) : null))));
    }

    /* maliyet özeti */
    const t = plan.toplamlar;
    kap.appendChild(el('div', { class: 'bolum' },
      el('h3', { class: 'bolum__baslik', text: 'Maliyet özeti' }),
      el('div', { class: 'ozet-serit' },
        el('div', { class: 'ozet-kutu' },
          el('div', { class: 'ozet-kutu__deger', text: para(t.bilinenToplam) }),
          el('div', { class: 'ozet-kutu__etiket', text: 'Hesaplanabilen toplam' })),
        el('div', { class: 'ozet-kutu' },
          el('div', { class: 'ozet-kutu__deger', text: String(t.bilinmeyenSayisi) }),
          el('div', { class: 'ozet-kutu__etiket', text: 'Fiyatı bilinmeyen' })),
        el('div', { class: 'ozet-kutu' },
          el('div', { class: 'ozet-kutu__deger', text: String(t.tahminSayisi) }),
          el('div', { class: 'ozet-kutu__etiket', text: 'Tahmini fiyat' })),
        el('div', { class: 'ozet-kutu' },
          el('div', { class: 'ozet-kutu__deger', text: String(t.kaynakliSayisi) }),
          el('div', { class: 'ozet-kutu__etiket', text: 'Kaynaklı fiyat' })))));

    /* uyarılar */
    const tumUyarilar = [...sonuc.uyarilar, ...plan.uyarilar];
    if (tumUyarilar.length) {
      kap.appendChild(el('div', { class: 'bolum' },
        el('h3', { class: 'bolum__baslik', text: 'Uyarılar' }),
        el('ul', { class: 'sira', style: { gap: '6px' } },
          tumUyarilar.map((u) => el('li', { class: 'metin-k', style: { color: 'var(--uyari)' }, text: `• ${u}` })))));
    }

    /* bölüm seçimleri */
    kap.appendChild(bolumSecim('malzemeler', 'Malzemeler ve maliyet'));
    kap.appendChild(bolumSecim('adimlar', 'Yapım adımları'));
    kap.appendChild(bolumSecim('ogrenilecekler', 'Öğrenilecekler'));
    kap.appendChild(bolumSecim('zorluklar', 'Zorluklar'));
    kap.appendChild(bolumSecim('notlar', 'Notlar (yalnızca eklenir)'));

    /* tekil alanlar */
    kap.appendChild(tekilSecim('sure', 'Süre tahmini',
      plan.tekil.sure.gelen === null ? 'Sonuçta süre yok.'
        : `${plan.tekil.sure.metin} (≈${plan.tekil.sure.gelen} gün)${plan.tekil.sure.mevcut ? ` · şu anki: ${plan.tekil.sure.mevcut} gün` : ''}`));
    kap.appendChild(tekilSecim('zorlukPuani', 'Zorluk puanı',
      plan.tekil.zorlukPuani.gelen === null ? 'Sonuçta zorluk puanı yok.'
        : `${plan.tekil.zorlukPuani.gelen}/5${plan.tekil.zorlukPuani.gerekce ? ` — ${plan.tekil.zorlukPuani.gerekce}` : ''}`));
    kap.appendChild(tekilSecim('butce', 'Bütçe önerisi',
      plan.tekil.butce.gelen === null ? 'Sonuçta bütçe önerisi yok.'
        : `${para(plan.tekil.butce.gelen)}${plan.tekil.butce.mevcut ? ` · şu anki: ${para(plan.tekil.butce.mevcut)}` : ''}`));
    kap.appendChild(tekilSecim('ozet', 'Başlık / açıklama',
      [plan.tekil.ozet.baslikGelen ? `başlık: "${plan.tekil.ozet.baslikGelen}"` : null,
        plan.tekil.ozet.aciklamaGelen ? `açıklama: "${plan.tekil.ozet.aciklamaGelen.slice(0, 120)}…"` : null,
      ].filter(Boolean).join(' · ') || 'Sonuçta özet yok.'));

    /* korunanlar */
    const korunan = Object.values(plan.bolumler).flatMap((b) => b.korumali || []);
    if (korunan.length) {
      kap.appendChild(el('div', { class: 'bolum' },
        el('h3', { class: 'bolum__baslik', text: 'Dokunulmayacak kayıtlar' }),
        el('div', { class: 'kart', style: { borderColor: 'var(--ana)' } },
          el('p', { class: 'metin-k', text: `İstek puanın (${is.istekPuani ?? '—'}/10) hiç değiştirilmeyecek.` }),
          korunan.map((k) => el('p', { class: 'metin-bs metin-soluk', text: `• ${k.hedef.baslik || k.hedef.konu || k.hedef.sorun} — ${k.sebep}` })))));
    }

    kap.appendChild(el('p', { class: 'alan__ipucu', style: { marginTop: '14px' },
      text: `İstek puanın: ${is.istekPuani ?? '—'}/10 — bu değer hiçbir zaman değiştirilmez.` }));

    kap.appendChild(tercihDugmeleri());
    return kap;
  }

  function bolumSecim(anahtar, baslik) {
    const b = plan.bolumler[anahtar];
    const yeniSayisi = b.yeni.length;
    const guncelleSayisi = b.guncelle.length;
    const onayKutusu = el('input', {
      type: 'checkbox', checked: !!secenekler[anahtar],
      onchange: (o) => { secenekler[anahtar] = o.target.checked; },
    });
    const satirlar = [];
    for (const g of b.yeni) {
      const ad = g.ad || g.baslik || g.konu || g.sorun || g.metin;
      satirlar.push(el('div', { class: 'satir-kart__not', text: `+ ${ad}${g.tutar ? ` — ${para(g.tutar)}` : ''}${g.fiyatDurumu === 'bilinmiyor' ? ' (fiyat bilinmiyor)' : ''}${g.seviye ? ` (${g.seviye})` : ''}` }));
    }
    for (const g of b.guncelle) {
      const ad = g.hedef.ad || g.hedef.baslik || g.hedef.konu || g.hedef.sorun;
      satirlar.push(el('div', { class: 'satir-kart__not', text: `~ ${ad}: ${g.degisiklikler.join(', ')}` }));
    }
    return el('div', { class: 'bolum' },
      el('div', { class: 'kart' },
        el('label', { class: 'onay' }, onayKutusu,
          el('div', { class: 'ayar-satir__metin' },
            el('div', { class: 'ayar-satir__baslik', text: baslik }),
            el('div', { class: 'ayar-satir__alt', text: `${yeniSayisi} yeni · ${guncelleSayisi} güncellenecek${b.ayni ? ` · ${b.ayni} zaten var` : ''}` }))),
        satirlar.length ? el('div', { class: 'satir-kart__not', style: { marginTop: '8px' } }, satirlar) : null));
  }

  function tekilSecim(anahtar, baslik, metin) {
    const onayKutusu = el('input', {
      type: 'checkbox', checked: !!secenekler[anahtar],
      onchange: (o) => { secenekler[anahtar] = o.target.checked; },
    });
    return el('div', { class: 'kart', style: { marginTop: '8px' } },
      el('label', { class: 'onay' }, onayKutusu,
        el('div', { class: 'ayar-satir__metin' },
          el('div', { class: 'ayar-satir__baslik', text: baslik }),
          el('div', { class: 'ayar-satir__alt', text: metin }))));
  }

  function tercihDugmeleri() {
    const geri = el('button', {
      class: 'dugme dugme--tam', type: 'button',
      onclick: () => { hamMetin = ''; sonuc = null; plan = null; mod = MOD.yapistir; ciz(); },
    }, '← Geri');
    const onayli = el('button', {
      class: 'dugme dugme--ana dugme--tam', type: 'button',
      onclick: async () => {
        if (!sonuc || !sonuc.gecerli || !plan) return;
        const yeni = uygula(is, sonuc.veri, plan, secenekler);
        yeni.aiArastirma = {
          ...(is.aiArastirma || {}),
          sonKomut: (is.aiArastirma || {}).sonKomut || '',
          sonCevap: hamMetin.slice(0, 4000),
          sonAktarilan: sonuc.parmakIzi,
          sonAktarimTarihi: new Date().toISOString(),
          kaynakModel: sonuc.veri.meta.model,
        };
        await depo.isKaydet(yeni);
        const sayi = plan.degisiklikSayisi;
        bildir(`${sayi ? sayi + ' kayıt eklendi/güncellendi' : 'Değişiklik yok — her şey zaten vardı'}.`);
        git(`#/hayal/${id}`);
      },
    }, '✓ Onaylıyorum, içe aktar');
    // Doğrulama başarısızsa onay düğmesi gösterilmez
    const onayGoster = !!(sonuc && sonuc.gecerli && plan);
    return el('div', { class: 'bolum', style: { display: 'grid', gap: '10px' } }, geri, onayGoster ? onayli : null);
  }

  /* ---------------- Ekran iskeleti ---------------- */
  function ciz() {
    a.textContent = '';
    const adimDugmesi = (kod, ad, aktif) => el('button', {
      class: 'sekme', type: 'button', 'aria-selected': aktif ? 'true' : 'false',
      style: { flex: '1', justifyContent: 'center' },
      onclick: () => { mod = kod; if (kod !== MOD.onizle) { sonuc = null; plan = null; } ciz(); },
    }, ad);

    a.appendChild(el('div', { class: 'sekmeler' },
      adimDugmesi(MOD.hazirla, '1 · Komutu kopyala', mod === MOD.hazirla),
      adimDugmesi(MOD.yapistir, '2 · Sonucu içe aktar', mod === MOD.yapistir),
      adimDugmesi(MOD.onizle, '3 · Önizle', mod === MOD.onizle)));

    if (mod === MOD.hazirla) a.appendChild(komutBlogu());
    else if (mod === MOD.yapistir) a.appendChild(yapistirBlogu());
    else a.appendChild(onizleBlogu());

    a.appendChild(el('div', { class: 'bolum', style: { display: 'grid', gap: '10px' } },
      el('button', { class: 'dugme dugme--tam', type: 'button', onclick: () => git(`#/hayal/${id}`) }, '← Hayal detayına dön')));

    ustCiz({
      baslik: 'Araştırma',
      altBaslik: is.baslik,
      geri: true,
      sagEylemler: [],
    });
  }

  ciz();
  return { ad: 'arastirma' };
}