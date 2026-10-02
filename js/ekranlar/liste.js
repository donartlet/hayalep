// 1) Ana ekran: hayal listesi, arama, durum filtresi, sıralama.
'use strict';
import { el, temizle, para, tarih } from '../ui/bilesen.js';
import * as depo from '../veri/depo.js';
import { sirala, toplamMaliyet, onerilenPuan, durumBilgisi } from '../veri/puanlama.js';
import { DURUMLAR, VARSAYILAN_AYARLAR } from '../veri/sema.js';
import { SIRALAMALAR } from '../veri/puanlama.js';
import { ustCiz, altCiz, git, durum, temayiUygula } from '../ana.js';
import { bildir } from '../ui/geri.js';
import { tembelGorsel } from '../ui/gorsel.js';
import { durumBilgisi as durumBul } from '../veri/puanlama.js';

const gorunum = { ara: '', durum: 'hepsi', kategori: 'hepsi' };

function aranan(is, sorgu) {
  if (!sorgu) return true;
  const q = sorgu.toLocaleLowerCase('tr');
  const havuz = [
    is.baslik, is.aciklama, is.kategori,
    (is.notlar || []).filter(Boolean).map((n) => n.metin).join(' '),
    (is.malzemeler || []).filter(Boolean).map((m) => m.ad).join(' '),
    (is.adimlar || []).filter(Boolean).map((a) => a.baslik).join(' '),
    (is.ogrenilecekler || []).filter(Boolean).map((o) => o.konu).join(' '),
    (is.zorluklar || []).filter(Boolean).map((z) => z.sorun).join(' '),
  ].join(' ').toLocaleLowerCase('tr');
  return q.split(/\s+/).filter(Boolean).every((parca) => havuz.includes(parca));
}

function puanCubugu(puan, enBuyuk = 10) {
  const kap = el('span', { class: 'puan-cubugu', 'aria-label': `${puan || 0} / ${enBuyuk}` });
  const adet = enBuyuk === 10 ? 5 : 5;
  const dolu = Math.round(((puan || 0) / enBuyuk) * adet);
  for (let i = 0; i < adet; i += 1) kap.appendChild(el('span', { class: 'puan-cubugu__nokta' + (i < dolu ? ' dolu' : '') }));
  return kap;
}

export function kartDugumu(is) {
  const d = durumBilgisi(is.durum);
  const maliyet = toplamMaliyet(is);
  const kart = el('button', { class: 'hayal-kart', type: 'button', onclick: () => git(`#/hayal/${is.id}`) });

  kart.appendChild(el('div', { class: 'hayal-kart__baslik', text: is.baslik || 'Başlıksız' }));

  if (is.fotoId) {
    const img = el('img', { class: 'hayal-kart__gorsel', alt: '', loading: 'lazy', decoding: 'async' });
    tembelGorsel(img, is.fotoId);
    kart.appendChild(img);
  }

  kart.appendChild(el('div', { class: 'rozetlar hayal-kart__genis' },
    el('span', { class: `rozet ${d.rozet}`, text: d.ad }),
    is.kategori ? el('span', { class: 'rozet', text: is.kategori }) : null,
    is.demo ? el('span', { class: 'rozet rozet--uyari', text: 'DEMO' }) : null,
  ));

  kart.appendChild(el('div', { class: 'hayal-kart__satir hayal-kart__genis' },
    el('span', { class: 'metin-bs metin-soluk', text: 'İstek' }),
    puanCubugu(is.istekPuani, 10),
    el('span', { class: 'metin-bs', text: `${is.istekPuani || '—'}/10` }),
  ));

  const ogeler = [];
  if (maliyet) ogeler.push(`Maliyet ${para(maliyet)}`);
  if (is.butce) ogeler.push(`Bütçe ${para(is.butce)}`);
  if (is.hedefTarih) ogeler.push(`Hedef ${tarih(is.hedefTarih)}`);
  ogeler.push(`${(is.adimlar || []).length} adım`);
  if ((is.malzemeler || []).length) ogeler.push(`${is.malzemeler.length} malzeme`);
  kart.appendChild(el('div', { class: 'hayal-kart__meta hayal-kart__genis', text: ogeler.join(' · ') }));

  return kart;
}

