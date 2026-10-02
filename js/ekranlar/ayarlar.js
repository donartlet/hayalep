// 5) Ayarlar: tema, sıralama ağırlıkları, yedekleme/geri yükleme, çöp kutusu, demo kayıtları.
'use strict';
import { el, temizle, tarih, tarihSaat } from '../ui/bilesen.js';
import * as depo from '../veri/depo.js';
import { VARSAYILAN_AYARLAR, demoIsleri, demoSozluk } from '../veri/sema.js';
import { ustCiz, git, durum, temayiUygula } from '../ana.js';
import { bildir, onaySor, panelAc } from '../ui/geri.js';
import * as yedek from '../veri/yedek.js';
import { dosyaBoyutu } from '../ui/gorsel.js';

function bolumBaslik(baslik, aciklama) {
  return el('div', { class: 'bolum' },
    el('div', { class: 'bolum__ust' },
      el('h2', { class: 'bolum__baslik', text: baslik })),
    aciklama ? el('p', { class: 'metin-bs metin-soluk', style: { margin: '-4px 0 8px' }, text: aciklama }) : null);
}

function satir(baslik, altBaslik, sagEylem) {
  return el('div', { class: 'ayar-satir' },
    el('div', { class: 'ayar-satir__metin' },
      el('div', { class: 'ayar-satir__baslik', text: baslik }),
      altBaslik ? el('div', { class: 'ayar-satir__alt', text: altBaslik }) : null),
    sagEylem || null);
}

export async function ayarlarEkrani() {
  const a = temizle(document.getElementById('ana'));
  let isler = await depo.hepsi('isler');
  let sozluk = await depo.hepsi('sozluk');
  let gorseller = await depo.hepsi('gorseller');
  let cop = isler.filter((i) => i.silindi);
  let demolar = isler.filter((i) => i.demo);
  let sonYedek = await depo.metaGet('sonYedekleme', null);

  async function sonYedekTazele() { sonYedek = await depo.metaGet('sonYedekleme', null); }

  async function tazele() {
    isler = await depo.hepsi('isler');
    sozluk = await depo.hepsi('sozluk');
    gorseller = await depo.hepsi('gorseller');
    cop = isler.filter((i) => i.silindi);
    demolar = isler.filter((i) => i.demo);
  }

  /* ---------- Tema ---------- */
  async function temaAyarla(yeni) {
    durum.ayarlar.tema = yeni;
    temayiUygula(yeni);
    await depo.ayarYaz('genel', durum.ayarlar);
    bildir(`Tema: ${yeni === 'otomatik' ? 'Otomatik' : yeni === 'koyu' ? 'Koyu' : 'Açık'}`);
    ciz();
  }

  /* ---------- Ağırlıklar ---------- */
  function agirlikPaneli() {
    const govde = el('div');
    const agirliklar = { ...durum.ayarlar.agirliklar };
    const alanlar = [
      { anahtar: 'istek', ad: 'İstek puanının ağırlığı', ipucu: 'Ne kadar istediğine önem verilsin.' },
      { anahtar: 'kolaylik', ad: 'Kolaylığın ağırlığı', ipucu: 'Kolay ve ucuz olanlar yukarı çıksın.' },
      { anahtar: 'hiz', ad: 'Hızın ağırlığı', ipucu: 'Süre tahmini kısa olanlar yukarı çıksın.' },
    ];
    const girdiler = [];
    for (const a of alanlar) {
      const girdi = el('input', {
        class: 'girdi', type: 'number', min: '0', max: '1', step: '0.05',
        value: agirliklar[a.anahtar], 'aria-label': a.ad,
        oninput: (o) => { agirliklar[a.anahtar] = Number(o.target.value); },
      });
      girdiler.push({ anahtar: a.anahtar, girdi });
      govde.appendChild(el('div', { class: 'alan' },
        el('label', { class: 'alan__etiket', text: a.ad }), girdi,
        el('span', { class: 'alan__ipucu', text: a.ipucu })));
    }
    govde.appendChild(el('p', { class: 'alan__ipucu', text: 'Değişiklikler sadece "Önerilen sıralama"yı etkiler.' }));

    let kapat = () => {};
    kapat = panelAc('Sıralama ağırlıkları', govde, {
      altDugmeler: [
        el('button', { class: 'dugme dugme--tam', type: 'button', onclick: () => kapat() }, 'Vazgeç'),
        el('button', {
          class: 'dugme dugme--ana dugme--tam', type: 'button',
          onclick: async () => {
            const toplam = girdiler.reduce((t, g) => t + (Number(g.girdi.value) || 0), 0);
            if (toplam <= 0) { bildir('Ağırlıklar toplamı sıfır olamaz.'); return; }
            const normalize = {};
            for (const g of girdiler) normalize[g.anahtar] = (Number(g.girdi.value) || 0) / toplam;
            durum.ayarlar.agirliklar = normalize;
            await depo.ayarYaz('genel', durum.ayarlar);
            kapat();
            bildir('Ağırlıklar kaydedildi.');
            ciz();
          },
        }, 'Kaydet'),
      ],
    }).kapat;
  }

  /* ---------- Yedekleme ---------- */
  async function yedekAl() {
    try {
      const sonuc = await yedek.yedekBaglanti();
      bildir('Yedek indirildi: ' + sonuc.dosya);
      await tazele();
      sonYedekTazele();
      ciz();
    } catch (hata) {
      bildir(`Yedek alınamadı: ${hata.message}`);
    }
  }

  async function panoyaYedekle() {
    const sonuc = await yedek.panoyaKopyala();
    bildir(sonuc.basarili
      ? `Yedek panoya kopyalandı (${dosyaBoyutu(sonuc.bayt)}). Notlar'a yapıştırıp saklayabilirsin.`
      : 'Panoya kopyalanamadı. "Yedek dosyası indir" yöntemini dene.');
  }

  function geriYuklePaneli() {
    const govde = el('div');
    govde.appendChild(el('p', { class: 'metin-k', text: 'Yedek dosyasını seç. Yedekte fotoğraflar da varsa geri yüklenir.' }));
    const girdi = el('input', { class: 'girdi', type: 'file', accept: 'application/json,.json', 'aria-label': 'Yedek dosyası' });
    const pano = el('textarea', { class: 'metin-alani', rows: 4, placeholder: 'Veya yedek metnini buraya yapıştır', 'aria-label': 'Yedek metni' });
    govde.appendChild(el('div', { class: 'alan' }, el('span', { class: 'alan__etiket', text: 'Yedek dosyası' }), girdi));
    govde.appendChild(el('div', { class: 'alan' }, el('span', { class: 'alan__etiket', text: 'Yedek metni (pano)' }), pano));

    let kapat = () => {};
    const yonet = async (veri, mod) => {
      const onay = await onaySor({
        baslik: mod === 'degistir' ? 'Mevcut veriler değiştirilsin mi?' : 'Yedek üzerine eklensin mi?',
        mesaj: mod === 'degistir'
          ? `Şu an ${isler.length} hayal ve ${sozluk.length} sözlük kaydın var. Bunlar silinip yedekteki kayıtlar yüklenecek. Bu işlem geri alınamaz.`
          : 'Yedekteki kayıtlar mevcut kayıtlara eklenir. Aynı kayıt varsa yedekteki sürüm yazılır.',
        onayAd: mod === 'degistir' ? 'Evet, değiştir' : 'Üzerine ekle',
        tehlike: mod === 'degistir',
      });
      if (!onay) return;
      try {
        const sonuc = await yedek.geriYukle(veri, mod);
        kapat();
        bildir(`${sonuc.is} hayal, ${sonuc.sozluk} sözlük kaydı geri yüklendi.`);
        git('#/hayaller');
      } catch (hata) {
        bildir(`Geri yüklenemedi: ${hata.message}`);
      }
    };
    kapat = panelAc('Yedekten geri yükle', govde, {
      altDugmeler: [
        el('button', { class: 'dugme dugme--tam', type: 'button', onclick: () => kapat() }, 'Vazgeç'),
        el('button', {
          class: 'dugme dugme--ana', type: 'button',
          onclick: async () => {
            if (girdi.files && girdi.files[0]) {
              try { yonet(await yedek.yedekDosyaOku(girdi.files[0]), 'degistir'); } catch (h) { bildir(`Dosya okunamadı: ${h.message}`); }
              return;
            }
            const metin = pano.value.trim();
            if (!metin) { bildir('Dosya seç ya da metni yapıştır.'); return; }
            try { yonet(JSON.parse(metin), 'degistir'); } catch (h) { bildir('Yapıştırılan metin okunamadı.'); }
          },
        }, 'Yedekten yükle'),
      ],
    }).kapat;
  }

  /* ---------- Çöp kutusu ---------- */
  function copPaneli() {
    const govde = el('div');
    if (!cop.length) {
      govde.appendChild(el('p', { class: 'metin-k', text: 'Çöp kutusu boş.' }));
    } else {
      for (const kayit of cop) {
        govde.appendChild(el('div', { class: 'satir-kart' },
          el('div', { class: 'satir-kart__ust' },
            el('div', { class: 'satir-kart__baslik', text: kayit.baslik }),
            el('div', { class: 'satir-kart__deger metin-bs metin-soluk', text: tarih(kayit.silinmeZamani) })),
          el('div', { class: 'satir-kart__eylemler' },
            el('button', {
              class: 'dugme dugme--kucuk dugme--ana', type: 'button', onclick: async () => {
                await depo.isKaydet({ ...kayit, silindi: false, silinmeZamani: null });
                kapat();
                bildir('Geri alındı.');
                await tazele();
                ciz();
              },
            }, '↩ Geri al'),
            el('button', {
              class: 'dugme dugme--kucuk dugme--tehlike', type: 'button', onclick: async () => {
                const evet = await onaySor({
                  baslik: 'Kalıcı olarak sil',
                  mesaj: `"${kayit.baslik}" kalıcı olarak silinecek. Bu işlem geri alınamaz.`,
                  onayAd: 'Kalıcı sil', tehlike: true,
                });
                if (!evet) return;
                if (kayit.fotoId) { try { await depo.sil('gorseller', kayit.fotoId); } catch { /* yoksay */ } }
                await depo.sil('isler', kayit.id);
                kapat();
                bildir('Kalıcı olarak silindi.');
                await tazele();
                ciz();
              },
            }, 'Kalıcı sil'))));
      }
      govde.appendChild(el('button', {
        class: 'dugme dugme--tehlike dugme--tam', type: 'button', style: { marginTop: '12px' },
        onclick: async () => {
          const evet = await onaySor({
            baslik: 'Çöp kutusunu boşalt',
            mesaj: `${cop.length} kayıt kalıcı olarak silinecek. Geri alınamaz.`,
            onayAd: 'Boşalt', tehlike: true,
          });
          if (!evet) return;
          for (const kayit of cop) await depo.sil('isler', kayit.id);
          kapat();
          bildir('Çöp kutusu boşaltıldı.');
          await tazele();
          ciz();
        },
      }, 'Çöp kutusunu boşalt'));
    }
    let kapat = () => {};
    kapat = panelAc('Çöp kutusu', govde).kapat;
  }

  /* ---------- Demo kayıtları ---------- */
  async function demoSil() {
    const evet = await onaySor({
      baslik: 'Demo kayıtları silinsin mi?',
      mesaj: `${demolar.length} demo hayal ve demo sözlük kayıtları silinecek. Senin eklediğin kayıtlar etkilenmez.`,
      onayAd: 'Demo kayıtlarını sil', tehlike: true,
    });
    if (!evet) return;
    for (const kayit of demolar) await depo.sil('isler', kayit.id);
    for (const k of sozluk.filter((x) => x.demo)) await depo.sil('sozluk', k.id);
    await depo.metaYaz('demoKuruldu', true);
    bildir('Demo kayıtları silindi.');
    git('#/hayaller');
  }

  async function demoGeriEkle() {
    for (const kayit of demoIsleri()) await depo.yaz('isler', kayit);
    for (const k of demoSozluk()) await depo.yaz('sozluk', k);
    bildir('Demo kayıtları geri eklendi.');
    git('#/hayaller');
  }

  /* ---------- Her şeyi sil ---------- */
  async function hepsiniSil() {
    const evet = await onaySor({
      baslik: 'Tüm verileri sil',
      mesaj: `${isler.length} hayal, ${sozluk.length} sözlük kaydı ve fotoğraflar kalıcı olarak silinecek. Bu işlem geri alınamaz.`,
      onayAd: 'Evet, hepsini sil', tehlike: true,
    });
    if (!evet) return;
    const sonra = await onaySor({
      baslik: 'Emin misin?',
      mesaj: 'Son onay: bu veriler cihazdan tamamen silinecek. Silmeden önce yedek alman önerilir.',
      onayAd: 'Yine de sil', tehlike: true,
    });
    if (!sonra) return;
    for (const kayit of isler) await depo.sil('isler', kayit.id);
    for (const k of sozluk) await depo.sil('sozluk', k.id);
    for (const g of gorseller) await depo.sil('gorseller', g.id);
    await depo.metaYaz('demoKuruldu', true);
    await depo.metaYaz('sonYedekleme', null);
    bildir('Tüm veriler silindi.');
    git('#/hayaller');
  }

  /* ---------- Çizim ---------- */
  function ciz() {
    a.textContent = '';
    const agirlik = durum.ayarlar.agirliklar || VARSAYILAN_AYARLAR.agirliklar;

    a.appendChild(bolumBaslik('Görünüm', null));
    a.appendChild(el('div', { class: 'ayar-liste' },
      satir('Tema', 'Sistem ayarını izle veya sabitle', el('select', {
        class: 'secim', style: { width: '140px', minWidth: '0' },
        onchange: (o) => temaAyarla(o.target.value),
      },
        el('option', { value: 'otomatik', selected: (durum.ayarlar.tema || 'otomatik') === 'otomatik' }, 'Otomatik'),
        el('option', { value: 'acik', selected: durum.ayarlar.tema === 'acik' }, 'Açık'),
        el('option', { value: 'koyu', selected: durum.ayarlar.tema === 'koyu' }, 'Koyu'))),
    ));

    a.appendChild(bolumBaslik('Sıralama', 'Önerilen sıralama bu ağırlıklarla hesaplanır.'));
    a.appendChild(el('div', { class: 'ayar-liste' },
      satir('Sıralama ağırlıkları',
        `İstek %${yuzde(agirlik.istek)} · Kolaylık %${yuzde(agirlik.kolaylik)} · Hız %${yuzde(agirlik.hiz)}`,
        el('button', { class: 'dugme dugme--kucuk', type: 'button', onclick: agirlikPaneli }, 'Değiştir')),
    ));

    a.appendChild(bolumBaslik('Yedekleme', 'Veriler yalnızca bu cihazda. Yedek dosyası da cihaza iner.'));
    a.appendChild(el('div', { class: 'ayar-liste' },
      satir('Yedek dosyası indir', 'Tüm hayaller, sözlük ve fotoğraflar tek dosyada', el('button', { class: 'dugme dugme--kucuk dugme--ana', type: 'button', onclick: yedekAl }, 'İndir')),
      satir('Panoya kopyala', 'Metin olarak yapıştırıp Notlar uygulamasına kaydedebilirsin', el('button', { class: 'dugme dugme--kucuk', type: 'button', onclick: panoyaYedekle }, 'Kopyala')),
      satir('Yedekten geri yükle', 'Dosyadan veya yapıştırılan metinden yükle', el('button', { class: 'dugme dugme--kucuk', type: 'button', onclick: geriYuklePaneli }, 'Geri yükle')),
    ));
    a.appendChild(el('p', { class: 'alan__ipucu', style: { marginTop: '8px' },
      text: sonYedek ? `Son yedekleme: ${tarihSaat(sonYedek)}` : 'Henüz yedek alınmadı. Telefonu kaybetmeden önce yedek al.' }));

    a.appendChild(bolumBaslik('Veriler', null));
    a.appendChild(el('div', { class: 'ayar-liste' },
      satir('Çöp kutusu', cop.length ? `${cop.length} kayıt çöpte` : 'Boş', el('button', { class: 'dugme dugme--kucuk', type: 'button', onclick: copPaneli }, cop.length ? 'Aç' : '—')),
      satir('Demo kayıtları', `${demolar.length} demo hayal · ${sozluk.filter((k) => k.demo).length} demo sözlük kaydı`,
        el('button', { class: 'dugme dugme--kucuk', type: 'button', onclick: demolar.length ? demoSil : demoGeriEkle },
          demolar.length ? 'Sil' : 'Geri ekle')),
      satir('Toplam', `${isler.filter((i) => !i.silindi).length} hayal · ${sozluk.length} sözlük · ${gorseller.length} fotoğraf`, null),
    ));

    a.appendChild(bolumBaslik('iPhone’a kurma', null));
    a.appendChild(el('div', { class: 'kurulum-ipucu' },
      el('p', { class: 'metin-k', text: 'Safari ile aç, sonra paylaş → "Ana Ekrana Ekle".' }),
      el('div', { class: 'kurulum-adim' }, el('span', { class: 'kurulum-adim__no', text: '1' }),
        el('span', { text: 'Uygulamayı Safari\'de aç (Chrome değil).' })),
      el('div', { class: 'kurulum-adim' }, el('span', { class: 'kurulum-adim__no', text: '2' }),
        el('span', { text: 'Alt ortadaki paylaş düğmesine dokun.' })),
      el('div', { class: 'kurulum-adim' }, el('span', { class: 'kurulum-adim__no', text: '3' }),
        el('span', { text: '"Ana Ekrana Ekle" → Ekle.' })),
      el('p', { class: 'metin-bs', text: 'Kurduktan sonra uçak modunda da açılır. Veriler yalnızca bu telefonda durur.' }),
    ));

    a.appendChild(bolumBaslik('Tehlikeli bölge', null));
    a.appendChild(el('div', { class: 'ayar-liste' },
      satir('Tüm verileri sil', 'İki kez onay ister', el('button', { class: 'dugme dugme--kucuk dugme--tehlike', type: 'button', onclick: hepsiniSil }, 'Sil')),
    ));

    a.appendChild(el('p', { class: 'metin-bs metin-soluk', style: { marginTop: '18px', textAlign: 'center' },
      text: `Hayal Atölyem · sürüm 1 · depolama: ${depo.depolamaModu() === 'ls' ? 'yedek modu' : 'cihaz içi (IndexedDB)'}` }));

    ustCiz({ baslik: 'Ayarlar', altBaslik: 'Verilerin cihazında kalır', sagEylemler: [] });
  }

  ciz();
  return { ad: 'ayarlar' };
}

function yuzde(v) { return Math.round((Number(v) || 0) * 100); }