export async function listeEkrani() {
  const a = temizle(document.getElementById('ana'));
  const ayar = { ...VARSAYILAN_AYARLAR, ...durum.ayarlar };
  let isler = await depo.islerGetir();
  const toplamKayit = isler.length;

  const tur = document.createElement('div');

  async function yenile() {
    isler = await depo.islerGetir();
    tur.textContent = '';
    tur.appendChild(listeIcerigi());
  }

  function filtreli() {
    let liste = isler.filter((i) => aranan(i, gorunum.ara));
    if (gorunum.durum !== 'hepsi') liste = liste.filter((i) => i.durum === gorunum.durum);
    if (gorunum.kategori !== 'hepsi') liste = liste.filter((i) => (i.kategori || 'Diğer') === gorunum.kategori);
    return sirala(liste, { ...ayar, siralama: gorunum.siralama || ayar.siralama });
  }

  function listeIcerigi() {
    const kutu = el('div');
    const liste = filtreli();
    const demoSayisi = isler.filter((i) => i.demo).length;

    if (!isler.length) {
      kutu.appendChild(el('div', { class: 'bos' },
        el('div', { class: 'bos__simge', text: '🎯' }),
        el('p', { class: 'bos__baslik', text: 'Henüz hayal yok' }),
        el('p', { class: 'bos__metin', text: 'İlk hayalini yaz: ne yapmak istiyorsun?' }),
        el('button', { class: 'dugme dugme--ana', type: 'button', onclick: () => git('#/hayal/yeni') }, '+ Hayal ekle')));
      return kutu;
    }

    // Özet şeridi
    const aktifToplam = isler.filter((i) => i.durum !== 'tamamlandi' && i.durum !== 'ertelendi');
    const butceToplam = isler.reduce((t, i) => t + (Number(i.butce) || 0), 0);
    const maliyetToplam = isler.reduce((t, i) => t + toplamMaliyet(i), 0);
    kutu.appendChild(el('div', { class: 'ozet-serit' },
      el('div', { class: 'ozet-kutu' },
        el('div', { class: 'ozet-kutu__deger', text: String(aktifToplam.length) }),
        el('div', { class: 'ozet-kutu__etiket', text: 'Aktif hayal' })),
      el('div', { class: 'ozet-kutu' },
        el('div', { class: 'ozet-kutu__deger', text: butceToplam ? para(butceToplam) : '—' }),
        el('div', { class: 'ozet-kutu__etiket', text: 'Toplam bütçe' })),
      el('div', { class: 'ozet-kutu' },
        el('div', { class: 'ozet-kutu__deger', text: maliyetToplam ? para(maliyetToplam) : '—' }),
        el('div', { class: 'ozet-kutu__etiket', text: 'Toplam maliyet' })),
    ));

    if (!liste.length) {
      kutu.appendChild(el('div', { class: 'bos' },
        el('div', { class: 'bos__simge', text: '🔍' }),
        el('p', { class: 'bos__baslik', text: 'Sonuç yok' }),
        el('p', { class: 'bos__metin', text: 'Aramayı veya filtreyi değiştir.' })));
    } else {
      const siraAdi = (SIRALAMALAR.find((s) => s.kod === (gorunum.siralama || ayar.siralama)) || SIRALAMALAR[0]).ad;
      kutu.appendChild(el('p', { class: 'metin-bs metin-soluk', style: { margin: '0 0 8px 2px' }, text: `${liste.length} kayıt · ${siraAdi}` }));
      for (const is of liste) kutu.appendChild(kartDugumu(is));
    }

    if (demoSayisi) {
      kutu.appendChild(el('p', { class: 'metin-bs metin-soluk', style: { marginTop: '14px', textAlign: 'center' } },
        `${demoSayisi} demo kayıt var. Ayarlar → Demo kayıtlarından silebilirsin.`));
    }
    return kutu;
  }

  function aracCubugu() {
    const arama = el('input', {
      class: 'girdi', type: 'search', placeholder: 'Hayallerde ara…', value: gorunum.ara,
      'aria-label': 'Ara',
      oninput: (olay) => { gorunum.ara = olay.target.value; tur.textContent = ''; tur.appendChild(listeIcerigi()); },
    });
    const temizleDugmesi = gorunum.ara
      ? el('button', { class: 'arac__temizle', type: 'button', 'aria-label': 'Aramayı temizle', onclick: () => { gorunum.ara = ''; yenile(); } }, '✕')
      : null;

    const durumSerit = el('div', { class: 'durum-serit', role: 'tablist', 'aria-label': 'Durum filtresi' });
    const durumDugmeleri = [{ kod: 'hepsi', ad: 'Hepsi' }, ...DURUMLAR];
    for (const d of durumDugmeleri) {
      durumSerit.appendChild(el('button', {
        class: 'durum__dugme', type: 'button', 'aria-pressed': gorunum.durum === d.kod ? 'true' : 'false',
        onclick: () => { gorunum.durum = d.kod; yenile(); yenileArac(); },
      }, d.ad));
    }

    const siralamaSec = el('select', {
      class: 'secim', 'aria-label': 'Sıralama',
      onchange: (olay) => { gorunum.siralama = olay.target.value; durum.ayarlar.siralama = olay.target.value; depo.ayarYaz('genel', durum.ayarlar); yenile(); },
    }, SIRALAMALAR.map((s) => el('option', { value: s.kod, selected: (gorunum.siralama || ayar.siralama) === s.kod }, s.ad)));

    const filtreSec = el('select', {
      class: 'secim', 'aria-label': 'Kategori',
      onchange: (olay) => { gorunum.kategori = olay.target.value; yenile(); },
    },
      el('option', { value: 'hepsi', selected: gorunum.kategori === 'hepsi' }, 'Tüm kategoriler'),
      [...new Set(isler.map((i) => i.kategori || 'Diğer'))].sort((x, y) => x.localeCompare(y, 'tr'))
        .map((k) => el('option', { value: k, selected: gorunum.kategori === k }, k)));

    return el('div', { class: 'arac' },
      el('div', { class: 'arac__ara' },
        el('span', { class: 'arac__simge', text: '🔍', 'aria-hidden': 'true' }), arama, temizleDugmesi),
      durumSerit,
      el('div', { class: 'filtre-satir' }, siralamaSec, filtreSec),
    );
  }

  function yenileArac() {
    const eski = a.querySelector('.arac');
    if (eski) eski.replaceWith(aracCubugu());
  }

  altCiz('hayaller');
  a.appendChild(aracCubugu());
  a.appendChild(tur);
  tur.appendChild(listeIcerigi());

  const ozetMetni = toplamKayit === 1 ? '1 hayal' : `${toplamKayit} hayal`;
  ustCiz({
    baslik: 'Hayal Atölyem',
    altBaslik: ozetMetni,
    sagEylemler: [
      el('button', {
        class: 'dugme dugme--ana', type: 'button', onclick: () => git('#/hayal/yeni'),
      }, '+ Yeni'),
    ],
  });

  return { ad: 'liste' };
}